FROM node:20-alpine

WORKDIR /src

# Copy package definitions
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy application code
COPY . .

# Expose backend REST and WebSocket port
EXPOSE 8000

# ENV NODE_ENV=production
ENV PORT=8000

# Start server
CMD ["npm", "start"]
