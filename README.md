# Laplace Logistique — Web Platform

**Plateforme de livraison e-commerce à Kinshasa, RDC.**  
La logistique modélisée comme un système mathématique — précision, optimisation, visibilité en temps réel.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com)

---

## Overview

Laplace Logistique is a delivery and e-commerce logistics platform serving sellers and businesses in Kinshasa, Democratic Republic of Congo. It provides:

- **Livraison express** — algorithm-optimised urban last-mile delivery
- **Suivi en temps réel** — live package tracking with unique reference codes
- **Paiement à la livraison** — cash collection on delivery with full traceability
- **Fulfillment** — warehousing, picking, packing, and dispatch for online sellers
- **Analytics & reporting** — actionable dashboards for sellers and backoffice teams

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + custom CSS animations |
| UI Components | shadcn/ui |
| Icons | Lucide React |
| Auth | Custom JWT via REST API |
| Analytics | Google Analytics 4 |
| Package Manager | pnpm |

---

## Project Structure

```
app/
  page.tsx              # Home page (marketing)
  layout.tsx            # Root layout + global metadata + JSON-LD
  login/                # Authentication
  dashboard/            # Seller dashboard
  backoffice/           # Internal operations (admin only)
  tracking/             # Public package tracking
  robots.ts             # Auto-generated robots.txt
  sitemap.ts            # Auto-generated sitemap.xml

components/
  navbar.tsx            # Top navigation
  footer.tsx            # Site footer
  dashboard/            # Dashboard-specific components
  ui/                   # shadcn/ui base components

contexts/
  auth-context.tsx      # Authentication state & API calls

types/
  auth.ts               # User, AuthState, UserRole types
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Install & Run

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

Create a `.env.local` file at the project root:

```env
NEXT_PUBLIC_API_SERVER_BASE_URL=https://your-api-url.com
NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

---

## SEO & Discoverability

The platform is optimised for search engines and AI tools (Google, ChatGPT, Perplexity):

- Full Open Graph + Twitter Card metadata
- JSON-LD structured data: `Organization`, `LocalBusiness`, `WebSite` schemas
- Auto-generated `/sitemap.xml` and `/robots.txt`
- `lang="fr-CD"` and `hreflang` for DRC French targeting
- Canonical URL set to `https://www.laplacelogistique.com`

---

## Deployment

The project is designed to deploy on **Vercel** or any Node.js-compatible host.

```bash
pnpm build
pnpm start
```

---

## Contact

- **Phone:** +243 836 885 324
- **Location:** Kinshasa, RDC
- **Website:** [www.laplacelogistique.com](https://www.laplacelogistique.com)

---

&copy; 2025 Laplace Logistique. Tous droits réservés.
