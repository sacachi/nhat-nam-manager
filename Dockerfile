FROM node:20-bookworm-slim AS base

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Install deps
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# Build app
FROM deps AS build
COPY . .
RUN npx prisma generate
RUN npm run build
RUN npm prune --omit=dev

# Runtime
FROM base AS runner

ENV NODE_ENV=production
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000
ENV PORT=3000
ENV DATABASE_URL=file:/app/data/dev.db?connection_limit=1

COPY --from=build /app/.output ./.output
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/prisma ./prisma

RUN mkdir -p /app/data

EXPOSE 3000

CMD ["sh","-c","npx prisma db push && npx prisma db seed && node .output/server/index.mjs"]