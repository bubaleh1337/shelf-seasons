# Shelf Seasons: design system

## 1. Direction

Mood: **a cozy home library in changing seasons**.

The interface should feel warm, editorial and calm. Seasonal pages use a subtle paper texture, layered natural light, large edge foliage and an original illustrated still life. The still life is anchored to the page's bottom-right edge, while wide motifs such as the autumn garland are centered independently. Decoration stays behind content and scrolls with the page; product surfaces remain readable and restrained.

Seasonal motifs:

- spring: blossom branches, a vase and a ribbon;
- summer: sunflowers, a ceramic vase and a shell;
- autumn: leaves, books, coffee, pumpkins and warm string lights;
- winter: pine branches, snowflakes, a tree and a steaming mug.

## 2. Brand expression

Brand: **Shelf Seasons**

Tagline: **Your reading life, season by season.**

Logo direction:

- simple bookshelf or window-like frame;
- two to four vertical book spines;
- one subtle seasonal element such as a leaf arc or changing corner color;
- recognizable at 32×32 px;
- no fine lines that disappear in a favicon;
- no open-book cliché combined with a generic checkmark.

Logo generation is a separate design task. Do not use an AI-generated raster logo as the final production mark without manual vector cleanup and uniqueness review.

## 3. Typography

### Primary

- Display/headings: `Fraunces`
- UI/body: `Manrope`

Fallbacks:

```css
--font-display: "Fraunces", Georgia, "Times New Roman", serif;
--font-sans: "Manrope", Inter, system-ui, -apple-system, "Segoe UI", sans-serif;
```

Rules:

- headings use display font sparingly;
- controls, numbers and dense metadata use sans-serif;
- minimum body size 16 px on mobile;
- do not use all-caps for long Russian labels;
- tabular numerals for goals and statistics;
- line length for prose: roughly 55–75 characters.

## 4. Color tokens

### Light theme

```text
background       #F6F1E8
surface          #FFFDFC
surface-muted    #EEE6DA
text-primary     #2C2723
text-secondary   #6A625B
border           #D8CEC1
brand-primary    #59664F
brand-hover      #46513E
brand-soft       #DCE3D5
plum             #755766
terracotta       #A85F45
gold             #9A743D
success          #4F6D49
warning          #8A641F
danger           #984B4B
focus            #315C9B
```

### Dark theme

```text
background       #1E1A17
surface          #28221E
surface-muted    #342C27
text-primary     #F4EDE4
text-secondary   #C3B8AD
border           #4A4038
brand-primary    #A9BC98
brand-hover      #BED0AD
brand-soft       #34402F
plum             #C9A6B7
terracotta       #DB8C6E
gold             #D5B06F
success          #9CBD8E
warning          #E0BB6D
danger           #E09A9A
focus            #8DB8FF
```

Every semantic text/background pairing must be contrast-tested. Accent colors that fail text contrast may be used only decoratively.

## 5. Spacing, shape and elevation

Spacing scale: `4, 8, 12, 16, 24, 32, 48, 64` px.

Radii:

- small controls: 10 px;
- cards: 16 px;
- hero cards/dialogs: 20–24 px;
- pills: 999 px.

Shadows:

- use one soft shadow for floating surfaces;
- book covers may use a slightly stronger vertical shadow;
- avoid stacking several shadows and borders.

## 6. Layout

Breakpoints should follow content rather than device names. Minimum validation widths:

- 320 px;
- 375 px;
- 768 px;
- 1024 px;
- 1440 px.

Content widths:

- text/settings: approximately 720 px;
- dashboard: approximately 1120 px;
- library grid: approximately 1320 px.

Safe-area insets are respected for installed mobile PWA navigation.

## 7. Book covers

- standard frame ratio: `2 / 3`;
- use `object-fit: cover` for cards;
- details page may show full cover with `object-fit: contain`;
- never stretch an image;
- placeholder includes title initials or a restrained spine illustration;
- remote images use defined allowed hosts and safe fallbacks;
- alt format: `{Title} by {Author} cover` with localized grammar;
- lazy-load covers below the fold;
- set responsive image sizes to prevent oversized downloads.

Calendar thumbnails are crops. The day-detail modal exposes the full identifiable title/author.

## 8. Components

Required primitives:

- Button: primary, secondary, ghost, danger
- IconButton with accessible label
- TextField, SearchField, TextArea
- Select/Combobox
- SegmentedControl
- Dialog and BottomSheet
- Toast/InlineStatus
- Tabs
- FilterChip
- ProgressBar/GoalRing
- BookCover
- BookCard
- StatusBadge
- EmptyState
- Skeleton
- CalendarDayCell
- StarRating with half-step keyboard support
- LanguageSwitcher
- ThemeSwitcher

Component states:

- default;
- hover where available;
- focus-visible;
- pressed;
- disabled;
- loading;
- error/success when relevant.

## 9. Motion

- normal transitions: 120–220 ms;
- cover selection may use subtle scale up to 1.02;
- page-level motion is minimal;
- completion celebration is quiet and optional;
- `prefers-reduced-motion` removes parallax, scaling and celebration animation;
- never delay a functional response to show animation.

## 10. Copy tone

Warm, clear and non-judgmental.

Preferred:

- `A new reading day can start anytime.`
- `Новый читательский день может начаться когда угодно.`
- `No reading logged yet.`
- `Пока нет отметок о чтении.`

Avoid:

- `You failed your streak.`
- `You are behind.`
- guilt-based notifications;
- childish praise for normal actions;
- excessive exclamation marks.

## 11. Accessibility checklist

- visible focus on every interactive element;
- logical heading order;
- labels are not placeholders;
- errors are linked to fields;
- live region for saved/error status;
- calendar has list-equivalent semantics for screen readers;
- charts have textual summaries;
- icons never carry meaning alone;
- status is not conveyed only by color;
- minimum touch target 44×44 px;
- test keyboard-only and 200% zoom.

## 12. Seasonal atmosphere and shelves

- Current-season artwork belongs to the scrolling page background and never uses fixed-position motifs over content.
- Background illustration stays decorative, low-contrast and outside the primary text area.
- Seasonal collections use a physical wooden-shelf metaphor with upright book spines and small illustrated objects.
- Shelf order begins with the current season and continues chronologically through the following three seasons.
- The whole shelf is a keyboard-accessible control. Opening it reveals an identifiable cover grid with titles, authors and edit actions.
- The shelf scene may show a clipped representative run of spines; every assigned book remains available in the dialog.

## 13. Developer support

- Developer contacts live in Settings as a calm utility card, separate from account and destructive actions.
- Buy Me a Coffee uses its recognizable yellow as a single intentional brand accent; it must not recolor the rest of Shelf Seasons.
- Desktop sidebar actions stay compact. Mobile users reach the same card through the Settings shortcut in the top bar.
- External donation and Telegram links open in a new tab with `noopener noreferrer`; email uses a direct `mailto:` link.
