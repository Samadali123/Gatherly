FROM node:20-alpine AS build
WORKDIR /app

ARG VITE_GIPHY_API_KEY
ARG VITE_API_BASE_URL
ARG VITE_SOCKET_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN if [ -z "$VITE_GIPHY_API_KEY" ]; then unset VITE_GIPHY_API_KEY; else export VITE_GIPHY_API_KEY; fi; \
  if [ -z "$VITE_API_BASE_URL" ]; then unset VITE_API_BASE_URL; else export VITE_API_BASE_URL; fi; \
  if [ -z "$VITE_SOCKET_URL" ]; then unset VITE_SOCKET_URL; else export VITE_SOCKET_URL; fi; \
  npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
