FROM node:20-slim
WORKDIR /app
COPY package.json package-lock.json* .npmrc* ./ 2>/dev/null || true
RUN npm i
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
