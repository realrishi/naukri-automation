# Update to the latest Playwright image that matches your package version
FROM mcr.microsoft.com/playwright:v1.57.0-noble
# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install Node dependencies
RUN npm ci

# Copy the rest of your code
COPY . .

# Environment variables (optional defaults)
ENV EMAIL="rishiraj.pal.work@gmail.com"
ENV PASSWORD="Rishi@276"

# Command to run your automation
CMD ["node", "index.js"]
