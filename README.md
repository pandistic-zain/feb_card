# Valentine Card App

Production-ready Next.js app for a trending Valentine card interaction:
- `Yes` and `No` buttons
- `No` button tries to evade the cursor
- Responses are saved in a Prisma-backed database
- Built for Vercel deployment

## Stack

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS 4
- Framer Motion
- Prisma ORM + PostgreSQL

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env and set your database URL:

```bash
cp .env.example .env
```

3. Apply schema to your database:

```bash
npm run db:push
```

4. Start dev server:

```bash
npm run dev
```

## Prisma Commands

```bash
npm run db:migrate
npm run db:deploy
```

## Deploy to Vercel

1. Push this repo to GitHub/GitLab/Bitbucket.
2. Import project in Vercel.
3. Set `DATABASE_URL` in Vercel project environment variables.
4. Ensure migration runs during deploy (`npm run db:deploy`) or run it manually.
5. Deploy.

## App Structure

- `app/page.tsx`: Landing page and themed background
- `components/valentine-card.tsx`: Main interaction UI
- `app/api/responses/route.ts`: Save and aggregate responses
- `prisma/schema.prisma`: Database schema
- `lib/prisma.ts`: Prisma client singleton
