FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@10.20.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/client/package.json ./apps/client/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile --ignore-scripts

COPY apps/client ./apps/client
COPY packages ./packages

WORKDIR /app/packages/shared
RUN pnpm build

WORKDIR /app/apps/client
RUN echo "VITE_SERVER_URL=https://www.moyo.asia" > .env
RUN pnpm build

FROM nginx:alpine

COPY --from=builder /app/apps/client/dist /usr/share/nginx/html

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]
