FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy application source
COPY . .

# Expose the internal port (defined as 5000 in server.js)
EXPOSE 5000

# Start the application
CMD ["node", "server.js"]
