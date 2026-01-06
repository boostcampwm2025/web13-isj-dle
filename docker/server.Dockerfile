FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@10.20.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json ./apps/server/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile

COPY apps/server ./apps/server
COPY packages ./packages

WORKDIR /app/apps/server
RUN pnpm build

FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm@10.20.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json ./apps/server/
COPY packages/shared/package.json ./packages/shared/

WORKDIR /app/apps/server
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

COPY --from=builder /app/apps/server/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]
