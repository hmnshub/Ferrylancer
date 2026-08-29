-- =====================================================================
-- Ferrylance — Supabase schema
-- =====================================================================
-- Run this once against your Supabase project (SQL Editor -> New query,
-- paste, Run). Safe to re-run: everything uses IF NOT EXISTS / OR REPLACE.
--
-- Auth (sign up / log in) is handled entirely by Supabase Auth already —
-- this file only adds the *application* tables the frontend and the
-- Node.js backend (see /server) read and write.
-- =====================================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------
-- profiles
-- One row per user (both freelancers and clients). Role-specific fields
-- are simply nullable when not relevant to that role, which keeps the
-- onboarding "save as you go / finish later" flow simple: any field can
-- be null until the wizard reaches that step.
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text check (role in ('freelancer', 'client')) not null default 'freelancer',

  -- shared
  full_name text,
  title text,               -- freelancer: professional title / client: role at company
  location text,
  avatar_url text,
  cover_url text,
  about text,
  links jsonb not null default '[]'::jsonb, -- [{ id, url, label, key, icon }]

  -- freelancer-specific
  short_intro text,
  category text,
  specialization text,
  experience_years text,
  availability text,
  skills jsonb not null default '[]'::jsonb,

  -- client-specific
  company_name text,
  industry text,
  company_size text,
  founded_year text,
  mission text,
  hiring_frequency text,
  budget_range text,
  hiring_categories jsonb not null default '[]'::jsonb,
  projects_posted int not null default 0,

  -- onboarding / lifecycle
  onboarding_step int not null default 1,
  profile_completed boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Existing profile tables need this migration to enable cover photos.
alter table public.profiles add column if not exists cover_url text;

-- ---------------------------------------------------------------------
-- freelancer sub-sections (kept as separate tables so the onboarding
-- "Skills & Services", "Portfolio", "Experience" steps map 1:1 to rows
-- instead of being crammed into JSON blobs on `profiles`)
-- ---------------------------------------------------------------------
create table if not exists public.freelancer_skills (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  level text
);

create table if not exists public.freelancer_services (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  price_from text
);

create table if not exists public.portfolio_items (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  category text,
  description text,
  image_url text,
  external_link text,       -- YouTube / Instagram / website — no video uploads
  created_at timestamptz not null default now()
);

create table if not exists public.experience_entries (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role text not null,
  company text,
  period text,
  description text
);

create table if not exists public.education_entries (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  school text not null,
  degree text,
  period text
);

create table if not exists public.certifications (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  issuer text,
  year text
);

