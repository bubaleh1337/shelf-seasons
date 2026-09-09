export type Locale = "en" | "ru";

export type Book = {
  id: string;
  title: string;
  author: string;
  status: "reading" | "want" | "read" | "paused";
  progress?: number;
  palette: "forest" | "plum" | "ink" | "clay" | "gold" | "blue";
  artwork?: string;
};

export const books: Book[] = [
  {
    id: "glass-orchard",
    title: "The Glass Orchard",
    author: "Mara Vale",
    status: "reading",
    progress: 62,
    palette: "ink",
    artwork: "/glass-orchard.png",
  },
  {
    id: "house-of-tides",
    title: "The House of Tides",
    author: "Eleanor Moss",
    status: "reading",
    progress: 34,
    palette: "blue",
  },
  {
    id: "small-constellations",
    title: "Small Constellations",
    author: "June Arden",
    status: "want",
    palette: "plum",
  },
  {
    id: "winter-library",
    title: "The Winter Library",
    author: "Noah Bell",
    status: "read",
    palette: "forest",
  },
  {
    id: "after-the-rain",
    title: "After the Rain",
    author: "Iris Rowan",
    status: "read",
    palette: "clay",
  },
  {
    id: "atlas-of-quiet",
    title: "An Atlas of Quiet Places",
    author: "Theo Wren",
    status: "paused",
    progress: 21,
    palette: "gold",
  },
  {
    id: "moss-and-memory",
    title: "Moss & Memory",
    author: "Clara Finch",
    status: "want",
    palette: "forest",
  },
  {
    id: "borrowed-light",
    title: "Borrowed Light",
    author: "S. M. Hale",
    status: "read",
    palette: "ink",
  },
];

export const copy = {
  en: {
    appTitle: "Shelf Seasons", home: "Home", library: "Library", calendar: "Calendar",
    series: "Series", recaps: "Recaps", settings: "Settings", logReading: "Log reading",
    greeting: "Good afternoon, Katya", homeLead: "A quiet place for your reading life.",
    currentReading: "Current reading", logToday: "Log today’s reading",
    loggedToday: "Reading logged for today", viewBook: "View book",
    annualGoal: "2026 reading goal", goalDetail: "18 of 30 books",
    currentStreak: "Current streak", bestStreak: "Longest streak", days: "days",
    thisWeek: "This week", weekDetail: "5 reading days · 3 books",
    recentShelf: "Recently on your shelf", seeAll: "See all", books: "books",
    searchBooks: "Search your library", addBook: "Add book", all: "All",
    reading: "Reading", want: "Want to read", read: "Read", paused: "Paused",
    libraryLead: "Every book you want to remember, in one place.",
    calendarLead: "See your month as a mosaic of reading days.", september: "September 2026",
    previous: "Previous month", next: "Next month", week: "Week", month: "Month", year: "Year",
    readingDays: "reading days", minutes: "minutes", pages: "pages",
    seriesLead: "Keep every world and every volume in order.", inProgress: "In progress",
    planned: "Planned", volumes: "volumes", nextBook: "Next book",
    recapLead: "The stories that shaped your season.", septemberRecap: "September recap",
    completed: "completed", favorite: "Favorite of the month",
    quietMonth: "A quietly wonderful month",
    quietMonthDetail: "You returned to reading on 16 days and finished three books.",
    settingsLead: "Make Shelf Seasons feel like your own library.", appearance: "Appearance",
    darkMode: "Dark mode", darkModeDetail: "Use a deeper, evening library palette.",
    language: "Language", languageDetail: "Shelf Seasons stays the same in every language.",
    timezone: "Timezone", dataNote: "Demo mode",
    dataNoteDetail: "This first version uses sample data. Nothing is saved to an account yet.",
    modalTitle: "Log today’s reading",
    modalDescription: "A simple check-in is enough. Details are optional.",
    date: "Date", timeRead: "Minutes read", pagesRead: "Current page", optional: "Optional",
    saveEntry: "Save entry", cancel: "Cancel", empty: "No books match this shelf yet.",
  },
  ru: {
    appTitle: "Shelf Seasons", home: "Главная", library: "Библиотека", calendar: "Календарь",
    series: "Серии", recaps: "Итоги", settings: "Настройки", logReading: "Отметить чтение",
    greeting: "Добрый день, Катя", homeLead: "Спокойное место для твоей книжной жизни.",
    currentReading: "Сейчас читаешь", logToday: "Отметить чтение сегодня",
    loggedToday: "Чтение за сегодня отмечено", viewBook: "Открыть книгу",
    annualGoal: "Цель на 2026 год", goalDetail: "18 из 30 книг",
    currentStreak: "Текущая серия", bestStreak: "Лучшая серия", days: "дней",
    thisWeek: "Эта неделя", weekDetail: "5 дней чтения · 3 книги",
    recentShelf: "Недавно на полках", seeAll: "Смотреть все", books: "книг",
    searchBooks: "Поиск по библиотеке", addBook: "Добавить книгу", all: "Все",
    reading: "Читаю", want: "Хочу прочитать", read: "Прочитано", paused: "Отложено",
    libraryLead: "Все книги, которые хочется запомнить, — в одном месте.",
    calendarLead: "Месяц чтения как мозаика из книжных обложек.", september: "Сентябрь 2026",
    previous: "Предыдущий месяц", next: "Следующий месяц", week: "Неделя", month: "Месяц", year: "Год",
    readingDays: "дней чтения", minutes: "минут", pages: "страниц",
    seriesLead: "Все книжные миры и тома — в правильном порядке.", inProgress: "В процессе",
    planned: "Запланировано", volumes: "томов", nextBook: "Следующая книга",
    recapLead: "Истории, из которых сложился твой сезон.", septemberRecap: "Итоги сентября",
    completed: "завершено", favorite: "Книга месяца",
    quietMonth: "Тихий и прекрасный книжный месяц",
    quietMonthDetail: "Чтение было с тобой 16 дней, а завершённых книг стало три.",
    settingsLead: "Настрой Shelf Seasons как свою домашнюю библиотеку.", appearance: "Оформление",
    darkMode: "Тёмная тема", darkModeDetail: "Более глубокая палитра вечерней библиотеки.",
    language: "Язык", languageDetail: "Название Shelf Seasons не меняется ни на одном языке.",
    timezone: "Часовой пояс", dataNote: "Демонстрационный режим",
    dataNoteDetail: "Первая версия использует примеры. Данные пока не сохраняются в аккаунте.",
    modalTitle: "Отметить чтение сегодня",
    modalDescription: "Достаточно простой отметки. Подробности можно добавить по желанию.",
    date: "Дата", timeRead: "Минут чтения", pagesRead: "Текущая страница", optional: "Необязательно",
    saveEntry: "Сохранить отметку", cancel: "Отмена", empty: "На этой полке пока нет подходящих книг.",
  },
} as const;

export const statusLabel = (locale: Locale, status: Book["status"]) => {
  const c = copy[locale];
  return { reading: c.reading, want: c.want, read: c.read, paused: c.paused }[status];
};
