FROM node:20-alpine

WORKDIR /app

# Install deps
COPY package.json package-lock.json ./
RUN npm ci

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

EXPOSE 5000

ENV NODE_ENV production

CMD ["node", "dist/app.js"]
