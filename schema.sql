-- Run this in the Supabase SQL Editor to set up the database

create table formats (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  icon text,
  sort_order integer default 0,
  created_at timestamptz not null default now()
);

create table decks (
  id uuid primary key default gen_random_uuid(),
  format_id uuid references formats(id) on delete cascade,
  name text not null,
  slug text,
  description text,
  creator text,
  source text,
  notes text,
  raw_list text not null,
  published boolean default false,
  pokemon_count integer not null default 0,
  trainer_count integer not null default 0,
  energy_count integer not null default 0,
  total_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table deck_cards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references decks(id) on delete cascade,
  card_name text not null,
  set_abbrev text not null,
  collector_number text not null,
  api_card_id text not null,
  image_url text not null,
  image_url_hires text not null,
  category text not null check (category in ('pokemon', 'trainer', 'energy')),
  count integer not null,
  sort_order integer not null default 0
);

create index deck_cards_deck_id_idx on deck_cards(deck_id);

-- Grant access to anon role
grant usage on schema public to anon;
grant all on formats to anon;
grant all on decks to anon;
grant all on deck_cards to anon;
