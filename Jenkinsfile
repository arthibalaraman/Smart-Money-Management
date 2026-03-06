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
                echo '🔍 Diagnosing port status before cleanup...'
                sh '''
                    # Show what is currently using the ports
                    (lsof -i:3000 || true)
                    (netstat -tulpn | grep :3000 || true)
                    
                    echo '🧹 Cleaning up old containers and ports...'
                    
                    # 1. Stop containers belonging to THIS project
                    docker compose -f ${DOCKER_COMPOSE_FILE} down --remove-orphans --timeout 15 || true
                    
                    # 2. Stop ANY docker container using our target ports (3000, 5000)
                    echo "🔍 Checking for any other containers on ports 3000/5000..."
                    docker ps -q --filter "publish=3000" | xargs -r docker stop || true
                    docker ps -q --filter "publish=5000" | xargs -r docker stop || true
                    
                    # 3. Force kill any remaining host processes on these ports
                    for port in 3000 5000; do
                        pid=$(lsof -ti:$port || true)
                        if [ -n "$pid" ]; then
                            echo "Found process $pid on port $port. Killing..."
                            kill -9 $pid || true
                        fi
                    done
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