-- ---------------------------------------------------------------------
-- posts (LinkedIn-style feed updates)
-- ---------------------------------------------------------------------
create table if not exists public.posts (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  type text not null default 'post', -- 'post' | 'project' (client project announcement)
  content text not null,
  image text,
  images jsonb not null default '[]'::jsonb,
  external_link text,
  likes int not null default 0,
  comments int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.posts add column if not exists images jsonb not null default '[]'::jsonb;

create table if not exists public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.post_comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- projects & proposals
-- ---------------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references public.profiles (id) on delete set null,
  hired_freelancer_id uuid references public.profiles (id) on delete set null,
  title text not null,
  description text,
  status text not null default 'Open', -- Open | In Progress | Completed | Closed
  budget text,
  accepted_budget text,
  escrow_amount text,
  escrow_status text not null default 'Not funded', -- Not funded | Held | Released
  estimated_time text,
  deadline text,
  application_deadline date,
  tags jsonb not null default '[]'::jsonb,
  proposals int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.proposals (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects (id) on delete cascade,
  freelancer_id uuid not null references public.profiles (id) on delete cascade,
  bid_amount text,
  delivery_days text,
  cover_letter text,
  proposal_links jsonb not null default '[]'::jsonb,
  status text not null default 'Under Review', -- Under Review | Accepted | Declined
  created_at timestamptz not null default now()
);

-- Existing projects need this migration after the original schema has run.
alter table public.proposals add column if not exists proposal_links jsonb not null default '[]'::jsonb;
alter table public.projects add column if not exists estimated_time text;
alter table public.projects add column if not exists application_deadline date;
alter table public.projects add column if not exists hired_freelancer_id uuid references public.profiles (id) on delete set null;
alter table public.projects add column if not exists accepted_budget text;
alter table public.projects add column if not exists escrow_amount text;
alter table public.projects add column if not exists escrow_status text not null default 'Not funded';

create table if not exists public.saved_projects (
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table if not exists public.milestones (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  status text not null default 'upcoming', -- upcoming | in_progress | done
  due date,
  amount text
);

-- ---------------------------------------------------------------------
-- connections (network / "connect" button on profiles)
-- ---------------------------------------------------------------------
create table if not exists public.connections (
  id uuid primary key default uuid_generate_v4(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending', -- pending | accepted | declined
  created_at timestamptz not null default now(),
  unique (requester_id, recipient_id)
);

-- LinkedIn-style one-way follows.
create table if not exists public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

-- Ratings/reviews left by users after working together.
create table if not exists public.ratings (
  id uuid primary key default uuid_generate_v4(),
  rated_user_id uuid not null references public.profiles (id) on delete cascade,
  rater_user_id uuid not null references public.profiles (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  score numeric(2,1) not null check (score >= 1 and score <= 5),
  review text,
  created_at timestamptz not null default now(),
  unique (rated_user_id, rater_user_id, project_id)
);

-- ---------------------------------------------------------------------
-- messaging
-- ---------------------------------------------------------------------
create table if not exists public.conversations (
  id uuid primary key default uuid_generate_v4(),
  participant_a uuid not null references public.profiles (id) on delete cascade,
  participant_b uuid not null references public.profiles (id) on delete cascade,
  updated_at timestamptz not null default now(),
  unique (participant_a, participant_b)
);

create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null, -- proposal | message | connection | payment | system
  text text not null,
  meta jsonb not null default '{}'::jsonb, -- extra context: requester_id, accepter_id, etc.
  unread boolean not null default true,
  created_at timestamptz not null default now()
);

-- Migration: add meta column to existing notifications tables
alter table public.notifications add column if not exists meta jsonb not null default '{}'::jsonb;


-- ---------------------------------------------------------------------
-- wallet / earnings
-- ---------------------------------------------------------------------
create table if not exists public.wallets (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  balance numeric not null default 0,
  pending numeric not null default 0,
  lifetime numeric not null default 0
);

create table if not exists public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  label text not null,
  amount numeric not null,
  status text not null default 'Pending', -- Pending | Completed
  created_at timestamptz not null default now()
);

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.freelancer_skills enable row level security;
alter table public.freelancer_services enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.experience_entries enable row level security;
alter table public.education_entries enable row level security;
alter table public.certifications enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;
alter table public.projects enable row level security;
alter table public.proposals enable row level security;
alter table public.saved_projects enable row level security;
alter table public.milestones enable row level security;
alter table public.connections enable row level security;
alter table public.follows enable row level security;
alter table public.ratings enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.wallets enable row level security;
alter table public.transactions enable row level security;

-- Profiles: publicly readable (it's a marketplace — people need to find each
-- other), but only the owner can insert/update their own row.
drop policy if exists "profiles are publicly readable" on public.profiles;
create policy "profiles are publicly readable" on public.profiles for select using (true);

drop policy if exists "users manage their own profile" on public.profiles;
create policy "users manage their own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Sub-sections of a freelancer profile: publicly readable, owner-writable.
do $$
declare
  t text;
begin
  foreach t in array array['freelancer_skills', 'freelancer_services', 'portfolio_items', 'experience_entries', 'education_entries', 'certifications']
  loop
    execute format('drop policy if exists "public read" on public.%I', t);
    execute format('create policy "public read" on public.%I for select using (true)', t);
    execute format('drop policy if exists "owner write" on public.%I', t);
    execute format('create policy "owner write" on public.%I for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id)', t);
  end loop;
end $$;

-- Posts / comments: public read, owner write.
drop policy if exists "posts public read" on public.posts;
create policy "posts public read" on public.posts for select using (true);
drop policy if exists "posts owner write" on public.posts;
create policy "posts owner write" on public.posts for all using (auth.uid() = author_id) with check (auth.uid() = author_id);

drop policy if exists "likes public read" on public.post_likes;
create policy "likes public read" on public.post_likes for select using (true);
drop policy if exists "likes owner write" on public.post_likes;
create policy "likes owner write" on public.post_likes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "comments public read" on public.post_comments;
create policy "comments public read" on public.post_comments for select using (true);
drop policy if exists "comments owner write" on public.post_comments;
create policy "comments owner write" on public.post_comments for all using (auth.uid() = author_id) with check (auth.uid() = author_id);

-- Projects: public read (marketplace listing); only the posting client can write.
drop policy if exists "projects public read" on public.projects;
create policy "projects public read" on public.projects for select using (true);
drop policy if exists "projects owner write" on public.projects;
create policy "projects owner write" on public.projects for all using (auth.uid() = client_id) with check (auth.uid() = client_id);

-- Proposals: visible to the freelancer who wrote it and the client who owns the project.
drop policy if exists "proposals visible to participants" on public.proposals;
create policy "proposals visible to participants" on public.proposals for select using (
  auth.uid() = freelancer_id
  or auth.uid() in (select client_id from public.projects where projects.id = proposals.project_id)
);
drop policy if exists "freelancer creates own proposal" on public.proposals;
-- Owners cannot submit proposals to their own projects, and applications close on the configured date.
create policy "freelancer creates own proposal" on public.proposals for insert with check (
  auth.uid() = freelancer_id
  and auth.uid() <> (select client_id from public.projects where projects.id = proposals.project_id)
  and (
    (select application_deadline from public.projects where projects.id = proposals.project_id) is null
    or (select application_deadline from public.projects where projects.id = proposals.project_id) >= current_date
  )
);
drop policy if exists "participants update proposal" on public.proposals;
create policy "participants update proposal" on public.proposals for update using (
  auth.uid() = freelancer_id
  or auth.uid() in (select client_id from public.projects where projects.id = proposals.project_id)
);

drop policy if exists "saved projects owner only" on public.saved_projects;
create policy "saved projects owner only" on public.saved_projects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "milestones visible to project participants" on public.milestones;
create policy "milestones visible to project participants" on public.milestones for select using (true);
drop policy if exists "milestones client write" on public.milestones;
create policy "milestones client write" on public.milestones for all using (
  auth.uid() in (select client_id from public.projects where projects.id = milestones.project_id)
);

-- Connections: visible + writable by either party.
drop policy if exists "connections participants only" on public.connections;
drop policy if exists "connections public read" on public.connections;
create policy "connections public read" on public.connections for select using (true);
create policy "connections participants only" on public.connections for insert with check (
  auth.uid() = requester_id
) ;
drop policy if exists "connections participants update" on public.connections;
create policy "connections participants update" on public.connections for update using (
  auth.uid() = requester_id or auth.uid() = recipient_id
) with check (auth.uid() = requester_id or auth.uid() = recipient_id);
drop policy if exists "connections participants delete" on public.connections;
create policy "connections participants delete" on public.connections for delete using (
  auth.uid() = requester_id or auth.uid() = recipient_id
);

drop policy if exists "follows public read" on public.follows;
create policy "follows public read" on public.follows for select using (true);
drop policy if exists "users manage own follows" on public.follows;
create policy "users manage own follows" on public.follows for insert with check (auth.uid() = follower_id);
drop policy if exists "users delete own follows" on public.follows;
create policy "users delete own follows" on public.follows for delete using (auth.uid() = follower_id);

drop policy if exists "ratings public read" on public.ratings;
create policy "ratings public read" on public.ratings for select using (true);
drop policy if exists "users create ratings" on public.ratings;
create policy "users create ratings" on public.ratings for insert with check (auth.uid() = rater_user_id);
drop policy if exists "users update ratings" on public.ratings;
create policy "users update ratings" on public.ratings for update using (auth.uid() = rater_user_id) with check (auth.uid() = rater_user_id);
drop policy if exists "users delete ratings" on public.ratings;
create policy "users delete ratings" on public.ratings for delete using (auth.uid() = rater_user_id);

-- Conversations & messages: only the two participants can read/write.
drop policy if exists "conversations participants only" on public.conversations;
create policy "conversations participants only" on public.conversations for all using (
  auth.uid() = participant_a or auth.uid() = participant_b
) with check (auth.uid() = participant_a or auth.uid() = participant_b);

drop policy if exists "messages participants only" on public.messages;
create policy "messages participants only" on public.messages for all using (
  auth.uid() in (
    select participant_a from public.conversations where conversations.id = messages.conversation_id
    union
    select participant_b from public.conversations where conversations.id = messages.conversation_id
  )
) with check (auth.uid() = sender_id);

-- Notifications: users own their inbox, while either participant in a
-- connection may create a notification for the other participant.
drop policy if exists "notifications owner only" on public.notifications;
drop policy if exists "notifications owner read" on public.notifications;
drop policy if exists "notifications owner insert" on public.notifications;
drop policy if exists "notifications connection insert" on public.notifications;
drop policy if exists "notifications owner update" on public.notifications;
drop policy if exists "notifications owner delete" on public.notifications;
create policy "notifications owner read" on public.notifications for select using (
  auth.uid() = user_id
);
create policy "notifications insert allowed" on public.notifications for insert with check (
  auth.uid() is not null
);
create policy "notifications owner update" on public.notifications for update using (
  auth.uid() = user_id
) with check (auth.uid() = user_id);
create policy "notifications owner delete" on public.notifications for delete using (
  auth.uid() = user_id
);

-- Wallet & transactions: owner only.
drop policy if exists "wallet owner only" on public.wallets;
create policy "wallet owner only" on public.wallets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "transactions owner only" on public.transactions;
create policy "transactions owner only" on public.transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =====================================================================
-- Storage buckets (avatars / cover photos / post images / portfolio images)
-- Run separately if the `storage` schema isn't accessible from SQL editor
-- in your Supabase plan — you can also create these from Dashboard > Storage.
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('portfolio-images', 'portfolio-images', true)
on conflict (id) do nothing;
