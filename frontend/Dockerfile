# /frontend/Dockerfile

# --- Stage 1: Base Image ---
FROM node:18-alpine AS base
WORKDIR /app

# --- Stage 2: Install All Dependencies ---
# We need all dependencies (including devDependencies) to build the React app.
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm install

# --- Stage 3: Build the React App ---
# This stage creates the static production files in the /app/build folder.
FROM deps AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- Stage 4: Final Production Image with Nginx ---
# Use a lightweight Nginx web server to serve the static files.
FROM nginx:1.21-alpine

# Copy the built files from the 'builder' stage's /app/build folder
# into Nginx's public web directory.
COPY --from=builder /app/build /usr/share/nginx/html

# Copy our custom Nginx configuration file to handle React Router.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose the port Nginx runs on
EXPOSE 80