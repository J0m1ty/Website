# Built by .github/workflows/docker.yml and pushed to ghcr.io/j0m1ty/landing-page.
FROM node:24-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/*
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install && pnpm run build
# server's production dependencies only, as plain folders (no workspace symlinks)
RUN pnpm --filter @site/server deploy --legacy --prod /out

FROM node:24-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /out/node_modules ./server/node_modules
COPY --from=build /app/server/package.json ./server/
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/client/dist ./client/dist
USER node
EXPOSE 3000
CMD ["node", "server/dist/index.js"]
