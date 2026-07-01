# Recipes2Remember

A full-stack recipe sharing website with an old-school country Americana aesthetic.
Homemade. Handed down. Never forgotten.

## Tech Stack
- React + Vite (plain JavaScript)
- Supabase (database, auth, storage)
- Vercel (hosting)
- jsPDF (PDF export, via CDN)
- Plain CSS — one App.css file

## Local Development

### 1. Clone the repo
```
git clone https://github.com/YOUR_USERNAME/recipes2remember.git
cd recipes2remember
```

### 2. Install dependencies
```
npm install
```

### 3. Set up environment variables
```
cp .env.example .env
```
Fill in your Supabase URL and anon key.

### 4. Set up Supabase
- Create a new project at supabase.com
- Run the SQL schema below in the SQL Editor
- Create two storage buckets: `recipe-covers` and `step-media` (both public)
- Add storage policies (public read, authenticated write)

### 5. Run the dev server
```
npm run dev
```

## Database Setup

Run in Supabase SQL Editor:

```sql
create extension if not exists "pgcrypto";

create table recipes (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  image_url text,
  video_url text,
  author text not null,
  servings integer default 4,
  prep_time text,
  cook_time text,
  tags text[] default '{}',
  status text default 'published' check (status in ('published', 'archived', 'draft')),
  likes_count integer default 0,
  nutrition_facts jsonb default '{}',
  ingredients jsonb default '[]',
  steps jsonb default '[]',
  created_at timestamptz default now()
);

create table likes (
  id uuid default gen_random_uuid() primary key,
  recipe_id uuid references recipes(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(recipe_id, user_id)
);

create table favorites (
  id uuid default gen_random_uuid() primary key,
  recipe_id uuid references recipes(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(recipe_id, user_id)
);

alter table recipes enable row level security;
alter table likes enable row level security;
alter table favorites enable row level security;

create policy "Public can read published recipes" on recipes for select using (status = 'published');
create policy "Auth users can insert recipes" on recipes for insert to authenticated with check (true);
create policy "Auth users can update own recipes" on recipes for update to authenticated using (true);
create policy "Auth users can delete recipes" on recipes for delete to authenticated using (true);
create policy "Users can read all likes" on likes for select using (true);
create policy "Users can manage own likes" on likes for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can delete own likes" on likes for delete to authenticated using (auth.uid() = user_id);
create policy "Users can read all favorites" on favorites for select using (true);
create policy "Users can manage own favorites" on favorites for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can delete own favorites" on favorites for delete to authenticated using (auth.uid() = user_id);
```

## Environment Variables

```
VITE_SUPABASE_URL=       # Your Supabase project URL
VITE_SUPABASE_ANON_KEY=  # Your Supabase anon/public key
VITE_ADMIN_PIN=          # PIN for the admin panel (default: 1234)
```

## Deployment

Configured for Vercel:
1. Push to GitHub
2. Import the repo in Vercel
3. Add the 3 environment variables in Vercel project settings
4. Deploy

## Admin Panel

Click **⚙ Admin** in the nav and enter the PIN set in `VITE_ADMIN_PIN`.
From there you can edit, archive, or delete any recipe.

## Features

- Browse and search recipes with tag filtering
- Like and favorite recipes (requires sign in)
- Add recipes with photo/video uploads per step
- Generate recipe PDFs and shopping list PDFs
- Shopping list with ingredient aggregation across multiple recipes, organized by grocery aisle
- Admin panel to edit, archive, and delete recipes
