FROM node:22-alpine

WORKDIR /app

ARG APP_VERSION=1.1.5
ARG APP_REVISION=local

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV APP_VERSION=${APP_VERSION}
ENV APP_REVISION=${APP_REVISION}

COPY package.json ./
COPY server.js ./
COPY public ./public
RUN printf "%s" "$APP_REVISION" > .current-revision

EXPOSE 3000

CMD ["node", "server.js"]
