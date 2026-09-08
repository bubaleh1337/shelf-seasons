# Shelf Seasons 0.11.0 — дневник чтения на Windows

Проект уже настроен на Supabase `shelf-seasons-dev`. Секрет Google OAuth в
архиве не нужен: он должен оставаться только в Google Cloud и Supabase.

## 1. Проверьте миграции Supabase

1. Откройте **Supabase → SQL Editor → New query**.
2. Если миграции прошлых версий ещё не запускались, примените их по порядку из
   `supabase/migrations`.
3. Для обновления с версии 0.10.0 на 0.11.0 новая SQL-миграция не нужна.

## 2. Распакуйте проект

Если папка `P:\Projects\shelf-seasons` уже связана с GitHub, сохраните в ней
папку `.git`, а остальные файлы замените содержимым архива.

## 3. Запустите проверку

```powershell
Set-Location P:\Projects\shelf-seasons\shelf-seasons
.\UPDATE_TO_0.11.0.ps1
npm ci
npm run release:check
npm run dev
```

Откройте `http://localhost:3000/ru/sign-in` и войдите через Google.

После входа откройте Библиотеку и проверьте сезонные полки. Текущий сезон должен
идти первым; нажатие на полку открывает плитку её книг.

## 4. Отправьте обновление в GitHub

```powershell
git add -A
git commit -m "feat: redesign seasonal shelves"
git push origin main
```

Файл `.env.local` специально исключён из Git. Это правильно: локальная
конфигурация остаётся на компьютере. В Vercel нужно добавить URL Supabase и
publishable key; адрес приложения Vercel определяет автоматически.
