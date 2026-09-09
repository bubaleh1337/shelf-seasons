# Shelf Seasons 0.14.1 — дневник чтения на Windows

Проект уже настроен на Supabase `shelf-seasons-dev`. Секрет Google OAuth в
архиве не нужен: он должен оставаться только в Google Cloud и Supabase.

## 1. Проверьте миграции Supabase

1. Откройте **Supabase → SQL Editor → New query**.
2. Если миграции прошлых версий ещё не запускались, примените их по порядку из
   `supabase/migrations`.
3. Для обновления на 0.14.0 целиком выполните файл
   `supabase/migrations/202609090001_reading_progress_and_recap_deduplication.sql`.
   Он добавляет текущую страницу и автоматический расчёт процентов. Старые
   записи не удаляются; дубликаты безопасно скрываются на уровне итогов.

## 2. Распакуйте проект

Если папка `P:\Projects\shelf-seasons` уже связана с GitHub, сохраните в ней
папку `.git`, а остальные файлы замените содержимым архива.

## 3. Запустите проверку

```powershell
Set-Location P:\Projects\shelf-seasons\shelf-seasons
.\UPDATE_TO_0.14.1.ps1
npm ci
npm run release:check
npm run dev
```

Откройте `http://localhost:3000/ru/sign-in` и войдите через Google.

После входа проверьте фон на компьютере и телефоне, внесите текущую страницу
через «Отметить чтение» и откройте месячные и годовые «Итоги».

## 4. Отправьте обновление в GitHub

```powershell
git add -A
git commit -m "fix: reading progress recaps and seasonal layout"
git push origin main
```

Файл `.env.local` специально исключён из Git. Это правильно: локальная
конфигурация остаётся на компьютере. В Vercel нужно добавить URL Supabase и
publishable key; адрес приложения Vercel определяет автоматически.
