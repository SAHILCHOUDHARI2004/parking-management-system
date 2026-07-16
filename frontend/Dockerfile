# Stage 1: Build stage
FROM node:20-alpine as build

WORKDIR /app

# Install dependencies first (leverage Docker layer caching)
COPY package*.json ./
RUN npm ci

# Copy source and config files
COPY . .

# Set environment variable to empty string for production Nginx proxying
ENV VITE_API_URL=""

# Build the React app
RUN npm run build

# Stage 2: Production Nginx stage
FROM nginx:1.25-alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build output from Stage 1 to Nginx HTML folder
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
