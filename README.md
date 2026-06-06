# DigiSell — Digital Commerce Platform

<div align="center">

![DigiSell](https://img.shields.io/badge/DigiSell-Digital%20Commerce%20Platform-6366f1?style=for-the-badge&logo=shopify&logoColor=white)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![Hono](https://img.shields.io/badge/Hono-4.x-e36002?style=flat-square)](https://hono.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479a1?style=flat-square&logo=mysql&logoColor=white)](https://mysql.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ed?style=flat-square&logo=docker&logoColor=white)](https://docker.com/)
[![Railway](https://img.shields.io/badge/Deployed-Railway-0b0d0e?style=flat-square&logo=railway)](https://railway.app/)

**A fully-featured, production-ready digital goods marketplace — a Sellix.io clone built with modern TypeScript.**

[Live Demo](https://digisell-app-production.up.railway.app) · [Admin Panel](https://digisell-app-production.up.railway.app/admin) · [API Docs](https://digisell-app-production.up.railway.app/api/docs)

</div>

---

## Overview

DigiSell is a complete digital commerce platform that enables sellers to create shops and sell digital products such as software licenses, game keys, files, and subscriptions. It includes a full admin panel for platform management, a seller dashboard, and a customer-facing storefront.

> **Demo Login:** `admin@digisell.local` / `Admin1234!`

---

## Features

### Storefront
- Product catalog with categories, search, and filtering
- Product detail pages with reviews and ratings
- Shopping cart with coupon support
- Guest and authenticated checkout
- Stripe, PayPal, and crypto payment support (configurable)
- Tax calculation

### Customer Dashboard
- Order history and order details
- Access to purchased files and license keys
- Download tracking and limits
- Support ticket system with file attachments
- Invoice PDF generation and download
- Subscription management

### Seller Panel
- Shop overview (revenue, orders, products, customers)
- Customer list and details
- Sales statistics and analytics
- Payment overview and payout requests

### Admin Panel (15 sections)

| Section | Features |
|---|---|
| **Dashboard** | Platform stats, revenue charts, system status, recent activity |
| **User Management** | Search, filter, profile view, ban/unban, role change, login history |
| **Shop Management** | CRUD, suspend, revenue, orders, products, reports |
| **Product Management** | Search, filter, suspend, delete, report review |
| **Order Management** | Search, filter, details, cancel, refund, status change, CSV export |
| **Payment Management** | Search, filter, refund, chargeback, CSV export |
| **Ticket System** | Search, filter, reply, close, priority, assign, file attachments |
| **Reports & Moderation** | All report types, moderation log, suspend reported objects |
| **Affiliate Management** | Stats, commission editing, payout management |
| **Subscription Management** | View, cancel, extend, statistics |
| **Analytics** | Revenue, growth, payment stats, conversion rate, geographic distribution |
| **Security** | Login logs, failed attempts, IP/email/domain blocklists |
| **Admin Roles** | Granular permissions, create/edit/delete roles, assign admins |
| **System** | Health check, logs, database backup, maintenance mode |
| **Settings** | Email, payments, shop configuration, security policies |

### Authentication & Security
- Email/password registration and login
- Two-factor authentication (TOTP / Google Authenticator)
- Email verification
- Password reset via email
- JWT + refresh tokens
- Session management
- Rate limiting
- CAPTCHA support (hCaptcha / Cloudflare Turnstile)

### API & Integrations
- Full REST API with OpenAPI/Swagger documentation
- Webhook system with HMAC signatures (9 event types)
- API key management per user
- Affiliate tracking system
- S3-compatible file storage
- SMTP email notifications

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, React Router 7, Vite 7, Tailwind CSS v3 |
| **UI Components** | shadcn/ui (40+ components, Radix UI) |
| **Backend** | Hono 4 (Node.js), tRPC v11 |
| **Database** | Drizzle ORM + MySQL 8 / TiDB |
| **Auth** | JWT, bcryptjs, speakeasy (TOTP) |
| **Email** | Nodemailer (SMTP) |
| **Payments** | Stripe, PayPal (configurable) |
| **Storage** | AWS S3 / S3-compatible |
| **Cache** | Redis 7 |
| **Reverse Proxy** | Nginx |
| **Deployment** | Docker, Railway, Let's Encrypt SSL |
| **Testing** | Vitest (65 unit tests) |
| **Language** | TypeScript (full-stack) |

---

## Quick Start

### Prerequisites
- Node.js 22+
- MySQL 8+ or Docker
- Redis 7+

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/xXGermanXx2/digisell.git
cd digisell

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your values

# 4. Push database schema
npm run db:push

# 5. Seed demo data (optional)
npm run db:seed

# 6. Start development server
npm run dev
```

The app will be available at `http://localhost:5173` (frontend) and `http://localhost:3000` (API).

### Docker Deployment

```bash
# 1. Clone and configure
git clone https://github.com/xXGermanXx2/digisell.git
cd digisell

# 2. Configure environment
cp .env.example .env
# Edit .env with your values

# 3. Deploy with one command
DOMAIN=yourdomain.com ./deploy.sh
```

This starts the full stack: App + MySQL 8 + Redis 7 + Nginx + Certbot (SSL).

---

## Configuration

Copy `.env.example` to `.env` and fill in the required values:

```env
# Database
DATABASE_URL=mysql://user:password@localhost:3306/digisell

# Authentication
JWT_SECRET=your-very-long-random-secret-key
APP_SECRET=another-long-random-secret-key

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com

# Payments (optional)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...

# File Storage (optional)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=digisell-uploads
AWS_REGION=eu-central-1

# Redis
REDIS_URL=redis://localhost:6379

# App
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
```

---

## Project Structure

```
digisell/
├── api/                    # Backend (Hono + tRPC)
│   ├── auth-router.ts      # Authentication endpoints
│   ├── admin-router.ts     # Admin panel endpoints (15 sections)
│   ├── product-router.ts   # Product management
│   ├── order-router.ts     # Order processing & fulfillment
│   ├── affiliate-router.ts # Affiliate system
│   ├── subscription-router.ts
│   ├── webhook-router.ts   # Webhook management
│   ├── invoice-router.ts   # PDF invoices & payment logs
│   ├── system-router.ts    # Health & monitoring
│   ├── upload-router.ts    # S3 file uploads
│   ├── analytics-router.ts # Visitor tracking & conversion
│   └── lib/
│       ├── email.ts        # SMTP utility
│       ├── captcha.ts      # CAPTCHA validation
│       ├── fraud-detection.ts # VPN/proxy and fingerprint helpers
│       ├── metrics.ts      # Prometheus metrics rendering
│       ├── invoice-pdf.ts  # PDF generation
│       ├── local-auth.ts   # JWT utilities
│       ├── openapi.ts      # API documentation
│       └── reminder-emails.ts
├── src/                    # Frontend (React)
│   ├── pages/              # 35+ page components
│   ├── components/         # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   └── providers/          # Context providers
├── db/                     # Database
│   ├── schema.ts           # Drizzle schema (30 tables)
│   ├── relations.ts        # Table relations
│   └── seed.ts             # Demo data
├── docker/                 # Docker configuration
│   └── nginx/              # Nginx config with SSL
├── scripts/                # Utility scripts
│   └── create-production-backup.mjs # Production database backup with retention
├── Dockerfile              # Multi-stage production build
├── docker-compose.yml      # Production stack
├── docker-compose.dev.yml  # Development stack
├── deploy.sh               # One-command deployment
├── MY_TODO.md              # General platform roadmap and feature status
├── ADMIN_TODO.md           # Admin panel feature status
└── BUYER_DASHBOARD_TODO.md # Buyer dashboard feature status

Status 2026-06-06: Buyer Dashboard TODO: ✅ abgeschlossen. Implementiert wurden Favoriten/Wishlist, Shop-Benachrichtigungen, In-App-Notifications, Coupon-/Rabattübersicht, Buyer-Abonnements, Chargeback-Anzeige, Ticket-Dateianhänge sowie Geräte-/Session-Sicherheitsfunktionen.
```

---


### Admin Ops: Sicherheit, Monitoring und Backups

Das Admin-Panel enthält nun konfigurierbare Einstellungen für **CAPTCHA** (hCaptcha/Cloudflare Turnstile), **VPN-/Proxy-Erkennung**, **Browser-Fingerprinting**, **Prometheus-Monitoring** und **automatische Datenbank-Backups**. Der Prometheus-kompatible Metrics-Endpunkt liegt unter `/api/metrics` und kann optional mit einem Metrics-Token geschützt werden. Datenbank-Backups können serverseitig mit `npm run backup:database` erzeugt und über externe Cron-Systeme wie Railway Cron, GitHub Actions oder einen Server-Cron geplant werden.

## Roadmap & TODO Tracking

The project keeps its feature planning directly in version control so that implementation status, open follow-up work, and role-specific product requirements remain visible in GitHub. The two role-specific TODO documents are stored in the repository root and should be updated whenever related functionality changes.

| File | Focus Area | Current Summary |
|---|---|---|
| [`ADMIN_TODO.md`](ADMIN_TODO.md) | Admin panel, moderation, analytics, security, system management, roles, and seller-side admin functions | 131 features are marked as complete, no items remain partially implemented, and no admin features are currently marked as missing. |
| [`BUYER_DASHBOARD_TODO.md`](BUYER_DASHBOARD_TODO.md) | Buyer dashboard, order history, downloads, license keys, support tickets, account security, notifications, favorites, coupons, subscriptions, and buyer analytics | Core buyer functionality is marked as complete, important features are mostly implemented, and remaining work is concentrated around notifications, favorites, coupons, subscriptions, device/session management, and optional buyer API access. |

The general project roadmap remains available in [`MY_TODO.md`](MY_TODO.md). Together, these files provide the main GitHub-visible planning layer for DigiSell and should be reviewed before larger feature work, refactors, or release preparation.

---

## Database Schema (30 Tables)

`users` · `products` · `productFiles` · `productVariants` · `categories` · `orders` · `orderItems` · `cartItems` · `licenseKeys` · `reviews` · `coupons` · `tickets` · `ticketMessages` · `ticketAttachments` · `shopSettings` · `fraudRules` · `affiliates` · `affiliateClicks` · `affiliateCommissions` · `subscriptions` · `webhooks` · `webhookLogs` · `apiKeys` · `paymentLogs` · `deliveryLogs` · `pageViews` · `shops` · `reports` · `loginLogs` · `adminRoles` · `moderationLogs`

---

## API Documentation

Available at `/api/docs` after deployment. All endpoints use tRPC for type-safe communication.

Authentication: `Authorization: Bearer <api-key>`

---

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

65 unit tests covering authentication, business logic, and security utilities.

---

## Deployment

### Railway (Recommended)
1. Fork this repository
2. Create a new project on [Railway](https://railway.app)
3. Add a MySQL service
4. Connect your GitHub repository
5. Set environment variables
6. Deploy — Railway auto-deploys on every push

### VPS with Docker
```bash
git clone https://github.com/xXGermanXx2/digisell.git
cd digisell
cp .env.example .env && nano .env
DOMAIN=yourdomain.com ./deploy.sh
```

---

## Admin Access

Default credentials after seeding:
- **Email:** `admin@digisell.local`
- **Password:** `Admin1234!`

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">
Made with ❤️ &nbsp;|&nbsp; <a href="https://digisell-app-production.up.railway.app">Live Demo</a>
</div>
