# FairFleet — Cursor Agent Rules

## Identity
You are building **FairFleet**, a flight price transparency web application built with Next.js 15 + React 18 + TypeScript (frontend) and C# ASP.NET Core 8 (backend API) with MySQL on Heroku (JawsDB).

## Golden Rules

### 1. DO NOT BREAK WORKING FEATURES
Before modifying ANY file, understand what it currently does. If a page loads, a button works, a modal opens — preserve that behavior. Test after every change. If something broke, revert immediately.

### 2. COLOR PALETTE IS SACRED
The client provided a specific color palette. **Medium Blue `#2875F1`** is the primary brand color. The pastels (`#B5E4F3`, `#E3F8E9`, `#F8E5DE`, `#D5D1F4`, `#FEF8E5`) are used heavily for backgrounds. Dark Blue `#0C1464` is for headings and hover states. See the full palette in the project prompt document. NEVER invent new colors. NEVER use generic blues/grays.

### 3. FONT RULES
- Display/headings/labels/prices: `Unbounded` (Google Font), weights 300–900
- Body/inputs/metadata: `Plus Jakarta Sans` (Google Font), weights 300–700
- NEVER use Inter, Arial, Roboto, system-ui, or any other font

### 4. COMPONENT PATTERNS
- All buttons use `rounded-full` (pill shape)
- Cards use `rounded-[14px]` (brand radius) with `border border-[#D4DDE8]`
- Bag indicators are pill boxes stacked vertically (`flex-col gap-1.5`), NEVER flex-wrap
- Airline logos come from Airhex API: `https://content.airhex.com/content/logos/airlines_{IATA}_200_200_s.png`
- Destination photos come from Unsplash API

### 5. FILE STRUCTURE
```
frontend/          → Next.js 15 App Router
  src/app/         → Pages
  src/components/  → React components
  src/lib/         → Utilities, API client, types
  src/hooks/       → Custom hooks
backend/           → C# ASP.NET Core 8 Web API
  Controllers/     → API controllers
  Models/          → Entity models
  Services/        → Business logic
  Data/            → DbContext, migrations
```

### 6. ENVIRONMENT VARIABLES
- NEVER hardcode API keys, secrets, or connection strings in source files
- All secrets go in `.env.local` (frontend) or `appsettings.Development.json` / Heroku config vars (backend)
- `.env*` files are in `.gitignore` — verify before every commit

### 7. API COMMUNICATION
- Frontend calls backend at `NEXT_PUBLIC_API_URL` (e.g., `http://localhost:5000/api` dev, Heroku URL prod)
- Protected endpoints require Clerk JWT in `Authorization: Bearer {token}` header
- All API responses use consistent JSON shape: `{ data: ..., error: null }` or `{ data: null, error: "message" }`

### 8. STATE MANAGEMENT
- Use React state (`useState`, `useReducer`) for component-local state
- Use React context for auth state (Clerk provides this)
- NO Redux, Zustand, or Jotai unless explicitly requested
- Server components for data fetching where possible (App Router)

### 9. ERROR HANDLING
- Every `fetch` call must be wrapped in try/catch
- Show user-friendly error messages, not raw errors
- Log errors to console in development
- Never let an unhandled promise rejection crash the page

### 10. STYLING RULES
- Tailwind CSS for all styling
- Custom CSS only for animations, gradients, and complex effects that Tailwind can't handle
- Use the Tailwind config's `brand.*` color tokens — never raw hex in class names except when Tailwind utilities don't support it
- When Tailwind doesn't have a utility, use `style={{}}` or a CSS module
- All transitions: `transition-colors` or `transition-all` with sensible durations (150-300ms)

### 11. ACCESSIBILITY
- All interactive elements: `tabIndex`, `aria-label`, `role` as needed
- Focus rings: `focus:ring-2 focus:ring-brand-blue/30`
- Images: always have `alt` text
- Modals: trap focus, close on Escape

### 12. BEFORE COMMITTING
- Run `npm run build` — no build errors
- Check that `.env.local` is NOT in the staged files
- Run `git status` and verify no secrets are about to be committed
- Test the main user flows: homepage loads, search works, modal opens, profile loads
