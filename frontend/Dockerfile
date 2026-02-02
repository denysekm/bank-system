# Build stage
FROM node:20-alpine as build-stage

WORKDIR /app

# Arguments for build-time environment variables
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Context is now root (.), copy only frontend files explicitly
COPY package*.json ./
RUN npm install

# Copy source and public from root
COPY src ./src
COPY public ./public

RUN npm run build

# Production stage
FROM nginx:stable-alpine

# Copy built files from build-stage to nginx public folder
COPY --from=build-stage /app/build /usr/share/nginx/html

# Copy custom nginx config
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
