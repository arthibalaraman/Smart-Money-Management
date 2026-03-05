FROM node:20-alpine

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
CMD ["sh", "-c", "npx prisma db push && node server/index.js"]
