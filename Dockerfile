# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
# Note: Using npm since package-lock.json exists
COPY package*.json ./
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine



# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
