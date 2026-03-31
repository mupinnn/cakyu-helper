FROM oven/bun:1.3.3-alpine AS base
RUN apk update
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS prepare
RUN bun add -g turbo@^2
COPY . .
RUN turbo prune "@cakyu-helper/api" --docker

FROM base AS builder
COPY --from=prepare /app/out/json/ .
COPY --from=prepare /app/out/bun.lock ./bun.lock

RUN bun ci
COPY --from=prepare /app/out/full/ .
RUN bun turbo build

FROM base AS runner
WORKDIR /app
COPY --from=builder /app/apps/api/cakyu-helper-api ./cakyu-helper-api

EXPOSE 3000
CMD ["./cakyu-helper-api"]

