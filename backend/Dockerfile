# /backend/Dockerfile

# --- Stage 1: Base Image ---
FROM node:18-alpine AS base
WORKDIR /app

# --- Stage 2: Install Production Dependencies ---
# This layer is cached by Docker and only rebuilds if package.json changes.
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm install --only=production

# --- Stage 3: Build the App ---
# This stage copies your application code and the installed dependencies.
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# --- Stage 4: Final Production Image ---
# This is the small, optimized image that will run.
FROM base AS production
ENV NODE_ENV=production

# Copy the final application files from the 'builder' stage
COPY --from=builder /app ./

# Expose the port the app runs on
EXPOSE 5000

# The command to run when the container starts
CMD ["node", "server.js"]