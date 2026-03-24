-- NextSport Database Schema
-- Run this in your Supabase SQL editor

-- Users (extends Supabase auth.users)
create table profiles (
  id uuid references auth.users primary key,
  role text default 'player', -- player, parent, coach
  player_name text,
  age_group text,
  sport text default 'baseball',
  level text,
  onboarding_completed boolean default false,
  referral_code text unique default substr(md5(random()::text), 1, 8),
  referred_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Token balances
create table token_balances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) unique,
  balance integer default 10,
  last_refill_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Token transactions
create table token_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  amount integer, -- negative for spend, positive for earn
  type text, -- 'analysis', 'referral_reward', 'weekly_refill', 'purchase'
  description text,
  created_at timestamptz default now()
);

-- Swing analyses
create table swing_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  video_url text,
  result_video_url text,
  duration_seconds integer,
  tokens_used integer,
  swing_count integer,
  strengths jsonb,
  improvements jsonb,
  recommended_drills jsonb,
  raw_analysis text,
  status text default 'pending', -- pending, processing, completed, failed
  created_at timestamptz default now()
);

-- Referrals
create table referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid references profiles(id),
  referred_id uuid references profiles(id),
  status text default 'pending', -- pending, completed
  reward_issued boolean default false,
  created_at timestamptz default now()
);

-- Practice logs
create table practice_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  drill_id text,
  drill_name text,
  reps integer,
  notes text,
  created_at timestamptz default now()
);

-- Subscriptions
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text default 'free', -- free, premium
  status text default 'active',
  current_period_end timestamptz,
  created_at timestamptz default now()
);

-- Row Level Security Policies

-- Enable RLS
alter table profiles enable row level security;
alter table token_balances enable row level security;
alter table token_transactions enable row level security;
alter table swing_analyses enable row level security;
alter table referrals enable row level security;
alter table practice_logs enable row level security;
alter table subscriptions enable row level security;

-- Profiles: users can read/update their own profile
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on profiles
  for insert with check (auth.uid() = id);

-- Token balances
create policy "Users can view own token balance" on token_balances
  for select using (auth.uid() = user_id);

-- Token transactions
create policy "Users can view own transactions" on token_transactions
  for select using (auth.uid() = user_id);

-- Swing analyses
create policy "Users can view own analyses" on swing_analyses
  for select using (auth.uid() = user_id);

create policy "Users can insert own analyses" on swing_analyses
  for insert with check (auth.uid() = user_id);

-- Practice logs
create policy "Users can manage own practice logs" on practice_logs
  for all using (auth.uid() = user_id);

-- Subscriptions
create policy "Users can view own subscription" on subscriptions
  for select using (auth.uid() = user_id);

-- Referrals (users can see referrals where they are the referrer)
create policy "Users can view own referrals" on referrals
  for select using (auth.uid() = referrer_id);

-- Function to auto-create profile + token balance on signup
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;

  insert into public.token_balances (user_id, balance)
  values (new.id, 10)
  on conflict (user_id) do nothing;

  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'active')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Trigger on auth.users insert
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
