# Решение проблем с базой данных

## Ошибка ENOTFOUND (хост не найден)

**Ошибка:** `Error: getaddrinfo ENOTFOUND db.xxxxx.supabase.co`

### Причины:

1. **Неправильный Connection String**
   - Connection String скопирован не полностью
   - В строке есть лишние пробелы или символы
   - Используется старый/удаленный Connection String

2. **Проект Supabase приостановлен или удален**
   - На бесплатном плане проекты могут быть приостановлены после периода бездействия
   - Проект мог быть удален

3. **Проблемы с DNS**
   - Временные проблемы с разрешением DNS

### Решение:

#### 1. Проверьте Connection String в Vercel

1. Откройте Vercel Dashboard → ваш проект → Settings → Environment Variables
2. Найдите переменную `DATABASE_URL`
3. Убедитесь, что значение скопировано полностью
4. Проверьте формат:
   ```
   postgresql://user:password@host:port/database?sslmode=require
   ```

#### 2. Проверьте проект в Supabase

1. Зайдите в [Supabase Dashboard](https://app.supabase.com)
2. Убедитесь, что проект активен (не приостановлен)
3. Если проект приостановлен:
   - Нажмите "Restore" или "Resume"
   - Подождите несколько минут, пока проект восстановится

4. Получите новый Connection String:
   - Settings → Database → Connection string
   - Выберите "URI" или "Connection pooling"
   - Скопируйте строку подключения
   - Обновите `DATABASE_URL` в Vercel

#### 3. Для Supabase используйте правильный формат

Supabase предоставляет несколько типов Connection Strings:

**Для прямого подключения:**
```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**Для Connection Pooling (рекомендуется):**
```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
```

**Важно:**
- Замените `[YOUR-PASSWORD]` на ваш пароль базы данных
- Замените `[PROJECT-REF]` на ID вашего проекта
- Замените `[REGION]` на регион (например, `us-east-1`)

#### 4. Проверьте настройки SSL

Для Supabase Connection String должен содержать `?sslmode=require` в конце.

Если его нет, добавьте:
```
postgresql://...?sslmode=require
```

#### 5. Перезапустите деплой

После обновления `DATABASE_URL`:
1. В Vercel Dashboard → Deployments
2. Найдите последний деплой
3. Нажмите ⋮ → Redeploy
4. Подождите завершения деплоя

## Ошибка ECONNREFUSED (соединение отклонено)

**Причина:** База данных недоступна или порт заблокирован.

**Решение:**
1. Проверьте, что проект активен в Supabase/Neon
2. Убедитесь, что Connection String правильный
3. Проверьте, что порт в Connection String правильный (обычно 5432)

## Ошибка ETIMEDOUT (таймаут)

**Причина:** Подключение к базе данных занимает слишком много времени.

**Решение:**
1. Проверьте, что база данных активна
2. Для Neon: подождите до 30 секунд при первом подключении (база может "просыпаться")
3. Обновите страницу - код автоматически повторит попытку

## Проверка Connection String

### Формат для разных провайдеров:

**Neon:**
```
postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
```

**Supabase (прямое подключение):**
```
postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
```

**Supabase (Connection Pooling):**
```
postgresql://postgres.xxxxx:password@aws-0-region.pooler.supabase.com:6543/postgres?sslmode=require
```

**Vercel Postgres:**
```
postgres://user:password@host:5432/database
```

### Что проверить:

1. ✅ Строка начинается с `postgresql://` или `postgres://`
2. ✅ Содержит имя пользователя и пароль
3. ✅ Содержит правильный хост (не localhost)
4. ✅ Содержит порт (обычно 5432 или 6543 для pooling)
5. ✅ Содержит имя базы данных
6. ✅ Для Supabase/Neon содержит `?sslmode=require`

## Получение нового Connection String

### Supabase:
1. Зайдите в [Supabase Dashboard](https://app.supabase.com)
2. Выберите ваш проект
3. Settings → Database
4. Найдите "Connection string" или "Connection pooling"
5. Скопируйте строку (URI формат)
6. Замените `[YOUR-PASSWORD]` на ваш пароль

### Neon:
1. Зайдите в [Neon Dashboard](https://console.neon.tech)
2. Выберите ваш проект
3. Нажмите "Connection Details"
4. Скопируйте Connection String

## Полезные ссылки

- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Neon Connection Strings](https://neon.tech/docs/connect/connection-string)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

