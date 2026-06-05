# Build step using a lightweight Node base
FROM node:20-alpine

WORKDIR /app

# Install dependencies first for maximum layer caching efficiency
COPY package*.json ./
RUN npm install

# Copy configuration and client components
COPY . .

# Compile and build production-grade static optimization assets
RUN npm run build

EXPOSE 3000

# Boot up the production Next.js runner
CMD ["npm", "run", "start"]