# SKINFORGE (local demo)

Оригинальный тёмный игровой интерфейс с механикой **кейсов** и **апгрейдера** (без реальных брендов/логотипов, без Steam/CS2, без платежей).

## Стек

- Next.js 14 (App Router) + React + TypeScript
- TailwindCSS
- Framer Motion
- Zustand
- Backend: Next.js API Routes (server-side RNG)

## Важно про “без базы”

Базы данных тут **нет**: состояние хранится в `localStorage`, но **защищено серверной подписью (HMAC)**.

Это значит:

- фронт **не может** просто “накрутить” баланс/инвентарь через devtools и успешно пройти API
- результат кейса/апгрейда считается **на backend** (`/api/*`)
- кнопка **“Обновить до 1000 ₽”** возвращает mock баланс к 1000 ₽

## Запуск

```bash
npm install
npm run dev
```

Открой `http://localhost:3000`.

## Основные страницы

- `/` — кейсы
- `/cases/[caseId]` — страница кейса + открытие
- `/upgrade` — апгрейдер (chance = bet/target*100, clamp 1..95)
- `/inventory` — инвентарь + выбор предметов для апгрейда
- `/history` — история игр
- `/profile` — профиль/статы

## API

- `GET /api/bootstrap` — выдаёт начальное signed-state + каталог
- `POST /api/refill` — сброс баланса до 1000 ₽
- `GET /api/cases`, `GET /api/items`
- `GET /api/inventory`, `GET /api/history`, `GET /api/profile`, `GET /api/live-drops`
- `POST /api/cases/open` — `{ caseId }`
- `POST /api/upgrader/play` — `{ selectedItemIds, targetItemId }`

## Где лежит логика RNG

- `src/lib/server/gameLogic.ts` — secure random, weighted random, шанс апгрейда, cashback
- `src/lib/server/signedState.ts` — подпись/проверка state-token (HMAC)

