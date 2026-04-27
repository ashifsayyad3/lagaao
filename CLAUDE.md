# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**LAGAAO.COM** — Production e-commerce platform for selling plants (money plants, bonsai, indoor plants, lucky bamboo, gifting plants, premium planters) online in India.

- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS (port 3000)
- **Backend**: NestJS + TypeScript REST API (port 5000)
- **Database**: MySQL 8 via Prisma ORM
- **Server**: Ubuntu 22.04 VPS (GoDaddy) — Nginx + PM2
- **Payments**: Razorpay | **Shipping**: Shiprocket | **AI**: OpenAI GPT-4o-mini

---

## Commands

### Backend (in `backend/`)
```bash
npm run start:dev          # Dev server with hot-reload
npm run build              # Compile TypeScript → dist/
npm run start:prod         # Run production build
npm run test               # Jest unit tests
npm run prisma:generate    # Generate Prisma client
npm run prisma:migrate     # Run pending migrations
npm run prisma:studio      # Open Prisma Studio
npm run prisma:seed        # Seed database with default data
```

### Frontend (in `frontend/`)
```bash
npm run dev                # Dev server on port 3000
npm run build              # Production build
npm run start              # Start production server
npm run lint               # ESLint check
```

### Database Schema
The Prisma schema lives at `database/prisma/schema.prisma`. After any schema change:
1. `cd backend && npm run prisma:migrate` (runs migration on the DB)
2. `npm run prisma:generate` (regenerates the Prisma client)

---

## Architecture

### Backend Module Pattern
Each NestJS module in `backend/src/modules/` follows:
```
module-name/
  ├── module-name.module.ts    — imports, providers, exports
  ├── module-name.service.ts   — business logic (uses PrismaService)
  ├── module-name.controller.ts — HTTP routes
  └── dto/                     — Validation DTOs (class-validator)
```

**`PrismaService`** is `@Global()` — injected anywhere without re-importing the module.

**Event-driven notifications** use `EventEmitter2`:
- `order.created` → email + WhatsApp + in-app notification
- `payment.success` → in-app notification
- `shipment.created` → email + WhatsApp + in-app notification
- Listener: `backend/src/modules/notifications/notifications.listener.ts`

**Auth flow**: JWT access token (15 min) + refresh token (30 days) stored in DB.
- `JwtAuthGuard` applied globally; use `@Public()` decorator to opt routes out.
- `RolesGuard` + `@Roles('admin', 'super_admin')` for RBAC.
- Roles: `super_admin`, `admin`, `manager`, `support`, `customer`

**API response envelope** (via `ResponseInterceptor`):
```json
{ "success": true, "statusCode": 200, "message": "Success", "data": {...}, "timestamp": "..." }
```

### Frontend Architecture
- **App Router** (Next.js 15) — all pages in `src/app/`
- **Server Components** for ISR data fetching (product listing, home page) — `revalidate: 300`
- **Client Components** for interactivity — prefix with `'use client'`
- **State management**: Zustand (`src/store/`) — `auth.store.ts`, `cart.store.ts`
- **Server fetching**: `@tanstack/react-query` for client-side queries
- **API client**: `src/lib/api.ts` — Axios instance with auto-refresh interceptor
- **Admin panel**: `src/app/admin/` — protected by role check in layout

### Key API Endpoints
| Resource | Base path |
|---|---|
| Auth | `POST /api/v1/auth/register`, `/login`, `/refresh`, `/logout` |
| Products | `GET /api/v1/products?category=&search=&sort=&page=&limit=` |
| Cart | `GET/POST/PUT/DELETE /api/v1/cart` |
| Orders | `POST /api/v1/orders` → triggers Razorpay → `POST /api/v1/payments/verify` |
| Shipping | `POST /api/v1/shipping/:orderId/create` → Shiprocket |
| AI Chat | `POST /api/v1/ai/chat` |
| Admin Dashboard | `GET /api/v1/analytics/dashboard` |

### Razorpay Payment Flow
1. Client POSTs order → `POST /orders` → returns `orderId`
2. Client POSTs `POST /payments/create-order/:orderId` → returns Razorpay order ID + key
3. Client opens Razorpay checkout modal
4. On success → client POSTs `POST /payments/verify` with signature
5. Backend verifies HMAC signature and marks order `CONFIRMED`
6. Webhook at `POST /payments/webhook` handles async events

### Prisma Notes
- All models use UUID primary keys (`@default(uuid())`)
- Soft delete via `deletedAt DateTime?` field on major entities
- Audit fields: `createdAt`, `updatedAt` on all models
- Foreign keys cascade on user deletion for owned data

---

## Deployment (GoDaddy VPS)

### Quick deploy
```bash
bash deployment/scripts/deploy.sh
```

### First-time VPS setup
```bash
bash deployment/scripts/setup-vps.sh
```

### PM2
```bash
pm2 status
pm2 logs lagaao-backend
pm2 logs lagaao-frontend
pm2 reload lagaao-backend
```

### Nginx config
`deployment/nginx/lagaao.conf` — copy to `/etc/nginx/sites-available/` and symlink.

### GitHub Actions CI/CD
`.github/workflows/deploy.yml` — triggers on `main` push:
1. Runs tests
2. Builds frontend + backend
3. rsync artifacts to VPS via SSH
4. Runs migrations and restarts PM2

**Required GitHub Secrets**:
- `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`
- `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_GA_ID`

---

## Environment Files

- `backend/.env.example` — template (commit this)
- `backend/.env.production` — real secrets (DO NOT commit)
- `frontend/.env.example` — template (commit this)
- `frontend/.env.production` — real secrets (DO NOT commit)

Default admin after seeding:
- Email: `admin@lagaao.com`
- Password: `Admin@123`

---

## Database Seeding

```bash
cd backend && npm run prisma:seed
```
Seeds: roles, super admin user, 6 categories, 1 sample product.
