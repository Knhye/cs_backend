# 빌드
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
COPY tsconfig*.json ./

RUN npm ci
RUN npx prisma generate

COPY src ./src

RUN npm run build

# 실행
FROM node:20-alpine AS runner

RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

COPY --from=builder --chown=app:app /app/package*.json ./
COPY --from=builder --chown=app:app /app/dist ./dist
COPY --from=builder --chown=app:app /app/prisma ./prisma
COPY --from=builder --chown=app:app /app/node_modules ./node_modules

USER app

EXPOSE 8080

CMD ["node", "dist/src/main.js"]