# PSM Auto Part — Setup Guide

This turns your prototype into a real, hosted app with individual staff logins.
No coding needed — just follow the steps below in order. Expect ~20–30 minutes.

---  

## Part 1 — Create your database (Supabase)

1. Go to https://supabase.com and click **Start your project**. Sign up (free).
2. Click **New project**. Give it a name (e.g. "shop-floor"), set a database password
   (save this somewhere safe), pick a region close to you, and click **Create new project**.
   Wait ~2 minutes while it sets up.
3. In the left sidebar, click the **SQL Editor** icon.
4. Click **New query**.
5. Open the file `supabase-schema.sql` (included in this project), copy ALL of it,
   and paste it into the SQL editor.
6. Click **Run**. You should see "Success. No rows returned." This created all your
   tables (inventory, customers, orders, staff, finances).

## Part 2 — Get your API keys

1. In Supabase, click the **gear icon** (Project Settings) in the left sidebar.
2. Click **API**.
3. You'll need two values from this page:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (a long string under "Project API keys")
   Keep this tab open — you'll paste these in Part 4.

## Part 3 — Add your staff as users

1. Still in Supabase, click **Authentication** in the left sidebar.
2. Click **Users**, then **Add user** → **Create new user**.
3. Enter each staff member's email and a temporary password. Repeat for everyone
   who needs access. They can change their password later (or you can resend
   invites) — for now this gets everyone a working login.
4. Uncheck "Auto Confirm User" only if you want them to verify by email first;
   otherwise leave it checked so they can log in immediately.

## Part 4 — Deploy the app (Vercel)

1. Go to https://vercel.com and sign up (free) — signing up with your GitHub
   account is easiest.
2. If you don't have GitHub yet: go to https://github.com, sign up, then create
   a **New repository** (any name, e.g. "shop-floor"). Upload all the files from
   this project folder to that repository (GitHub's website lets you drag-and-drop
   files with "Add file" → "Upload files").
3. Back in Vercel, click **Add New** → **Project**, and import the GitHub
   repository you just created.
4. Before clicking Deploy, expand **Environment Variables** and add two:
   - `VITE_SUPABASE_URL` → paste your Project URL from Part 2
   - `VITE_SUPABASE_ANON_KEY` → paste your anon public key from Part 2
5. Click **Deploy**. Wait ~1 minute.
6. You'll get a live URL like `shop-floor-yourname.vercel.app` — that's your app.
   Share this link with your staff; they log in with the email/password you
   set up in Part 3.

## Optional — Use your own domain

In Vercel, go to your project → **Settings** → **Domains**, and add a domain you
own (e.g. `ops.yourbusiness.com`). Vercel will show you a DNS record to add at
wherever you bought the domain.

---

## Day-to-day maintenance

- **Add a new staff member:** Supabase → Authentication → Users → Add user.
- **Remove a staff member:** Supabase → Authentication → Users → find them → delete.
- **See your raw data / fix something by hand:** Supabase → Table Editor.
- **Backups:** Supabase backs up automatically on the free tier for a short
  window; for real backup history, upgrade to a paid Supabase plan (~$25/mo)
  once the business depends on this data.

## If something breaks

The most common issue is a typo in the environment variables in Vercel — double
check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` exactly match what's in
Supabase → Project Settings → API.
