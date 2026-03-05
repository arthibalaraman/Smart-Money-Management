FROM node:18-alpine

WORKDIR /app

# Install dependencies first (layer cache)
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 5000

# Push DB schema then start the server
CMD ["sh", "-c", "npx prisma db push && node server/index.js"]
