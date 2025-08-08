Frontend Stack

Vue 3 (Composition API ready) with TypeScript
Tailwind CSS for styling
Pinia for state management
Vue Router for routing
Vite as build tool
PWA capabilities with service worker
Backend Stack

Vercel Functions for serverless API
PostgreSQL via @vercel/postgres
Clerk for authentication
Zod for validation

Project Structure
```
api/              # Serverless functions
├── _db.ts        # Database connection
├── _verify.ts    # Auth verification
├── expenses.ts   # Expense operations
├── fx.ts         # Currency exchange
└── groups.ts     # Group operations

src/
├── components/   # Vue components
├── stores/       # Pinia stores
├── router.ts     # Route configuration
└── main.ts       # App entry point

db/
├── schema.sql    # Database schema
└── init.mjs      # DB initialization
```