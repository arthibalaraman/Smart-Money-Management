# ─── Stage 1: Build ───────────────────────────────────────────
FROM node:18-alpine AS build

WORKDIR /app

# Install dependencies first (layer cache)
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source and build
COPY . .
RUN npm run build

# ─── Stage 2: Serve with Nginx ────────────────────────────────
FROM nginx:alpine

# Copy built React app
COPY --from=build /app/build /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
