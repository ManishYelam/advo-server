FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first to leverage Docker caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --production && npm cache clean --force

# Copy the application files
COPY ./dist /app

# Build the application using Webpack
# RUN npm run build

# Expose the application port (change if needed)
EXPOSE 5000

# Set the default command
CMD ["node", "final.js"]
