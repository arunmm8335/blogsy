-- Supabase/PostgreSQL schema for Blogsy (Phase 1)
-- Run in Supabase SQL Editor after creating your project.

create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  email text not null unique,
  password_hash text not null,
  bio text default '',
  profile_picture text default '',
  dob date,
  mobile text,
  reset_password_token text,
  reset_password_expires timestamptz,
  social_links jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  author_id uuid not null references users(id) on delete cascade,
  tags text[] not null default '{}',
  cover_image text default '',
  media jsonb not null default '[]'::jsonb,
  status text not null default 'published' check (status in ('draft', 'published')),
  likes_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  author_id uuid not null references users(id) on delete cascade,
  post_id uuid not null references posts(id) on delete cascade,
  parent_id uuid references comments(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists post_likes (
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists comment_reactions (
  comment_id uuid not null references comments(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  reaction text not null check (reaction in ('like', 'dislike')),
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create index if not exists idx_posts_author_id on posts(author_id);
create index if not exists idx_posts_status on posts(status);
create index if not exists idx_comments_post_id on comments(post_id);
create index if not exists idx_comments_parent_id on comments(parent_id);

-- Full-text search index can be added later with a trigger-based tsvector column.
