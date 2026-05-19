# ==========================================
# STAGE 1: Multi-Stage Production Build
# ==========================================
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependency mappings
COPY package*.json ./

# Install packages with peer-dependency isolation
RUN npm install --legacy-peer-deps

# Copy workspace assets
COPY . .

# Compile TypeScript and build production bundle
RUN npm run build

# ==========================================
# STAGE 2: High-Performance Nginx Serve
# ==========================================
FROM nginx:1.25-alpine AS serve

# Copy compiled static distribution assets to nginx server roots
COPY --from=build /app/dist /usr/share/nginx/html

# Copy our custom Nginx routing gateway configurations
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
