FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

# --- THÊM 2 DÒNG NÀY VÀO ĐỂ FIX LỖI PRISMA ENGINE ---
RUN apk add --no-cache openssl
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
# ----------------------------------------------------

COPY . .

# Sinh Prisma Client
RUN npx prisma generate

EXPOSE 3001

# Tự động đẩy bảng vào PostgreSQL và chạy Backend
CMD ["sh", "-c", "npx prisma db push && npm run start:dev"]