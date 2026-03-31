FROM oven/bun:1.3.3-alpine AS base
RUN apk update
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS prepare
RUN bun add -g turbo@^2
COPY . .
RUN turbo prune "@cakyu-helper/web" --docker

FROM base AS builder
COPY --from=prepare /app/out/json/ .
COPY --from=prepare /app/out/bun.lock ./bun.lock

RUN bun ci
COPY --from=prepare /app/out/full/ .
RUN bun turbo build

FROM nginx:alpine-slim AS runner
COPY apps/web/nginx /etc/nginx/conf.d
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

