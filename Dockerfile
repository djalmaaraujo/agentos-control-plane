# --- build the SPA ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci || npm install
COPY . .
RUN npm run build

# --- serve static + proxy /api to AgentOS ---
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
# Only substitute our own vars; leave nginx runtime vars ($uri, $host) intact.
ENV NGINX_ENVSUBST_FILTER="^(OS_SECURITY_KEY|AGENTOS_UPSTREAM|CP_AUTH_TOKEN)$"
ENV AGENTOS_UPSTREAM="http://host.docker.internal:8000"
ENV CP_AUTH_TOKEN=""
EXPOSE 80
