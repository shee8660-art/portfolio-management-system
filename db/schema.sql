-- ============================================================
-- Portfolio Management System — PostgreSQL schema (Supabase)
-- Run this in Supabase Dashboard → SQL Editor → New query → Run.
-- It is safe to run more than once (IF NOT EXISTS / ON CONFLICT).
-- ============================================================

-- Profiles: one row = one public landing page
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  title text default '',
  bio text default '',
  avatar_url text default '',
  email text default '',
  location text default '',
  socials jsonb not null default '{}'::jsonb,
  theme jsonb not null default '{}'::jsonb,
  layout text not null default 'modern',
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Skills with a 0–100 rating
create table if not exists skills (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  level int not null default 50 check (level >= 0 and level <= 100),
  category text default '',
  sort_order int not null default 0
);

-- Gallery / portfolio items
create table if not exists gallery_items (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text default '',
  image_url text not null,
  sort_order int not null default 0
);

-- Custom sections (Services, Testimonials, Contact, …).
-- `type` is a label such as 'services' | 'testimonials' | 'contact' | 'custom'.
-- `content` holds the section data, e.g. for services:
--   {"items": [{"title": "Web Design", "description": "..."}]}
-- and for testimonials:
--   {"items": [{"quote": "...", "author": "Maria S."}]}
create table if not exists custom_sections (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  type text not null default 'custom',
  title text not null default '',
  content jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  visible boolean not null default true
);

-- Messages sent through a profile's contact form
create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_profiles_slug on profiles (slug);
create index if not exists idx_profiles_published on profiles (is_published);
create index if not exists idx_skills_profile on skills (profile_id, sort_order);
create index if not exists idx_gallery_profile on gallery_items (profile_id, sort_order);
create index if not exists idx_sections_profile on custom_sections (profile_id, sort_order);
create index if not exists idx_messages_profile on contact_messages (profile_id, created_at desc);

-- Keep updated_at fresh
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_profiles_updated_at on profiles;
create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- ============================================================
-- Seed demo profile: Juan Dela Cruz (slug: juan-dela-cruz)
-- ============================================================
insert into profiles (slug, name, title, bio, avatar_url, email, location, socials, theme, layout, is_published)
values (
  'juan-dela-cruz',
  'Juan Dela Cruz',
  'UI/UX Designer & Front-End Developer',
  'Hi! I''m Juan, a designer and developer based in Manila. I turn ideas into clean, usable products — from brand identities and marketing sites to full web apps. I love good typography, honest feedback, and shipping work that people enjoy using.',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
  'juan@example.com',
  'Manila, Philippines',
  '{"website": "https://example.com", "github": "https://github.com", "linkedin": "https://linkedin.com", "twitter": "https://x.com", "instagram": "https://instagram.com"}'::jsonb,
  '{"primary": "#2563eb", "accent": "#f59e0b", "font": "system", "mode": "light"}'::jsonb,
  'modern',
  true
)
on conflict (slug) do nothing;

-- Skills for the demo profile
insert into skills (profile_id, name, level, category, sort_order)
select id, s.name, s.level, s.category, s.sort_order
from profiles p,
  (values
    ('UI/UX Design', 92, 'Design', 0),
    ('React / Next.js', 88, 'Development', 1),
    ('TypeScript', 85, 'Development', 2),
    ('Figma', 90, 'Design', 3),
    ('Node.js', 78, 'Development', 4)
  ) as s(name, level, category, sort_order)
where p.slug = 'juan-dela-cruz'
  and not exists (select 1 from skills where profile_id = p.id);

-- Gallery items for the demo profile
insert into gallery_items (profile_id, title, description, image_url, sort_order)
select id, g.title, g.description, g.image_url, g.sort_order
from profiles p,
  (values
    ('E-commerce Redesign', 'A full redesign of a local online store — +38% checkout conversion.', 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=900&q=80', 0),
    ('Brand Identity — Café Luna', 'Logo, menu and packaging for a neighbourhood café in Quezon City.', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&q=80', 1),
    ('Analytics Dashboard', 'A real-time dashboard for a logistics startup, built with Next.js.', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&q=80', 2)
  ) as g(title, description, image_url, sort_order)
where p.slug = 'juan-dela-cruz'
  and not exists (select 1 from gallery_items where profile_id = p.id);

-- Custom sections for the demo profile: Services + Testimonials
insert into custom_sections (profile_id, type, title, content, sort_order, visible)
select id, c.type, c.title, c.content, c.sort_order, true
from profiles p,
  (values
    ('services', 'Services',
      '{"items": [{"title": "UI/UX Design", "description": "Wireframes, prototypes and design systems in Figma."}, {"title": "Web Development", "description": "Fast, responsive sites and apps with Next.js and TypeScript."}, {"title": "Brand Identity", "description": "Logos, colour systems and guidelines that stand out."}]}'::jsonb, 0),
    ('testimonials', 'What clients say',
      '{"items": [{"quote": "Juan redesigned our store and sales went up within a month. Clear, fast, and easy to work with.", "author": "Maria Santos, Café Luna"}, {"quote": "The dashboard he built is the first thing our team opens every morning.", "author": "Paolo Reyes, ShipFast PH"}]}'::jsonb, 1)
  ) as c(type, title, content, sort_order)
where p.slug = 'juan-dela-cruz'
  and not exists (select 1 from custom_sections where profile_id = p.id);
