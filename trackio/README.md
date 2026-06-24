# 💡 Track.IO

A minimalist project management + content calendar tool built with React + Vite.

---

## 🚀 Deploy in 10 minutes (free)

### Step 1 — Set up Supabase (shared database, free)

1. Go to https://supabase.com and sign up (free)
2. Click **New Project**, give it a name like `trackio`
3. Once created, go to **SQL Editor** and run this query to create the storage table:

```sql
create table trackio_store (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- Allow public read/write (no login required)
alter table trackio_store enable row level security;
create policy "Public access" on trackio_store for all using (true) with check (true);
```

4. Go to **Settings → API** and copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon / public key** → `VITE_SUPABASE_ANON_KEY`

---

### Step 2 — Deploy to Vercel (recommended) or Netlify

#### Option A: Vercel
1. Push this folder to a GitHub repo
2. Go to https://vercel.com → New Project → import your repo
3. In **Environment Variables**, add:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
4. Click Deploy — done! You get a live URL like `trackio.vercel.app`

#### Option B: Netlify
1. Push this folder to a GitHub repo
2. Go to https://netlify.com → Add new site → Import from Git
3. Build command: `npm run build` | Publish directory: `dist`
4. In **Site settings → Environment variables**, add the same two variables
5. Click Deploy

---

## 💻 Run locally

```bash
npm install
cp .env.example .env    # fill in your Supabase credentials
npm run dev             # opens at http://localhost:5173
```

---

## 🗂️ Project structure

```
src/
  App.jsx              # Shell + module registry (add new modules here)
  storage.js           # Data layer: Supabase + localStorage hybrid
  index.css            # Global reset
  components/
    ui.jsx             # Shared primitives: Modal, Input, StatusBadge, etc.
  modules/
    StatusTracker.jsx  # Module 1: task board/table with week rotation
    ContentCalendar.jsx# Module 2: content calendar with KPI counters
```

### Adding a new module
1. Create `src/modules/YourModule.jsx`
2. Import it in `App.jsx`
3. Add one entry to the `MODULES` array in `App.jsx`
That's it — no other changes needed.

---

## 🔑 Environment variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon (public) key |

Without these, the app runs in **local-only mode** (data stays on the device, not synced).
