FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# Source is mounted via docker-compose volume — no COPY . . needed

EXPOSE 3000

CMD ["pnpm", "dev"]
