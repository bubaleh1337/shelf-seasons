import type { Locale } from "@/lib/shelf-seasons";

type LegalSection = { heading: string; paragraphs: readonly string[]; items?: readonly string[] };

type LegalDocument = {
  eyebrow: string;
  title: string;
  updated: string;
  intro: string;
  sections: readonly LegalSection[];
};

export const legalCopy = {
  en: {
    back: "Back to Shelf Seasons",
    privacyLink: "Privacy policy",
    termsLink: "Terms of use",
    privacy: {
      eyebrow: "Privacy",
      title: "Privacy policy",
      updated: "Effective September 9, 2026",
      intro: "Shelf Seasons is a private reading journal. This policy explains what data the app uses and how it is protected.",
      sections: [
        {
          heading: "Data we use",
          paragraphs: ["The app uses the basic Google account information needed to create and identify your account."],
          items: ["Profile name and account identifier", "Books, covers, series and reading status", "Reading sessions, dates, goals and recap choices", "Language, theme and timezone preferences"],
        },
        {
          heading: "Why we use it",
          paragraphs: ["Your data is used only to provide your personal library, synchronize it across devices, calculate reading progress and display your private recaps."],
        },
        {
          heading: "Services involved",
          paragraphs: ["Supabase provides authentication, database and private cover storage. Vercel hosts the application. Google provides sign-in and book search. Google Books, Open Library and Wikidata may receive the search text you enter when finding a book."],
        },
        {
          heading: "Cookies and analytics",
          paragraphs: ["Shelf Seasons uses essential authentication cookies. The current version does not use advertising cookies or behavioral analytics."],
        },
        {
          heading: "Storage and deletion",
          paragraphs: ["Your live account data is kept until you delete the account. Account deletion removes your books, reading history and stored covers. Encrypted operational database backups are retained for up to 30 days before expiring; they are used only for disaster recovery."],
        },
        {
          heading: "Your choices",
          paragraphs: ["You can download a JSON copy of your application data or permanently delete the account from Settings. Exported JSON does not embed custom cover image files."],
        },
        {
          heading: "Contact",
          paragraphs: ["For privacy questions or deletion assistance, email ekaterina.pyshkova@gmail.com or contact @kemisayega on Telegram."],
        },
      ],
    },
    terms: {
      eyebrow: "Terms",
      title: "Terms of use",
      updated: "Effective September 9, 2026",
      intro: "Shelf Seasons is currently provided as a free beta reading journal. By using it, you agree to these terms.",
      sections: [
        { heading: "Using the service", paragraphs: ["Use the application for lawful personal purposes and keep access to your Google account secure. Do not attempt to disrupt the service, bypass its limits or access another person's data."] },
        { heading: "Your content", paragraphs: ["You remain responsible for book information, notes and cover images you add. Upload only content you are allowed to use. Your private library is not made public by Shelf Seasons."] },
        { heading: "Beta availability", paragraphs: ["The beta may change and may occasionally be unavailable. Reasonable care is taken to protect data, but uninterrupted operation cannot be guaranteed. Keep your own export of information you cannot afford to lose."] },
        { heading: "External services", paragraphs: ["Google, Supabase, Vercel, Google Books, Open Library and Wikidata operate under their own terms and policies. Search results and metadata supplied by external book providers may be incomplete or inaccurate."] },
        { heading: "Account closure", paragraphs: ["You can permanently delete your account in Settings. Access may also be restricted when the service is abused or these terms are violated."] },
        { heading: "Changes and contact", paragraphs: ["Important changes will be reflected on this page with a new effective date. Questions can be sent to ekaterina.pyshkova@gmail.com or @kemisayega on Telegram."] },
      ],
    },
  },
  ru: {
    back: "Вернуться в Shelf Seasons",
    privacyLink: "Политика конфиденциальности",
    termsLink: "Условия использования",
    privacy: {
      eyebrow: "Конфиденциальность",
      title: "Политика конфиденциальности",
      updated: "Действует с 9 сентября 2026 года",
      intro: "Shelf Seasons — приватный дневник чтения. Здесь описано, какие данные использует приложение и как они защищаются.",
      sections: [
        {
          heading: "Какие данные используются",
          paragraphs: ["Приложение использует только основную информацию аккаунта Google, необходимую для создания и распознавания аккаунта."],
          items: ["Имя профиля и идентификатор аккаунта", "Книги, обложки, серии и статусы чтения", "Отметки чтения, даты, цели и выбранные итоги", "Настройки языка, темы и часового пояса"],
        },
        {
          heading: "Для чего нужны данные",
          paragraphs: ["Данные используются только для работы личной библиотеки, синхронизации между устройствами, расчёта прогресса чтения и отображения приватных итогов."],
        },
        {
          heading: "Какие сервисы участвуют",
          paragraphs: ["Supabase обеспечивает вход, базу данных и приватное хранение обложек. Vercel размещает приложение. Google обеспечивает вход и поиск книг. Google Books, Open Library и Wikidata могут получать введённый тобой поисковый запрос при поиске книги."],
        },
        {
          heading: "Файлы cookie и аналитика",
          paragraphs: ["Shelf Seasons использует только необходимые cookie для авторизации. В текущей версии нет рекламных cookie и поведенческой аналитики."],
        },
        {
          heading: "Хранение и удаление",
          paragraphs: ["Данные действующего аккаунта хранятся до его удаления. При удалении аккаунта удаляются книги, история чтения и сохранённые обложки. Зашифрованные технические копии базы хранятся не более 30 дней и используются только для восстановления после сбоя."],
        },
        {
          heading: "Твои возможности",
          paragraphs: ["В Настройках можно скачать данные приложения в формате JSON или навсегда удалить аккаунт. Изображения собственных обложек не встраиваются в JSON-файл."],
        },
        {
          heading: "Контакты",
          paragraphs: ["По вопросам конфиденциальности или удаления данных напиши на ekaterina.pyshkova@gmail.com либо @kemisayega в Telegram."],
        },
      ],
    },
    terms: {
      eyebrow: "Условия",
      title: "Условия использования",
      updated: "Действуют с 9 сентября 2026 года",
      intro: "Shelf Seasons пока работает как бесплатный дневник чтения в бета-версии. Используя приложение, ты принимаешь эти условия.",
      sections: [
        { heading: "Использование сервиса", paragraphs: ["Используй приложение в законных личных целях и береги доступ к своему аккаунту Google. Нельзя мешать работе сервиса, обходить ограничения или пытаться получить доступ к чужим данным."] },
        { heading: "Твой контент", paragraphs: ["Ты отвечаешь за добавленные сведения о книгах, заметки и изображения обложек. Загружай только материалы, которые вправе использовать. Shelf Seasons не делает личную библиотеку публичной."] },
        { heading: "Работа бета-версии", paragraphs: ["Бета-версия может меняться и иногда быть недоступной. Мы заботимся о сохранности данных, но не можем гарантировать непрерывную работу. Сохраняй собственный экспорт важной информации."] },
        { heading: "Внешние сервисы", paragraphs: ["Google, Supabase, Vercel, Google Books, Open Library и Wikidata работают по собственным правилам. Результаты поиска и сведения от книжных сервисов могут быть неполными или неточными."] },
        { heading: "Закрытие аккаунта", paragraphs: ["Аккаунт можно навсегда удалить в Настройках. Доступ также может быть ограничен при злоупотреблении сервисом или нарушении этих условий."] },
        { heading: "Изменения и контакты", paragraphs: ["При существенном изменении условий на этой странице появится новая дата. Вопросы можно отправить на ekaterina.pyshkova@gmail.com или @kemisayega в Telegram."] },
      ],
    },
  },
} as const satisfies Record<Locale, {
  back: string;
  privacyLink: string;
  termsLink: string;
  privacy: LegalDocument;
  terms: LegalDocument;
}>;
