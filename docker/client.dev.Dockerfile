FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@10.20.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/client/package.json ./apps/client/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile --ignore-scripts

COPY apps/client ./apps/client
COPY packages ./packages

RUN pnpm build:shared
RUN echo "VITE_SERVER_URL=http://localhost" > ./apps/client/.env
RUN echo "VITE_TLDRAW_LICENSE_KEY=tldraw-2026-05-02/WyJZSkZsc2pjcSIsWyIqIl0sMTYsIjIwMjYtMDUtMDIiXQ.mM+cQXrh4f5n/gDi7LGdUOgc+7EN+NaSaVS0vAxB19qcatvaf9oCNuHR01VLucuSK3cgCs/kMEyNOjpTDSVcag" >> ./apps/client/.env
RUN pnpm build:client

FROM nginx:alpine

COPY --from=builder /app/apps/client/dist /usr/share/nginx/html

COPY docker/nginx.dev.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]