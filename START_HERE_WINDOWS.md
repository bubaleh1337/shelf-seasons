# Shelf Seasons 0.7.0 — дневник чтения на Windows

Проект уже настроен на Supabase `shelf-seasons-dev`. Секрет Google OAuth в
архиве не нужен: он должен оставаться только в Google Cloud и Supabase.

## 1. Один раз добавьте серии в Supabase

1. Откройте **Supabase → SQL Editor → New query**.
2. Скопируйте туда целиком новый файл
   `supabase/migrations/202609070001_series.sql`.
3. Нажмите **Run**. Запрос должен завершиться без ошибок.
4. Старые миграции до `202609060001_completion_and_goals.sql` повторно не запускайте.

## 2. Распакуйте проект

Если папка `P:\Projects\shelf-seasons` уже связана с GitHub, сохраните в ней
папку `.git`, а остальные файлы замените содержимым архива.

## 3. Запустите проверку

```powershell
Set-Location P:\Projects\shelf-seasons\shelf-seasons
.\UPDATE_TO_0.7.0.ps1
npm ci
npm run test:connected
npm run release:check
npm run dev
```

Откройте `http://localhost:3000/ru/sign-in` и войдите через Google.

После входа откройте `http://localhost:3000/ru/app/series`. Создайте серию,
добавьте две книги и будущую часть, затем проверьте изменение порядка и кнопку
«Начать следующую книгу».

## 4. Отправьте обновление в GitHub

```powershell
git add .
git commit -m "feat: add book series and cycles"
git push origin main
```

Файл `.env.local` специально исключён из Git. Это правильно: локальная
конфигурация остаётся на компьютере. В Vercel нужно добавить URL Supabase и
publishable key; адрес приложения Vercel определяет автоматически.
