# Campus Foundry

Campus Foundry is the official collegiate venture launchpad, campus marketplace, and student social hub connecting university students, student traders, campus hubs, student profiles, and real-time news.

## Features

- **Collegiate Marketplace**: Student-to-student trade, hostel delivery tracking, and student trader storefronts.
- **Campus Hubs & Pages**: Departmental, club, and campus hostel directories.
- **Campus Feed & Snaps**: Shared posts, comments, 24-hour ephemeral snaps, and story stickers.
- **Student ID & Player Cards**: Collectible digital player cards for verified campus scholars.
- **PWA & Offline Fallback**: Web App Manifest, Service Worker caching via `vite-plugin-pwa`, and offline status fallback.

---

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Lint and typecheck
npm run lint

# Production build
npm run build
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase project credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## Project Structure

```
src/
├── app/                  # App initialization, routes, and providers
│   ├── App.tsx           # Main application entry layout
│   ├── AppProviders.tsx  # Context providers (Auth, Chat, Cart, PWA)
│   └── AppRoutes.tsx     # React Router configuration (/feed, /market, /hubs, /chats, /profile/:id)
├── features/             # Feature modules (components, hooks, services, types)
│   ├── auth/             # Authentication & OTP webmail verification
│   ├── feed/             # Campus feed posts & reactions
│   ├── marketplace/      # Products, orders, checkout, trader dashboard, marketplace chat
│   ├── chat/             # Direct messaging & community chat
│   ├── hubs/             # Campus hubs, clubs, and faculty pages
│   ├── stories/          # Ephemeral 24h snaps & story viewer
│   ├── profile/          # User profiles, verification, discovery
│   └── playercard/       # Digital student player card studio
├── shared/               # Reusable UI primitives, utilities, and static constants
│   ├── ui/               # Navbar, BottomNav, Modals, PWAInstallButton, OfflineIndicator
│   ├── utils/            # Friendly error handling & formatters
│   └── constants/        # Faculties, departments, hostels
└── lib/
    └── supabase/         # Supabase client & authentication helpers

backend/                  # Server-only migrations, functions, scripts
├── server/
├── functions/
├── scripts/
└── src-server/
```

---

## Database Migration Order

To provision the Supabase database schema, execute SQL files in `/migrations` sequentially:

1. `001_create_stories_schema.sql`
2. `002_create_supabase_schema.sql`
3. `003_create_player_card_schema.sql`
4. `004_fix_rls_snaps_chat_audio.sql`
5. `005_fix_chat_conversations_and_chat_messages_rls.sql`
6. `006_create_poll_votes_schema.sql`
7. `007_create_hubs_pages_schema.sql`
8. `008_create_staff_permissions_schema.sql`
9. `009_fix_admin_role_and_members.sql`
10. `010_grant_hubs_pages_permissions.sql`
11. `011_global_search_and_discovery.sql`
12. `012_create_snap_views_schema.sql`
13. `013_create_follows_schema.sql`
14. `014_restrict_chat_rls.sql`
15. `015_backend_security_post_reactions_and_orders.sql`
16. `016_privacy_profiles_and_businesses_rpc.sql`
