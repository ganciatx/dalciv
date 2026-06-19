# Builds Tally from vendored source in deploy/tally/context (synced from ganciatx/tally).
FROM node:20-alpine AS build
WORKDIR /app
COPY context/ .
RUN npm ci && npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
