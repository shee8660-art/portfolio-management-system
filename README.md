# Portfolio Management System

A dynamic, customizable portfolio management system: public landing pages for
many users, managed from one admin dashboard.

- **Public landing page** per user at `/[slug]` — Profile, About Me, Skills
  (with 0–100 ratings), Gallery/Portfolio, custom sections (Services,
  Testimonials, …), and a contact form.
- **Admin dashboard** at `/admin` — create, edit, duplicate, delete and
  publish/unpublish landing pages; edit every field; customize colours, font,
  layout (modern / minimal / bold) and light/dark theme per page.
- **Responsive** — mobile, tablet and desktop.
- **Stack** — Next.js 16 (App Router) + React 19 + TypeScript, plain CSS,
  PostgreSQL via `pg`. The database lives in **Supabase PostgreSQL** (free
  tier); the app itself is hosted on **Vercel** (free tier). No database runs
  on Vercel — Vercel only hosts the app, Supabase hosts the data.

> ⚠️ **Security — change the default admin password immediately.**
> Default login is `admin` / `admin123`. After your first login, change the
> `ADMIN_PASSWORD` environment variable in Vercel (see step 5) and redeploy.
> For stronger security, set `ADMIN_PASSWORD_HASH` to a bcrypt hash instead
> (see `.env.example`).

---

## Step-by-step guide: host it on Vercel with a PostgreSQL database

### Step 1 — Create a free Supabase project (the PostgreSQL database)

