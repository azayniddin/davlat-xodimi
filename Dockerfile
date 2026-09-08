FROM node:20-alpine

WORKDIR /app

# Paketlarni nusxalash
COPY package*.json ./

# Qaramliklarni o'rnatish
RUN npm install --omit=dev

# Loyiha kodlarini nusxalash
COPY . .

# Port
ENV PORT=5050
EXPOSE 5050

# Serverni ishga tushirish
CMD ["node", "backend/src/server.js"]
