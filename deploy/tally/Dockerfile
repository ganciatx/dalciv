# Builds Tally from ganciatx/tally at image build time (Hostinger Docker Manager).
FROM node:20-alpine AS build
RUN apk add --no-cache git
RUN git clone --depth 1 https://github.com/ganciatx/tally.git /src
WORKDIR /src
RUN npm ci && npm run build

FROM nginx:1.27-alpine
COPY --from=build /src/deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/dist /usr/share/nginx/html
EXPOSE 80
