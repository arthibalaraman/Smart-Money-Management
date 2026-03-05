pipeline {
    agent any

    environment {
        COMPOSE_PROJECT_NAME = 'smarttracker'
        DOCKER_COMPOSE_FILE  = 'docker-compose.yml'
    }

    options {
        // Keep only the last 5 builds
        buildDiscarder(logRotator(numToKeepStr: '5'))
        // Fail if the pipeline takes more than 20 minutes
        timeout(time: 20, unit: 'MINUTES')
        // Prevent concurrent builds on the same branch
        disableConcurrentBuilds()
    }

    stages {

        stage('Checkout') {
            steps {
                echo '📥 Pulling latest code...'
                checkout scm
            }
        }

        stage('Cleanup') {
            steps {
                echo '🧹 Cleaning up old containers and ports...'
                sh '''
                    docker compose -f ${DOCKER_COMPOSE_FILE} down --remove-orphans --timeout 15 || true
                    # Force kill any process on our app ports if they are still busy (using fuser or lsof)
                    (if command -v fuser >/dev/null; then fuser -k 3000/tcp || true; fuser -k 5000/tcp || true; fi)
                    (if command -v lsof >/dev/null; then lsof -ti:3000 | xargs kill -9 || true; lsof -ti:5000 | xargs kill -9 || true; fi)
                '''
            }
        }

        stage('Lint & Validate') {
            steps {
                echo '🔍 Validating Docker Compose file...'
                sh 'docker compose -f ${DOCKER_COMPOSE_FILE} config'
            }
        }

        stage('Build Images') {
            steps {
                echo '🏗️  Building Docker images...'
                sh '''
                    docker compose -f ${DOCKER_COMPOSE_FILE} build \
                        --no-cache \
                        --parallel
                '''
            }
        }


        stage('Deploy') {
            steps {
                echo '🚀 Starting new containers...'
                sh '''
                    docker compose -f ${DOCKER_COMPOSE_FILE} up \
                        --detach \
                        --force-recreate \
                        --remove-orphans
                '''
            }
        }

        stage('Health Check') {
            steps {
                echo '🩺 Waiting for services to be healthy...'
                sh '''
                    # Wait up to 60 seconds for backend to respond
                    attempt=0
                    until curl -sf http://localhost:5000/api/health > /dev/null || [ $attempt -ge 12 ]; do
                        echo "Waiting for backend... ($attempt/12)"
                        sleep 5
                        attempt=$((attempt+1))
                    done

                    if [ $attempt -ge 12 ]; then
                        echo "❌ Backend health check failed after 60s."
                        echo "--- Container Logs (Backend) ---"
                        docker compose -f ${DOCKER_COMPOSE_FILE} logs backend
                        echo "--- Container Logs (Database) ---"
                        docker compose -f ${DOCKER_COMPOSE_FILE} logs db
                        echo "--- Container Status ---"
                        docker compose -f ${DOCKER_COMPOSE_FILE} ps
                        exit 1
                    fi

                    echo "✅ Backend is healthy!"

                    # Wait for frontend
                    if curl -sf http://localhost:3000 > /dev/null; then
                        echo "✅ Frontend is healthy!"
                    else
                        echo "⚠️ Frontend check failed (non-fatal)"
                    fi
                '''
            }
        }
    }

    post {
        success {
            echo '''
            ✅ Pipeline SUCCESS
            ─────────────────────────────
            🌐 Frontend : http://localhost:3000
            ⚙️  Backend  : http://localhost:5000
            🗄️  Database : PostgreSQL (port 5432)
            '''
        }

        failure {
            echo '❌ Pipeline FAILED — printing container logs...'
            sh '''
                docker compose -f ${DOCKER_COMPOSE_FILE} logs --tail=50
            '''
        }

        always {
            echo '🧹 Cleaning up dangling Docker images...'
            sh 'docker image prune -f'
        }
    }
}
