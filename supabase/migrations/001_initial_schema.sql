-- 보호자 프로필 (Supabase Auth users 테이블 확장)
create table public.parent_profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  phone text,
  created_at timestamptz default now()
);

-- 자녀 계정 (보호자에 종속)
create table public.children (
  id uuid default gen_random_uuid() primary key,
  parent_id uuid references public.parent_profiles(id) on delete cascade not null,
  nickname text not null,
  avatar text default 'lion',
  school_name text,
  grade smallint check (grade between 1 and 6),
  district text,
  lat numeric(9,6),
  lng numeric(9,6),
  seed_points integer default 0,
  badge_level text default 'sprout' check (badge_level in ('sprout', 'fruit', 'tree', 'forest')),
  created_at timestamptz default now()
);

-- 상품 카테고리
create type item_category as enum (
  'toy', 'book', 'stationery', 'sports', 'clothing', 'other'
);

-- 상품 상태
create type item_status as enum (
  'draft', 'pending', 'active', 'reserved', 'sold', 'rejected'
);

-- 상품
create table public.items (
  id uuid default gen_random_uuid() primary key,
  seller_child_id uuid references public.children(id) on delete cascade not null,
  title text not null,
  description text,
  price integer not null check (price >= 0 and price <= 100000),
  category item_category not null,
  status item_status default 'draft',
  condition text default 'good',
  school_name text,
  district text,
  lat numeric(9,6),
  lng numeric(9,6),
  ai_suggested_min integer,
  ai_suggested_max integer,
  created_at timestamptz default now(),
  approved_at timestamptz,
  sold_at timestamptz
);

-- 상품 이미지
create table public.item_images (
  id uuid default gen_random_uuid() primary key,
  item_id uuid references public.items(id) on delete cascade not null,
  storage_path text not null,
  display_order smallint default 0
);

-- 안전 거래 장소
create table public.safe_locations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  address text not null,
  lat numeric(9,6) not null,
  lng numeric(9,6) not null,
  type text default 'school',
  district text
);

-- 채팅방
create table public.chat_rooms (
  id uuid default gen_random_uuid() primary key,
  item_id uuid references public.items(id) on delete cascade not null,
  buyer_child_id uuid references public.children(id) not null,
  seller_child_id uuid references public.children(id) not null,
  trade_status text default 'chatting',
  created_at timestamptz default now()
);

-- 채팅 메시지
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references public.chat_rooms(id) on delete cascade not null,
  sender_child_id uuid references public.children(id) not null,
  content text not null,
  msg_type text default 'text',
  is_flagged boolean default false,
  created_at timestamptz default now()
);

-- 거래 완료 내역
create table public.trades (
  id uuid default gen_random_uuid() primary key,
  item_id uuid references public.items(id) not null,
  seller_child_id uuid references public.children(id) not null,
  buyer_child_id uuid references public.children(id) not null,
  final_price integer not null,
  safe_location_id uuid references public.safe_locations(id),
  completed_at timestamptz default now(),
  seller_seed_earned integer default 20,
  buyer_seed_earned integer default 10
);