1. Go to [supabase.com](https://supabase.com) and sign in (or create a free account).
2. Click **New project**, pick a name (e.g. `portfolio-system`), set a strong
   **Database Password** — save it somewhere safe — and choose a region close
   to you (e.g. Singapore / Southeast Asia).
3. Wait for the project to finish provisioning (about 1–2 minutes).
4. In the Supabase dashboard, go to **Project Settings → Database**.
5. Under **Connection string**, select the **Transaction pooler** tab
   (it uses port **6543** — this is the one to use on Vercel, because Vercel
   is serverless and the pooler handles many short connections).
6. Copy the connection string. It looks like:
   `postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`
7. Replace `[YOUR-PASSWORD]` with the database password from step 2.
   This whole string is your `DATABASE_URL`.

### Step 2 — Create the tables (run the schema in Supabase)

1. In the Supabase dashboard, open the **SQL Editor** (left sidebar).
2. Click **New query**.
3. Open `supabase/schema.sql` from this repo, copy its entire contents, and
   paste them into the SQL Editor.
4. Click **Run**. You should see “Success. No rows returned.”
5. This creates the tables `profiles`, `skills`, `gallery_items`,
   `custom_sections` and `contact_messages`, plus a **demo profile**:
   **Juan Dela Cruz** at slug `juan-dela-cruz`, with 5 skills, 3 gallery
   items, and Services + Testimonials sections.

### Step 3 — Push the code to GitHub

From this project folder, in a terminal:

```bash
git init
git add .
git commit -m "Portfolio Management System"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/portfolio-management-system.git
git push -u origin main
```

(Replace `YOUR-USERNAME` with your GitHub username, and create the empty
repo `portfolio-management-system` on github.com first.)
Prefer a GUI? Use **GitHub Desktop**: File → Add Local Repository → pick
this folder → Publish repository.

### Step 4 — Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (you can sign in with GitHub).
2. Click **Add New… → Project**.
3. Click **Import** next to your `portfolio-management-system` GitHub repo.
   (If it is not listed, click **Adjust GitHub App Permissions** and grant
   access to the repo.)
4. **Framework Preset** should auto-detect as **Next.js** — leave it.
   Leave Build Command (`next build`) and Output Directory as-is.
5. Expand **Environment Variables** and add these three:
   | Name | Value |
   |---|---|
   | `DATABASE_URL` | The Supabase Transaction pooler string from Step 1 |
   | `ADMIN_USERNAME` | `admin` |
   | `ADMIN_PASSWORD` | A strong password you choose (not `admin123`) |
6. Click **Deploy**. The first build takes 1–3 minutes.
7. When it finishes, Vercel gives you a URL like
   `https://portfolio-management-system.vercel.app` — that is your live site.

### Step 5 — Test everything

1. Open your Vercel URL — the home page should list the demo profile
   **Juan Dela Cruz**.
2. Open `/juan-dela-cruz` — the full landing page (About, Skills, Gallery,
   Services, Testimonials, contact form).
3. Open `/admin` — log in with `admin` and the password you set in Step 4.
   (If you left `ADMIN_PASSWORD` as `admin123` for the first test, log in
   with `admin` / `admin123`.)
4. In the dashboard, try: **Create page** → fill in a name → **Edit** it →
   add a skill and a gallery item → **Save** → **View public page**.
   Try **Duplicate** and **Publish/Unpublish** too.
5. **Now change the password for real** (if you have not already):
   Vercel → your project → **Settings → Environment Variables** → edit
   `ADMIN_PASSWORD` → set a new strong password → **Save** → go to
   **Deployments** → **⋯ → Redeploy** the latest deployment. The new
   password takes effect after the redeploy.

### Step 6 — Run it locally (optional, for development)

```bash
npm install
cp .env.example .env.local
# Edit .env.local and fill in DATABASE_URL (and ADMIN_PASSWORD if you like)
npm run dev
```

Then open http://localhost:3000. The same database is used, so pages you
create locally appear on the live site too.

---

## Project structure

```
portfolio-management-system/
├── README.md
├── package.json                 # scripts: dev / build / start
├── next.config.mjs
├── tsconfig.json
├── .env.example                 # DATABASE_URL, ADMIN_USERNAME, ADMIN_PASSWORD, …
├── .gitignore
├── supabase/schema.sql          # tables + seed demo profile (run in Supabase SQL Editor)
├── db/schema.sql                # same schema, kept as a second copy
└── src/
    ├── app/
    │   ├── layout.tsx           # root layout
    │   ├── globals.css          # plain CSS, responsive
    │   ├── page.tsx             # / — home: list of published profiles
    │   ├── [slug]/page.tsx      # /[slug] — public landing page
    │   ├── admin/
    │   │   ├── page.tsx         # /admin — dashboard (login required)
    │   │   ├── login/page.tsx   # /admin/login
    │   │   └── edit/[id]/page.tsx  # /admin/edit/[id] — page editor
    │   └── api/
    │       ├── admin/login/route.ts   # POST — sets httpOnly session cookie
    │       ├── admin/logout/route.ts  # POST — clears the cookie
    │       ├── admin/me/route.ts      # GET — session check
    │       ├── profiles/route.ts      # GET list (admin) / POST create
    │       ├── profiles/[id]/route.ts # GET / PUT (whole profile incl. nested) / DELETE
    │       ├── profiles/[id]/duplicate/route.ts  # POST — copy a page
    │       └── contact/route.ts       # POST — store a contact-form message
    ├── components/
    │   ├── ContactForm.tsx      # public contact form
    │   ├── LoginForm.tsx
    │   ├── AdminDashboard.tsx   # list / create / duplicate / delete / publish
    │   └── ProfileEditor.tsx    # edit profile, theme, skills, gallery, sections
    └── lib/
        ├── db.ts                # lazy pg Pool — never connects at import/build time
        ├── auth.ts              # admin credentials + signed httpOnly session cookie
        ├── profiles.ts          # load profile + nested data, transactional upsert
        └── types.ts
```

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | Supabase Transaction pooler string (port 6543). |
| `ADMIN_USERNAME` | No | Defaults to `admin`. |
| `ADMIN_PASSWORD` | No | Defaults to `admin123` — **change it**. |
| `ADMIN_PASSWORD_HASH` | No | bcrypt hash of the password; when set, it takes priority over `ADMIN_PASSWORD`. Generate with `node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"`. |
| `SESSION_SECRET` | No | Secret for signing the admin session cookie. Defaults to the admin password. Set a long random value in production. |
| `NEXT_PUBLIC_SITE_URL` | No | Public URL of the deployed site (informational). |

## Notes & simplifications

- **No database → no crash.** If `DATABASE_URL` is missing, the home page
  shows a setup message and `next build` still passes. The database pool is
  created lazily on first use, never at import time.
- **Auth is deliberately simple:** a single admin account from environment
  variables, with an HMAC-signed httpOnly session cookie (12-hour expiry).
  There is no password stored in the database, and no in-app “change
  password” screen — change it via the `ADMIN_PASSWORD` env var and redeploy.
  For multiple admins, add a users table and real session storage.
- **Images are URLs**, not uploads: paste an image URL (e.g. Unsplash) for
  avatars and gallery items. For uploads, add Supabase Storage later.
- **Custom-section content** is stored as JSON (`{ "items": [...] }` or
  `{ "text": "…" }`). The editor accepts JSON, or plain text which is stored
  as `{ "text": … }`.
- **Free tiers:** Vercel Hobby and Supabase Free are enough for this app.
  The database lives in Supabase PostgreSQL — not on Vercel.
