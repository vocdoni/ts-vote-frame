FROM node:20

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./

RUN npm install -g pnpm
RUN pnpm i

COPY . .

RUN pnpm build

EXPOSE 5173

CMD ["pnpm", "start"]
