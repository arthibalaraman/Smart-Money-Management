FROM node:20-alpine
RUN apk add --no-cache openssl

WORKDIR /app

# Install dependencies first (layer cache)
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Generate Prisma client with a dummy URL to satisfy Prisma 7 validation
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

EXPOSE 5000

# Push DB schema then start the server
# Push DB schema then start the server with logging
# Push DB schema then start the server with logging
CMD ["sh", "-c", "echo 'Running prisma db push...' && npx prisma db push --accept-data-loss && echo 'Starting server...' && node server/index.js || (echo '❌ Backend failed to start' && exit 1)"]
