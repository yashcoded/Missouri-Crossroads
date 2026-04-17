<div align="center">

# Missouri Crossroads

**Explore Missouri’s heritage on an interactive map** — museums, archives, historic markers, and more than **1,200** sites across the state, with search, filters, and rich place details.

[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![AWS](https://img.shields.io/badge/AWS-Amplify%20%2F%20SDK-232F3E?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)
[![License](https://img.shields.io/badge/License-MIT-4caf50.svg)](LICENSE)

[Live site](https://www.missouricrossroads.org/) · [Report an issue](https://github.com/yashb196/Missouri-Crossroads/issues) · [CI & Amplify docs](.github/GITHUB_ACTIONS.md)

</div>

---

## Contents

- [Why this project](#why-this-project)
- [Features](#features)
- [Stack](#stack)
- [Quick start](#quick-start)
- [Project layout](#project-layout)
- [Database (reference)](#database-reference)
- [Development](#development)
- [API overview](#api-overview)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License & acknowledgments](#license--acknowledgments)

---

## Why this project

Missouri Crossroads (**MOX**) is a free, open-access platform for discovering and managing Missouri’s cultural and historical places. It combines a responsive map UI with AWS-backed APIs for data, auth, and admin workflows—built for researchers, educators, and the public.

---

## Features

| | |
|:---|:---|
| **Map** | Google Maps–powered view of 1000+ locations with categories, pins, and detail panels |
| **Discovery** | Search and filter by name, address, tags, or category |
| **Performance** | Location-aware loading so the map stays fast as you pan and zoom |
| **Accounts** | Cognito authentication; DynamoDB for users, notes, and admin logs |
| **Media & data** | S3-backed assets; admin tools and CSV workflows for curating locations |

---

## Stack

- **App:** Next.js (App Router), React, TypeScript, Tailwind CSS  
- **Map:** Google Maps Platform  
- **Cloud:** AWS (Cognito, DynamoDB, S3; deployable via Amplify—see [CI docs](.github/GITHUB_ACTIONS.md))  
- **Quality:** ESLint, Prettier, Jest, Playwright  

---

## Quick start

### Prerequisites

- Node.js **18+**
- **pnpm** (recommended) or npm
- AWS account (S3, DynamoDB, Cognito) and Google Maps API keys for full functionality

### 1. Clone and install

```bash
git clone https://github.com/yashb196/Missouri-Crossroads.git
cd Missouri-Crossroads
pnpm install
```

### 2. Environment

```bash
cp .env.example .env.local
```

<details>
<summary><strong>Example environment variables</strong> (click to expand)</summary>

```bash
# AWS (public / client-safe)
NEXT_PUBLIC_AWS_REGION=us-east-2
NEXT_PUBLIC_COGNITO_USER_POOL_ID=your_user_pool_id
NEXT_PUBLIC_COGNITO_CLIENT_ID=your_client_id
NEXT_PUBLIC_DYNAMODB_USERS_TABLE=missouri-crossroads-users
NEXT_PUBLIC_DYNAMODB_NOTES_TABLE=missouri-crossroads-notes
NEXT_PUBLIC_DYNAMODB_ADMIN_LOGS_TABLE=missouri-crossroads-admin-logs

# AWS (server-only — never use NEXT_PUBLIC_ for secrets)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=mr-crossroads-bucket
COGNITO_CLIENT_SECRET=your_client_secret

# Google Maps (domain-restricted keys recommended)
NEXT_PUBLIC_MAP_KEY=your_google_maps_api_key
NEXT_PUBLIC_PLACES_KEY=your_google_places_api_key
```

</details>

### 3. Run locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project layout

```
├── app/                 # Routes, layouts, UI
│   ├── api/             # REST handlers (admin, auth, database, map)
│   ├── lib/             # Config, models, utilities
│   └── map/             # Map experience
├── components/ui/       # Shared UI (e.g. shadcn-style primitives)
├── public/              # Static assets
├── tests/               # Playwright E2E specs
└── types/               # Shared TypeScript types
```

---

## Database reference

<details>
<summary><strong>Example DynamoDB shapes</strong> (click to expand)</summary>

**Users (`missouri-crossroads-users`)**

```json
{
  "id": "user-1234567890-abc123def",
  "email": "user@example.com",
  "name": "John Doe",
  "preferredUsername": "johndoe",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "lastLogin": "2024-01-01T12:00:00.000Z",
  "isActive": true,
  "role": "user"
}
```

**Notes (`missouri-crossroads-notes`)**

```json
{
  "id": "note-1234567890-abc123def",
  "title": "My Note",
  "bodyText": "This is my note content",
  "creator": "user-1234567890-abc123def",
  "creatorEmail": "user@example.com",
  "type": "note",
  "media": ["https://s3.../image1.jpg"],
  "audio": ["https://s3.../audio1.mp3"],
  "latitude": 39.0997,
  "longitude": -94.5786,
  "published": true,
  "tags": ["important", "work"],
  "time": "2024-01-01T00:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

</details>

---

## Development

### Scripts

```bash
pnpm dev              # Dev server (Turbopack)
pnpm build            # Production build
pnpm start            # Run production build locally

pnpm test             # Unit + E2E
pnpm test:watch       # Jest watch
pnpm test:coverage    # Coverage report

pnpm lint             # ESLint
pnpm lint:fix         # ESLint --fix
pnpm format           # Prettier
```

### Adding locations

- Admin UI, CSV upload, or API—see endpoints below.

---

## API overview

| Area | Methods | Purpose |
|------|---------|---------|
| **Map** | `GET /api/map/csv-data` | Location data for the map |
| | `POST /api/admin/upload-csv` | Upload CSV data |
| **Users / notes** | `GET/POST /api/database/users`, `GET/POST /api/database/notes` | CRUD-style access |
| **Admin** | `GET /api/admin/stats`, `POST /api/admin/bulk-notes`, `GET /api/admin/logs` | Operations & audit |

---

## Testing

```bash
pnpm test
pnpm test MissouriMap.test.tsx   # single file
pnpm test:coverage
pnpm test:e2e                     # Playwright (see tests/README.md)
```

---

## Deployment

1. Configure **production env vars** on your host (Amplify, Vercel, etc.).  
2. Ensure **Google Maps** keys allow your production domain.  
3. **Build:** `pnpm build` — for AWS Amplify and GitHub Actions integration, see [`.github/GITHUB_ACTIONS.md`](.github/GITHUB_ACTIONS.md).

---

## Contributing

1. Fork the repo and create a branch: `git checkout -b feature/your-feature`  
2. Make changes and run `pnpm test`  
3. Open a PR against `main`  

Issues welcome: [github.com/yashb196/Missouri-Crossroads/issues](https://github.com/yashb196/Missouri-Crossroads/issues)

---

## License & acknowledgments

Licensed under the **MIT License** — see [LICENSE](LICENSE).

Thanks to contributors and partners in Missouri’s heritage community, **Google Maps Platform**, **AWS**, and the **Next.js** team.

---

<div align="center">

**Built for Missouri’s historical heritage**

</div>
