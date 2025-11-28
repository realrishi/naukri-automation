# Base image with Node 20
FROM mcr.microsoft.com/playwright:focal

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
