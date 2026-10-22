FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Sinh Prisma Client
RUN npx prisma generate

EXPOSE 3001

# Tự động đẩy bảng vào PostgreSQL và chạy Backend
CMD ["sh", "-c", "npx prisma db push && npm run start:dev"]