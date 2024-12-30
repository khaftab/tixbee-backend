# -----------------------------------
# Development Stage
# This stage is used for local development with live reload.
# -----------------------------------
  FROM node:20-alpine AS development
  WORKDIR /usr/src/app
  
  # Install dependencies
  COPY package.json package-lock.json ./
  ENV NODE_ENV=development
  RUN npm install
  
  # Copy source code
  COPY . .
  
  # Start the app in development mode
  CMD ["npm", "run", "dev"]
  
  # -----------------------------------
  # Build Stage
  # This stage compiles TypeScript to JavaScript.
  # -----------------------------------
  FROM node:20-alpine AS build
  WORKDIR /usr/src/app
  
  # Install production + dev dependencies
  COPY package.json package-lock.json ./
  RUN npm ci
  
  # Copy source code and build it
  COPY . .
  RUN npm run build
  
  # -----------------------------------
  # Production Dependencies Stage
  # Install only production dependencies.
  # -----------------------------------
  FROM node:20-alpine AS production-dependencies
  WORKDIR /usr/src/app
  
  # Install production dependencies only
  COPY package.json package-lock.json ./
  RUN npm ci --omit=dev
  
  # -----------------------------------
  # Production Stage
  # This is the minimal runtime image.
  # -----------------------------------
  FROM gcr.io/distroless/nodejs20-debian11 AS production
  WORKDIR /usr/src/app
  
  # Copy production dependencies and built files
  COPY --from=production-dependencies /usr/src/app/node_modules ./node_modules
  COPY --from=build /usr/src/app/dist ./dist
  
  # Set non-root user for security
  USER 65532:65532
  
  # Set production environment
  ENV NODE_ENV=production
  
  # Command to start the application
  CMD ["dist/server.js"]
  
# docker build --target development -t auth/dev . (development)
# Executes till the development stage.

# docker build -t auth/prod . (production)
# If no -target is not specified, docker will execute last stage by default. Since, last stage depends on previous stages (except development) it will execute those stages. Hence, development stage will be ignored