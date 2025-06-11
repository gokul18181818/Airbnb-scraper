# Use Microsoft's official Playwright Docker image (already has all browsers installed)
FROM mcr.microsoft.com/playwright:v1.40.0-jammy

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create data directory for SQLite database
RUN mkdir -p data

# Expose port (if needed for health checks)
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV HEADLESS=true

# Start the application
CMD ["npm", "start"] 