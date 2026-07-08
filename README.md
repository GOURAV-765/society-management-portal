# Society Management Portal - Module 1

This repository contains **Module 1** of a multi-tenant Society Management Portal, covering:
- **Multi-Tenant Database Design**: Society-isolated schema using Prisma ORM and PostgreSQL.
- **Authentication**: Stateless session management using JWT access tokens.
- **Role-Based Access Control (RBAC)**: Support for Core Admin, Core Team Lead, and General Member tiers.
- **Member Management**: Standard CRUD, status changes, soft-deletes, pagination, search, and filtration.

---

## Technical Stack

- **Backend**: Node.js, Express.js, TypeScript, Prisma ORM, JWT, Bcrypt, Zod, Morgan, Helmet, CORS
- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS v4, React Router DOM, React Hook Form + Zod, TanStack Query (React Query), Lucide Icons

---

## Project Structure

```
├── README.md               # Setup and architecture documentation
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Layout, Sidebar, Topbar, Route Guards
│   │   ├── context/        # Auth Context, Toast Notification Context
│   │   ├── pages/          # Login, Dashboard, Members List, Add/Edit Member, Profile, Error pages
│   │   ├── services/       # Axios API interceptor configurations
│   │   ├── App.tsx         # Routing and query provider bindings
│   │   └── index.css       # Tailwind CSS v4 stylesheet imports
│   └── vite.config.ts      # Vite configuration with Tailwind plugin
└── server/                 # Express backend
    ├── prisma/
    │   └── schema.prisma   # PostgreSQL models with multi-tenancy & soft deletes
    ├── src/
    │   ├── config/         # Database client config
    │   ├── controllers/    # Authentication & Member CRUD controllers
    │   ├── middlewares/    # Auth verification, Zod validation, RBAC, error handlers
    │   ├── routes/         # Express endpoint mappings
    │   ├── schemas/        # Zod validation schemas
    │   ├── types/          # Express Request interface overrides
    │   ├── utils/          # JWT tokens signing and verification helpers
    │   ├── index.ts        # Express entry point
    │   └── seed.ts         # Idempotent DB seeder
    └── tsconfig.json       # TypeScript compiler settings
```

---

## Setup Instructions

### 1. Prerequisites
- **Node.js**: v18+ (v20+ recommended)
- **PostgreSQL**: Running instance on localhost or cloud provider.

---

### 2. Backend Server Setup
1. Open a terminal and navigate to the `server/` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure your Environment Variables. The default `.env` is initialized at `server/.env`:
   ```ini
   DATABASE_URL="postgresql://username:password@localhost:5432/society_management?schema=public"
   PORT=5000
   JWT_SECRET="development_secret_key_for_jwt_tokens_society_management_portal"
   NODE_ENV="development"
   ```
   *Modify `DATABASE_URL` with your actual PostgreSQL connection string.*

4. Run the database migrations (make sure PostgreSQL is running):
   ```bash
   npx prisma migrate dev --name init
   ```
   *This creates all database tables, foreign keys, and indexes.*

5. Seed the database with default tenants, roles, permissions, and test accounts:
   ```bash
   npm run seed
   ```

6. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend API will run on **`http://localhost:5000`**.

---

### 3. Frontend Client Setup
1. Open a new terminal and navigate to the `client/` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the client dev server:
   ```bash
   npm run dev
   ```
   The React application will launch on **`http://localhost:5173`**.

---

## Seeding & Test Credentials

The database seeder (`npm run seed`) populates two societies: **Greenwood Society** and **Skyline Residency**.
All test accounts are seeded with password: `Password123`

### 1. Greenwood Society
- **Core Admin**: `admin@greenwood.com` (Full privileges: Read, Create, Update, Delete)
- **Core Team Lead**: `lead@greenwood.com` (Privileges: Read, Create, Update)
- **General Member**: `member@greenwood.com` (Privileges: Read-Only)

### 2. Skyline Residency
- **Core Admin**: `admin@skyline.com`
- **General Member**: `member@skyline.com`

---

## Multi-Tenancy & Security Rules
- **Multi-Tenant Isolation**: Every database query is scoped to the logged-in user's `societyId`. Greenwood administrators cannot query or write data belonging to Skyline Residency (and vice versa).
- **Soft Deletion**: Members and user accounts are never permanently removed from the database when deleted. Instead, they are marked with a `deletedAt` timestamp and automatically ignored in active queries.
- **RBAC Route Protection**: Endpoints and pages are dynamically restricted by verifying JWT signature keys and role permission lists on both client and server layers.
