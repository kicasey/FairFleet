# FairFleet — Flight Price Transparency Web Application

**"Unbiased. Transparent. Yours."**

See every flight's true cost — bags, seats, all of it. FairFleet normalizes airline pricing into all-inclusive totals so you can make apples-to-apples comparisons, then links you straight to the airline to book.

## Tech Stack

### Frontend
- **Next.js 15** (App Router) + React + TypeScript
- **Tailwind CSS** with client-provided brand color palette
- **Clerk** for authentication (`@clerk/nextjs`)
- **react-simple-maps** for the interactive Explore heat map
- **Recharts** for 30-day price history charts
- **Framer Motion** for animations and transitions
- **Fonts**: Unbounded (display) + Plus Jakarta Sans (body)

### Backend
- **C# / ASP.NET Core** Web API
- **Entity Framework Core** with MySQL (Heroku JawsDB)
- **Clerk** for auth verification (via `X-Clerk-User-Id` header)

## Getting Started

### Frontend

```bash
cd frontend
cp .env.local.example .env.local
# Fill in your Clerk keys and API URL in .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Backend

```bash
cd backend
# Update connection string in appsettings.json for your MySQL/JawsDB instance
dotnet run
```

API available at [http://localhost:5280](http://localhost:5280).

### Environment Variables

Copy `.env.local.example` → `.env.local` in `frontend/` and fill in:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — from Clerk dashboard
- `CLERK_SECRET_KEY` — from Clerk dashboard
- `NEXT_PUBLIC_API_URL` — backend URL (default: `http://localhost:5280/api`)

## Project Structure

```
FlightTracker/
├── frontend/                 # Next.js 15 application
│   └── src/
│       ├── app/              # Page routes
│       │   ├── page.tsx          # Homepage
│       │   ├── search/           # Search results
│       │   ├── explore/          # Explore map (react-simple-maps)
│       │   ├── flight/[id]/      # Flight detail permalink
│       │   ├── profile/          # User profile & price tracker
│       │   ├── tips/             # Travel tips & resources
│       │   ├── feed/             # Social flight feed
│       │   ├── sign-in/          # Clerk sign-in
│       │   └── sign-up/          # Clerk sign-up
│       ├── components/       # Shared React components
│       ├── data/             # Dummy data (airlines, airports, flights)
│       ├── lib/              # Types and utilities
│       └── middleware.ts     # Clerk route protection
│   └── public/
│       └── airlines/         # Airline logo SVGs (DL, AA, UA, WN, NK, F9, B6, AS)
│
└── backend/                  # ASP.NET Core Web API
    ├── Controllers/          # API endpoints
    ├── Models/               # Entity Framework models (Clerk-based auth)
    ├── Data/                 # DbContext
    └── DTOs/                 # Data transfer objects
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage with hero, search box, "Surprise Me" quiz, and live deals |
| `/search` | Flight search results with filters, sort, miles toggle |
| `/explore` | Interactive world map (react-simple-maps) with price-tiered pins |
| `/flight/[id]` | Flight detail permalink with itinerary and cost breakdown |
| `/profile` | User profile, price tracker, saved flights, and folders |
| `/tips` | Travel tips: points, credit cards, travel hacking strategies |
| `/feed` | Social feed: friends' saved flights and activity |
| `/sign-in` | Clerk sign-in page |
| `/sign-up` | Clerk sign-up page |

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/flights/search` | Public | Search flights |
| GET | `/api/flights/explore` | Public | Explore destinations |
| GET | `/api/flights/{id}` | Public | Flight details |
| GET | `/api/flights/deals` | Public | Deal flights from airport |
| GET/PUT | `/api/user/profile` | Clerk | User profile & preferences |
| POST/DELETE | `/api/user/loyalty-status` | Clerk | Airline loyalty status |
| GET/POST/DELETE | `/api/saved-flights` | Clerk | Saved flights |
| PUT | `/api/saved-flights/{id}/alerts` | Clerk | Alert configuration |
| GET/POST/PUT/DELETE | `/api/folders` | Clerk | Flight folders |
| GET | `/api/folders/shared/{token}` | Public | Shared folder link |

## Team Workflow

- Clone the repo, create `.env.local` from the example
- Use feature branches: `feature/search-page`, `feature/profile-page`, etc.
- All team members share the same Heroku JawsDB instance
- Merge to `main` via pull requests
