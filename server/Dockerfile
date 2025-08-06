# server/Dockerfile

# 1. Use the official Node.js 20 LTS image
FROM node:20-slim

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Copy package.json and package-lock.json first for caching
COPY package*.json ./

# 4. Install production dependencies
RUN npm install --omit=dev

# 5. Copy the rest of the application code
COPY . .

# 6. Build the TypeScript code into JavaScript
RUN npm run build

# 7. Expose the port the app will run on
EXPOSE 8080

# 8. Define the command to start the app
CMD [ "npm", "start" ]