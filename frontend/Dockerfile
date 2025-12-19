# Multi-stage build para React + Nginx

# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Variables de entorno para build time (Vite las necesita aquí)
ARG VITE_API_URL=studymate-backend-app-c3cwg6eccth0eeep.canadacentral-01.azurewebsites.net
ARG VITE_SUPABASE_URL=https://dviyviokllpcigejsfzg.supabase.co
ARG VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2aXl2aW9rbGxwY2lnZWpzZnpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MjMxNDEsImV4cCI6MjA3ODI5OTE0MX0.y6TE37anusLPOzNVIBQPv4vlT1VXxO7ConM0FR2Srwg

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN npm run build

# Stage 2: Production con Nginx
FROM nginx:1.25-alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuración de Nginx
RUN echo 'server { \
    listen 8080; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nginx-user -u 1001 -G nodejs && \
    chown -R nginx-user:nodejs /usr/share/nginx/html /var/cache/nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx-user:nodejs /var/run/nginx.pid

ENV PORT=8080
EXPOSE 8080

USER nginx-user

CMD ["nginx", "-g", "daemon off;"]
