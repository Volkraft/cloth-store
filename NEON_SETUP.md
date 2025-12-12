# Настройка Neon Database для Clothing Store

## Пошаговая инструкция

### Шаг 1: Регистрация в Neon

1. Перейдите на [neon.tech](https://neon.tech)
2. Нажмите **"Sign Up"** или **"Get Started"**
3. Войдите через GitHub (рекомендуется) или создайте аккаунт

### Шаг 2: Создание проекта

1. После входа нажмите **"Create a project"**
2. Заполните форму:
   - **Project name**: `clothing-store` (или любое другое имя)
   - **Region**: выберите ближайший регион (например, `Europe (Frankfurt)`)
   - **PostgreSQL version**: оставьте по умолчанию (обычно 15 или 16)
3. Нажмите **"Create project"**

### Шаг 3: Получение Connection String

1. После создания проекта вы увидите дашборд Neon
2. Найдите раздел **"Connection Details"** или **"Connection String"**
3. Скопируйте строку подключения - она выглядит примерно так:
   ```
   postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```
   
   **Важно:** 
   - Строка уже содержит `?sslmode=require` - это правильно для Neon
   - Не публикуйте эту строку в открытом доступе (она содержит пароль)

### Шаг 4: Настройка в Vercel

1. Откройте ваш проект в [Vercel Dashboard](https://vercel.com/dashboard)
2. Перейдите в **Settings** → **Environment Variables**
3. Добавьте переменные:

   **DATABASE_URL:**
   - **Key**: `DATABASE_URL`
   - **Value**: вставьте скопированную строку из Neon
   - **Environments**: выберите все (Production, Preview, Development)
   - **Sensitive**: включите (чтобы скрыть значение)
   - Нажмите **"Save"**

   **NEXTAUTH_URL:**
   - **Key**: `NEXTAUTH_URL`
   - **Value**: `https://your-project-name.vercel.app` (замените на ваш домен)
   - **Environments**: все
   - Нажмите **"Save"**

   **NEXTAUTH_SECRET:**
   - **Key**: `NEXTAUTH_SECRET`
   - **Value**: сгенерируйте секретный ключ (см. ниже)
   - **Environments**: все
   - **Sensitive**: включите
   - Нажмите **"Save"**

### Шаг 5: Генерация NEXTAUTH_SECRET

Выполните в терминале:
```bash
openssl rand -base64 32
```

Или используйте онлайн-генератор: [generate-secret.vercel.app](https://generate-secret.vercel.app/32)

Скопируйте сгенерированную строку и вставьте в `NEXTAUTH_SECRET`

### Шаг 6: Перезапуск деплоя

1. В Vercel Dashboard перейдите в **Deployments**
2. Найдите последний деплой
3. Нажмите на три точки (⋮) → **Redeploy**
4. Подтвердите перезапуск

### Шаг 7: Проверка

1. После перезапуска откройте ваш сайт
2. Схема базы данных создастся автоматически при первом запросе
3. Если видите ошибку, проверьте:
   - Логи в Vercel (Deployments → View Function Logs)
   - Что все переменные окружения установлены правильно
   - Что Connection String из Neon скопирован полностью

## Локальная разработка с Neon

Для локальной разработки также можно использовать Neon:

1. Создайте файл `.env.local` в корне проекта:
```env
DATABASE_URL=postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
```

2. Запустите проект:
```bash
npm run dev
```

## Полезные ссылки

- [Neon Dashboard](https://console.neon.tech)
- [Neon Documentation](https://neon.tech/docs)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

## Решение проблем

### Ошибка подключения к базе данных

1. Проверьте, что Connection String скопирован полностью
2. Убедитесь, что база данных активна в Neon Dashboard
3. Проверьте, что в Connection String есть `?sslmode=require`

### База данных не создается автоматически

1. Откройте сайт в браузере
2. Сделайте любой запрос (например, зайдите на главную страницу)
3. Схема создастся при первом запросе к базе данных

### Проблемы с SSL

Код уже настроен для работы с SSL (для Neon). Если возникают проблемы:
- Убедитесь, что Connection String содержит `?sslmode=require`
- Проверьте логи в Vercel для деталей ошибки

