# Build on a laptop or CI, not on the 2 GB VPS (the Vite build needs more RAM than the app).
FROM oven/bun:1.4.2 AS build
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/web/package.json apps/web/
COPY apps/server/package.json apps/server/
COPY packages/db/package.json packages/db/
COPY packages/shared/package.json packages/shared/
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM oven/bun:1.4.2-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json bun.lock ./
COPY apps/web/package.json apps/web/
COPY apps/server/package.json apps/server/
COPY packages/db/package.json packages/db/
COPY packages/shared/package.json packages/shared/
RUN bun install --frozen-lockfile --production
COPY apps/server apps/server
COPY packages packages
COPY --from=build /app/apps/web/dist apps/web/dist
USER bun
EXPOSE 3000
CMD ["bun", "apps/server/src/index.ts"]
