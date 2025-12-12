# Инструкция по деплою на Vercel

## Быстрый старт

1. **Закоммитьте код в Git:**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push
   ```

2. **Подключите проект к Vercel:**
   - Зайдите на [vercel.com](https://vercel.com)
   - Войдите через GitHub
   - Нажмите "New Project"
   - Импортируйте ваш репозиторий

3. **Настройте переменные окружения:**
   
   В настройках проекта → Environment Variables добавьте:
   
   ```
   DATABASE_URL=postgresql://user:password@host:port/database
   NEXTAUTH_URL=https://your-domain.vercel.app
   NEXTAUTH_SECRET=your-secret-key-here-min-32-chars
   ```
   
   Для генерации `NEXTAUTH_SECRET`:
   ```bash
   openssl rand -base64 32
   ```

4. **Настройте PostgreSQL:**
   
   Рекомендуется использовать:
   - [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) (интеграция с Vercel)
   - [Neon](https://neon.tech) (бесплатный план)
   - [Supabase](https://supabase.com) (бесплатный план)
   
   После создания базы данных, скопируйте connection string в `DATABASE_URL`

5. **Деплой:**
   - Vercel автоматически определит Next.js проект
   - Нажмите "Deploy"
   - Дождитесь завершения сборки

## Важные замечания

- Убедитесь, что база данных доступна из интернета (не localhost)
- После деплоя схема базы данных создастся автоматически при первом запросе
- Для админ-панели создайте первого админа через SQL или используйте переменные окружения `ADMIN_EMAIL` и `ADMIN_PASSWORD`

## Исправление ошибки типизации

Перед деплоем нужно исправить ошибку типизации в `lib/auth.ts`. Функция `authorize` должна возвращать правильный тип User.

