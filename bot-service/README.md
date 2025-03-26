# NAKUPI Telegram Bot

Telegram бот для управления списком покупок, реализованный с использованием архитектуры Domain-Driven Design (DDD).

## Особенности

- Создание и управление категориями товаров
- Добавление товаров в список покупок
- Отметка товаров как купленные
- Хранение данных в MongoDB
- REST API для доступа к спискам покупок

## Архитектура

Проект построен в соответствии с принципами Domain-Driven Design:

### Слои приложения

1. **Слой предметной области (Domain Layer)** 
   - Сущности (entities)
   - Объекты-значения (value objects)
   - Агрегаты (aggregates)
   - Репозитории (repositories)
   - Доменные сервисы (domain services)

2. **Слой приложения (Application Layer)**
   - Сервисы приложения (application services)
   - DTO (data transfer objects)
   - Валидация

3. **Слой инфраструктуры (Infrastructure Layer)**
   - Реализация репозиториев
   - Базы данных
   - Внешние сервисы
   - Логирование и мониторинг

4. **Слой представления (Presentation Layer)**
   - Telegram бот
   - REST API

## Запуск проекта

### Предварительные требования

- Node.js 16+
- MongoDB
- Токен Telegram бота

### Установка и запуск

1. Клонируйте репозиторий:
```
git clone https://github.com/for7raid/Nakupi.git
cd nakupi/bot-service
```

2. Установите зависимости:
```
npm install
```

3. Создайте файл `.env` на основе `.env.example`:
```
cp .env.example .env
```

4. Отредактируйте файл `.env`, добавив ваш токен Telegram бота и настройки MongoDB.

5. Запустите приложение:
   - В режиме разработки: `npm run dev`
   - В production режиме: `npm start`

## API Endpoints

- `GET /api/categories` - Получить список категорий
- `POST /api/categories` - Создать новую категорию
- `GET /api/items` - Получить список товаров
- `POST /api/items` - Добавить новый товар
- `PUT /api/items/:id` - Обновить товар
- `DELETE /api/items/:id` - Удалить товар

## Команды Telegram бота

- `/start` - Начать работу с ботом
- `/help` - Получить справку
- `/add` - Добавить новый товар
- `/list` - Показать список покупок
- `/categories` - Управление категориями
