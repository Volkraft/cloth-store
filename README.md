# Clothing Store

Магазин одежды на Next.js 14 с админ-панелью, корзиной и аутентификацией.

## Технологии

- Next.js 16
- TypeScript
- Tailwind CSS
- PostgreSQL
- Next-auth
- React Hook Form
- Zod

## Деплой на Vercel

### Шаги для деплоя:

1. **Подготовка репозитория:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <ваш-репозиторий>
   git push -u origin main
   ```

2. **Подключение к Vercel:**
   - Зайдите на [vercel.com](https://vercel.com)
   - Войдите через GitHub
   - Нажмите "New Project"
   - Импортируйте ваш репозиторий

3. **Настройка переменных окружения в Vercel:**
   
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

4. **Настройка PostgreSQL:**
   
   Рекомендуется использовать:
   - [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) (интеграция с Vercel)
   - [Neon](https://neon.tech) (бесплатный план)
   - [Supabase](https://supabase.com) (бесплатный план)
   
   После создания базы данных, скопируйте connection string в `DATABASE_URL`

5. **Деплой:**
   - Vercel автоматически определит Next.js проект
   - Нажмите "Deploy"
   - Дождитесь завершения сборки

### Важные замечания:

- Убедитесь, что база данных доступна из интернета (не localhost)
- После деплоя схема базы данных создастся автоматически при первом запросе
- Для админ-панели создайте первого админа через SQL:
  ```sql
  INSERT INTO users (id, email, password_hash, name) 
  VALUES ('admin-id', 'admin@example.com', '$2a$10$...', 'Admin');
  ```
  (password_hash должен быть захеширован через bcrypt)

## Локальная разработка

```bash
npm install
npm run dev
```

Создайте `.env.local`:
```
DATABASE_URL=postgresql://user:password@localhost:5432/clothing_store
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

