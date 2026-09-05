# Shelf Seasons 0.3.1 — первый запуск на Windows

Проект уже настроен на Supabase `shelf-seasons-dev`. Секрет Google OAuth в
архиве не нужен: он должен оставаться только в Google Cloud и Supabase.

## 1. Один раз подготовьте Supabase

1. Откройте **Supabase → SQL Editor → New query**.
2. Скопируйте туда целиком файл
   `supabase/migrations/202609050001_stage_2_profiles.sql`.
3. Нажмите **Run**. Запрос должен завершиться без ошибок.
4. Откройте **Authentication → URL Configuration** и задайте:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`

## 2. Распакуйте проект

Если папка `P:\Projects\shelf-seasons` уже связана с GitHub, сохраните в ней
папку `.git`, а остальные файлы замените содержимым архива.

## 3. Запустите проверку

```powershell
Set-Location P:\Projects\shelf-seasons
npm ci
npm run test:connected
npm test
npm run dev
```

Откройте `http://localhost:3000/ru/sign-in` и войдите через Google.

Если `npm run test:connected` сообщает, что таблица `profiles` не найдена,
значит SQL из первого раздела ещё не был применён.

## 4. Отправьте обновление в GitHub

```powershell
git add .
git commit -m "chore: connect Supabase development environment"
git push origin main
```

Файл `.env.local` специально исключён из Git. Это правильно: локальная
конфигурация остаётся на компьютере, а для будущего Vercel-деплоя те же три
переменные добавляются в настройках проекта Vercel.
