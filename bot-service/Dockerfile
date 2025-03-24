FROM node:18-alpine

WORKDIR /app

# Установка зависимостей
COPY package*.json ./
RUN npm ci --only=production

# Копирование скомпилированного кода
COPY dist/ ./dist/

# Копирование файлов окружения
COPY .env.production ./.env.production

# Настройка переменных окружения
ENV NODE_ENV=production

# Открываем порт (если приложение будет использовать REST API)
EXPOSE 3000

# Запуск приложения
CMD ["node", "dist/index.js"] 