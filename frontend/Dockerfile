# syntax=docker/dockerfile:1
FROM oven/bun:1-alpine AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run check && bun run build

FROM oven/bun:1-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOST=0.0.0.0
RUN addgroup -g 1001 -S app && adduser -S app -u 1001 -G app
COPY --from=builder --chown=app:app /app/build ./build
COPY --from=builder --chown=app:app /app/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/package.json ./package.json
USER app
EXPOSE 3000
CMD ["bun", "build/index.js"]
