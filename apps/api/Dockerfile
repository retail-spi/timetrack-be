# TimeTrack API — Francois Dive <divefrancois@gmail.com> — SPI Global Play Retail 2026

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN apk add --no-cache openssl && npm install

COPY . .
RUN npx prisma generate
RUN npm run build

# ── Stage 2: Production ───────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json

COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./entrypoint.sh"]
