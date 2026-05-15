# 아이마켓 MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 보호자 이중 승인 구조를 갖춘 아동 전용 C2C 중고거래 플랫폼 MVP를 6개월 파일럿 전에 완성한다.

**Architecture:** Next.js 14 (App Router) 프론트엔드 + Supabase(PostgreSQL, Auth, Realtime, Storage) 백엔드. 서버리스 구조로 초기 인프라 비용을 최소화하고 Vercel에 배포한다. 보호자-자녀 계정은 DB 관계로 연결하며, 모든 아이 액션은 보호자 승인 상태를 거쳐야 공개된다.

**Tech Stack:** Next.js 14 (TypeScript), Supabase (Auth + PostgreSQL + Realtime + Storage), Tailwind CSS, Vercel

---

## 파일 구조

```
aimarket/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx          # 보호자 로그인
│   │   └── signup/page.tsx         # 보호자 회원가입
│   ├── (child)/
│   │   ├── layout.tsx              # 아이 전용 레이아웃 (간소화 UI)
│   │   ├── home/page.tsx           # 상품 목록 (지역 기반)
│   │   ├── item/[id]/page.tsx      # 상품 상세
│   │   ├── sell/page.tsx           # 물건 등록 폼
│   │   └── chat/[id]/page.tsx      # 채팅방
│   ├── (parent)/
│   │   ├── layout.tsx              # 보호자 전용 레이아웃
│   │   ├── dashboard/page.tsx      # 보호자 대시보드
│   │   ├── approval/page.tsx       # 승인 대기 목록
│   │   └── history/page.tsx        # 거래 내역
│   └── api/
│       ├── items/route.ts           # 상품 CRUD API
│       ├── approvals/route.ts       # 승인 처리 API
│       └── chat/route.ts            # 채팅 메시지 API
├── components/
│   ├── child/
│   │   ├── ItemCard.tsx            # 상품 카드
│   │   ├── CategoryFilter.tsx      # 카테고리 필터
│   │   └── ChatBubble.tsx          # 채팅 말풍선
│   ├── parent/
│   │   ├── ApprovalCard.tsx        # 승인 카드
│   │   ├── ActivityFeed.tsx        # 활동 피드
│   │   └── SavingsChart.tsx        # 절약 금액 차트
│   └── shared/
│       ├── PhoneFrame.tsx          # 모바일 레이아웃 프레임
│       └── SeedBadge.tsx           # 씨앗 포인트 배지
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # 클라이언트 Supabase 인스턴스
│   │   ├── server.ts               # 서버 Supabase 인스턴스
│   │   └── types.ts                # DB 타입 정의 (자동 생성)
│   ├── pii-filter.ts               # 개인정보 자동 마스킹
│   ├── seed-points.ts              # 씨앗 포인트 계산
│   └── location.ts                 # 거리 계산 유틸
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       ├── 002_rls_policies.sql
│       └── 003_seed_data.sql
└── middleware.ts                    # Auth 라우트 보호
```

---

## Task 1: 프로젝트 초기 설정

**Files:**
- Create: `package.json`, `tailwind.config.ts`, `.env.local`
- Create: `lib/supabase/client.ts`, `lib/supabase/server.ts`
- Create: `middleware.ts`

- [ ] **Step 1: Next.js 프로젝트 생성**

```bash
npx create-next-app@latest aimarket \
  --typescript --tailwind --eslint \
  --app --src-dir=false --import-alias "@/*"
cd aimarket
```

- [ ] **Step 2: Supabase 클라이언트 패키지 설치**

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install @supabase/auth-helpers-nextjs
```

- [ ] **Step 3: 환경변수 설정**

`.env.local` 파일 생성:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> Supabase 대시보드 → Project Settings → API에서 값 확인

- [ ] **Step 4: 브라우저용 Supabase 클라이언트 생성**

`lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 5: 서버용 Supabase 클라이언트 생성**

`lib/supabase/server.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

- [ ] **Step 6: 라우트 보호 미들웨어 작성**

`middleware.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()

  // 비로그인 상태에서 보호 경로 접근 시 로그인 페이지로
  if (!user && (
    request.nextUrl.pathname.startsWith('/parent') ||
    request.nextUrl.pathname.startsWith('/child')
  )) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

- [ ] **Step 7: 개발 서버 실행 확인**

```bash
npm run dev
# → http://localhost:3000 에서 Next.js 기본 화면 확인
```

- [ ] **Step 8: 커밋**

```bash
git init && git add .
git commit -m "feat: initial Next.js + Supabase setup"
```

---

## Task 2: 데이터베이스 스키마

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`
- Create: `supabase/migrations/002_rls_policies.sql`
- Create: `lib/supabase/types.ts`

- [ ] **Step 1: Supabase CLI 설치 및 초기화**

```bash
npm install -g supabase
supabase init
supabase login
supabase link --project-ref your-project-ref
```

- [ ] **Step 2: 초기 스키마 마이그레이션 작성**

`supabase/migrations/001_initial_schema.sql`:
```sql
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
  avatar text default 'lion',       -- 선택 가능한 캐릭터 슬러그
  school_name text,
  grade smallint,                   -- 1~6학년
  district text,                    -- 동네 (ex: "마포구 합정동")
  lat numeric(9,6),
  lng numeric(9,6),
  seed_points integer default 0,
  badge_level text default 'sprout', -- sprout | fruit | tree | forest
  created_at timestamptz default now()
);

-- 상품 카테고리
create type item_category as enum (
  'toy', 'book', 'stationery', 'sports', 'clothing', 'other'
);

-- 상품 상태
create type item_status as enum (
  'draft',      -- 아이가 등록, 보호자 미승인
  'pending',    -- 보호자 승인 대기
  'active',     -- 승인 후 공개
  'reserved',   -- 거래 진행 중
  'sold',       -- 거래 완료
  'rejected'    -- 보호자 거부
);

-- 상품 (물건 등록)
create table public.items (
  id uuid default gen_random_uuid() primary key,
  seller_child_id uuid references public.children(id) on delete cascade not null,
  title text not null,
  description text,
  price integer not null check (price >= 0 and price <= 100000),
  category item_category not null,
  status item_status default 'draft',
  condition text default 'good',   -- good | fair | poor
  school_name text,
  district text,
  lat numeric(9,6),
  lng numeric(9,6),
  ai_suggested_min integer,        -- AI 추천 가격 하한
  ai_suggested_max integer,        -- AI 추천 가격 상한
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
  type text default 'school',      -- school | library | community_center
  district text
);

-- 채팅방 (상품 1개당 구매자 1명)
create table public.chat_rooms (
  id uuid default gen_random_uuid() primary key,
  item_id uuid references public.items(id) on delete cascade not null,
  buyer_child_id uuid references public.children(id) not null,
  seller_child_id uuid references public.children(id) not null,
  trade_status text default 'chatting',  -- chatting | requested | approved | completed
  created_at timestamptz default now()
);

-- 채팅 메시지
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references public.chat_rooms(id) on delete cascade not null,
  sender_child_id uuid references public.children(id) not null,
  content text not null,
  msg_type text default 'text',    -- text | sticker | system
  is_flagged boolean default false, -- PII 감지 시 true
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
```

- [ ] **Step 3: Row Level Security 정책 작성**

`supabase/migrations/002_rls_policies.sql`:
```sql
-- RLS 활성화
alter table public.parent_profiles enable row level security;
alter table public.children enable row level security;
alter table public.items enable row level security;
alter table public.chat_rooms enable row level security;
alter table public.messages enable row level security;
alter table public.trades enable row level security;

-- 보호자는 자신의 프로필만 읽기/수정
create policy "parent_own_profile" on public.parent_profiles
  for all using (auth.uid() = id);

-- 보호자는 자신의 자녀만 관리
create policy "parent_own_children" on public.children
  for all using (auth.uid() = parent_id);

-- 상품은 공개(active)이거나 본인 자녀 소유인 경우 조회 가능
create policy "items_read" on public.items
  for select using (
    status = 'active'
    or seller_child_id in (
      select id from public.children where parent_id = auth.uid()
    )
  );

-- 상품 등록/수정은 본인 자녀만
create policy "items_write" on public.items
  for insert with check (
    seller_child_id in (
      select id from public.children where parent_id = auth.uid()
    )
  );

-- 채팅방 접근: 구매자 또는 판매자 보호자만
create policy "chat_rooms_access" on public.chat_rooms
  for all using (
    buyer_child_id in (select id from public.children where parent_id = auth.uid())
    or seller_child_id in (select id from public.children where parent_id = auth.uid())
  );

-- 메시지 읽기: 채팅방 참여자만
create policy "messages_read" on public.messages
  for select using (
    room_id in (
      select id from public.chat_rooms where
        buyer_child_id in (select id from public.children where parent_id = auth.uid())
        or seller_child_id in (select id from public.children where parent_id = auth.uid())
    )
  );

-- 안전 장소는 모두 읽기 가능
alter table public.safe_locations enable row level security;
create policy "safe_locations_public" on public.safe_locations
  for select using (true);
```

- [ ] **Step 4: 마이그레이션 실행**

```bash
supabase db push
# → 성공 메시지 확인 (error 없음)
```

- [ ] **Step 5: TypeScript 타입 자동 생성**

```bash
supabase gen types typescript --project-id your-project-ref \
  > lib/supabase/types.ts
```

- [ ] **Step 6: 커밋**

```bash
git add supabase/ lib/supabase/types.ts
git commit -m "feat: database schema and RLS policies"
```

---

## Task 3: 보호자 인증 (회원가입 / 로그인)

**Files:**
- Create: `app/(auth)/signup/page.tsx`
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/signup/actions.ts`
- Create: `app/(auth)/login/actions.ts`

- [ ] **Step 1: 회원가입 Server Action 작성**

`app/(auth)/signup/actions.ts`:
```typescript
'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signUp(formData: FormData) {
  const supabase = createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string

  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error || !data.user) return { error: error?.message ?? '회원가입 실패' }

  // parent_profiles 테이블에 프로필 생성
  const { error: profileError } = await supabase
    .from('parent_profiles')
    .insert({ id: data.user.id, name })

  if (profileError) return { error: '프로필 생성 실패' }

  redirect('/parent/dashboard')
}
```

- [ ] **Step 2: 회원가입 페이지 UI 작성**

`app/(auth)/signup/page.tsx`:
```typescript
'use client'
import { signUp } from './actions'
import { useFormState } from 'react-dom'

export default function SignupPage() {
  const [state, action] = useFormState(signUp, null)
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-black text-blue-900 mb-2">아이마켓 보호자 가입</h1>
        <p className="text-gray-500 text-sm mb-6">자녀 계정은 가입 후 추가할 수 있어요</p>
        {state?.error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-red-700 text-sm">
            {state.error}
          </div>
        )}
        <form action={action} className="flex flex-col gap-4">
          <input name="name" type="text" placeholder="보호자 이름"
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm" required />
          <input name="email" type="email" placeholder="이메일"
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm" required />
          <input name="password" type="password" placeholder="비밀번호 (8자 이상)"
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm"
            minLength={8} required />
          <button type="submit"
            className="bg-blue-600 text-white rounded-xl py-3 font-bold text-sm hover:bg-blue-700">
            가입하기
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          이미 계정이 있나요? <a href="/login" className="text-blue-600 font-bold">로그인</a>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 로그인 Server Action 작성**

`app/(auth)/login/actions.ts`:
```typescript
'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) return { error: '이메일 또는 비밀번호를 확인하세요' }
  redirect('/parent/dashboard')
}
```

- [ ] **Step 4: 로그인 페이지 UI 작성**

`app/(auth)/login/page.tsx`:
```typescript
'use client'
import { login } from './actions'
import { useFormState } from 'react-dom'

export default function LoginPage() {
  const [state, action] = useFormState(login, null)
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-xl">🌱</div>
          <h1 className="text-2xl font-black text-blue-900">아이마켓</h1>
        </div>
        {state?.error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-red-700 text-sm">
            {state.error}
          </div>
        )}
        <form action={action} className="flex flex-col gap-4">
          <input name="email" type="email" placeholder="이메일"
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm" required />
          <input name="password" type="password" placeholder="비밀번호"
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm" required />
          <button type="submit"
            className="bg-blue-600 text-white rounded-xl py-3 font-bold text-sm hover:bg-blue-700">
            로그인
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          처음이신가요? <a href="/signup" className="text-blue-600 font-bold">보호자 가입</a>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: 수동 테스트**

```bash
npm run dev
# 1. http://localhost:3000/signup 에서 보호자 계정 생성
# 2. Supabase 대시보드 → Table Editor → parent_profiles 에 행 확인
# 3. http://localhost:3000/login 에서 로그인 → /parent/dashboard 리다이렉트 확인
```

- [ ] **Step 6: 커밋**

```bash
git add app/(auth)/
git commit -m "feat: parent auth (signup, login)"
```

---

## Task 4: 자녀 계정 생성 및 연동

**Files:**
- Create: `app/(parent)/children/new/page.tsx`
- Create: `app/(parent)/children/new/actions.ts`

- [ ] **Step 1: 자녀 계정 생성 Server Action**

`app/(parent)/children/new/actions.ts`:
```typescript
'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createChild(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다' }

  const nickname = formData.get('nickname') as string
  const avatar = formData.get('avatar') as string
  const schoolName = formData.get('school_name') as string
  const grade = Number(formData.get('grade'))
  const district = formData.get('district') as string

  const { error } = await supabase.from('children').insert({
    parent_id: user.id,
    nickname,
    avatar,
    school_name: schoolName,
    grade,
    district,
  })

  if (error) return { error: '자녀 계정 생성 실패: ' + error.message }
  redirect('/parent/dashboard')
}
```

- [ ] **Step 2: 자녀 추가 페이지 UI**

`app/(parent)/children/new/page.tsx`:
```typescript
'use client'
import { createChild } from './actions'
import { useFormState } from 'react-dom'

const AVATARS = ['lion', 'bear', 'rabbit', 'fox', 'panda', 'tiger']
const AVATAR_EMOJI: Record<string, string> = {
  lion: '🦁', bear: '🐻', rabbit: '🐰', fox: '🦊', panda: '🐼', tiger: '🐯'
}

export default function NewChildPage() {
  const [state, action] = useFormState(createChild, null)
  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-xl font-black text-blue-900 mb-6">자녀 계정 추가</h1>
        {state?.error && (
          <div className="bg-red-50 rounded-xl p-3 mb-4 text-red-700 text-sm">{state.error}</div>
        )}
        <form action={action} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-gray-500 mb-2 block">캐릭터 선택</label>
            <div className="grid grid-cols-6 gap-2">
              {AVATARS.map((a) => (
                <label key={a} className="cursor-pointer">
                  <input type="radio" name="avatar" value={a} className="sr-only" defaultChecked={a === 'lion'} />
                  <div className="text-2xl text-center p-2 rounded-xl border-2 border-transparent hover:border-blue-400 has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50">
                    {AVATAR_EMOJI[a]}
                  </div>
                </label>
              ))}
            </div>
          </div>
          <input name="nickname" placeholder="닉네임 (예: 사자왕)"
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm" required />
          <input name="school_name" placeholder="학교 이름 (예: 한강초등학교)"
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm" />
          <select name="grade" className="border border-gray-200 rounded-xl px-4 py-3 text-sm">
            {[1,2,3,4,5,6].map(g => <option key={g} value={g}>{g}학년</option>)}
          </select>
          <input name="district" placeholder="동네 (예: 마포구 합정동)"
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm" />
          <button type="submit"
            className="bg-blue-600 text-white rounded-xl py-3 font-bold text-sm">
            자녀 추가하기
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 수동 테스트**

```bash
# 로그인 후 http://localhost:3000/parent/children/new
# 닉네임, 학교, 학년 입력 후 제출
# Supabase Table Editor → children 에 parent_id 연결 확인
```

- [ ] **Step 4: 커밋**

```bash
git add app/(parent)/children/
git commit -m "feat: child account creation with parent link"
```

---

## Task 5: PII 필터 유틸

**Files:**
- Create: `lib/pii-filter.ts`
- Create: `lib/pii-filter.test.ts`

한국 전화번호, 이메일, 주소 패턴을 감지해 채팅 메시지에서 마스킹한다.

- [ ] **Step 1: 테스트 먼저 작성**

`lib/pii-filter.test.ts`:
```typescript
import { filterPII, hasPII } from './pii-filter'

describe('PII Filter', () => {
  it('전화번호를 마스킹한다', () => {
    expect(filterPII('010-1234-5678로 연락해')).toBe('📵[개인정보 차단]📵로 연락해')
    expect(filterPII('01012345678 알려줘')).toBe('📵[개인정보 차단]📵 알려줘')
  })

  it('이메일을 마스킹한다', () => {
    expect(filterPII('abc@naver.com 써줘')).toBe('📵[개인정보 차단]📵 써줘')
  })

  it('PII 없는 메시지는 그대로 반환한다', () => {
    expect(filterPII('레고 아직 있나요?')).toBe('레고 아직 있나요?')
  })

  it('hasPII는 PII 존재 여부 boolean 반환', () => {
    expect(hasPII('010-1234-5678')).toBe(true)
    expect(hasPII('괜찮아요!')).toBe(false)
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npx jest lib/pii-filter.test.ts
# Expected: FAIL (모듈 없음)
```

- [ ] **Step 3: PII 필터 구현**

`lib/pii-filter.ts`:
```typescript
const PII_PATTERNS = [
  /01[016789]-?\d{3,4}-?\d{4}/g,          // 한국 휴대전화
  /\d{2,3}-\d{3,4}-\d{4}/g,               // 일반 전화
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, // 이메일
  /카카오톡\s?아이디\s?[:：]?\s?\S+/g,    // 카카오 아이디 언급
]

const MASK = '📵[개인정보 차단]📵'

export function filterPII(text: string): string {
  let filtered = text
  for (const pattern of PII_PATTERNS) {
    filtered = filtered.replace(pattern, MASK)
  }
  return filtered
}

export function hasPII(text: string): boolean {
  return PII_PATTERNS.some(p => {
    p.lastIndex = 0
    return p.test(text)
  })
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx jest lib/pii-filter.test.ts
# Expected: PASS (3/3)
```

- [ ] **Step 5: 커밋**

```bash
git add lib/pii-filter.ts lib/pii-filter.test.ts
git commit -m "feat: PII filter for chat messages (phone, email masking)"
```

---

## Task 6: 물건 등록 (아이 → 보호자 승인 요청)

**Files:**
- Create: `app/(child)/sell/page.tsx`
- Create: `app/(child)/sell/actions.ts`
- Create: `app/api/items/route.ts`

- [ ] **Step 1: 물건 등록 Server Action**

`app/(child)/sell/actions.ts`:
```typescript
'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createItem(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인 필요' }

  // 로그인한 보호자의 첫 번째 자녀를 판매자로 사용 (MVP: 자녀 선택 기능 생략)
  const { data: child } = await supabase
    .from('children').select('id, school_name, district')
    .eq('parent_id', user.id).single()
  if (!child) return { error: '자녀 계정을 먼저 추가해주세요' }

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const price = Number(formData.get('price'))
  const category = formData.get('category') as string

  // 이미지 업로드
  const image = formData.get('image') as File
  let storagePath = ''
  if (image && image.size > 0) {
    const ext = image.name.split('.').pop()
    const path = `items/${child.id}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('item-images').upload(path, image)
    if (!uploadError) storagePath = path
  }

  // 상품 생성 (status: 'pending' — 보호자 승인 대기)
  const { data: item, error } = await supabase.from('items').insert({
    seller_child_id: child.id,
    title, description, price,
    category: category as any,
    status: 'pending',
    school_name: child.school_name,
    district: child.district,
  }).select().single()

  if (error || !item) return { error: '등록 실패: ' + error?.message }

  if (storagePath) {
    await supabase.from('item_images').insert({
      item_id: item.id, storage_path: storagePath
    })
  }

  redirect('/child/home?registered=true')
}
```

- [ ] **Step 2: 물건 등록 UI (아이 화면)**

`app/(child)/sell/page.tsx`:
```typescript
'use client'
import { createItem } from './actions'
import { useFormState } from 'react-dom'

const CATEGORIES = [
  { value: 'toy', label: '🧸 장난감' },
  { value: 'book', label: '📚 도서' },
  { value: 'stationery', label: '✏️ 문구' },
  { value: 'sports', label: '⚽ 스포츠' },
  { value: 'clothing', label: '👕 의류' },
  { value: 'other', label: '📦 기타' },
]

export default function SellPage() {
  const [state, action] = useFormState(createItem, null)
  return (
    <div className="min-h-screen bg-blue-50 pb-20">
      <div className="bg-blue-700 text-white p-4">
        <h1 className="text-lg font-black">내 물건 팔기</h1>
        <p className="text-sm opacity-75">사진을 찍고 설명을 쓰면 부모님이 확인해요</p>
      </div>
      {state?.error && (
        <div className="mx-4 mt-4 bg-red-50 rounded-xl p-3 text-red-700 text-sm">{state.error}</div>
      )}
      <form action={action} className="flex flex-col gap-4 p-4">
        {/* 사진 업로드 */}
        <label className="block">
          <div className="h-40 bg-white rounded-2xl border-2 border-dashed border-blue-200 flex flex-col items-center justify-content-center gap-2 cursor-pointer hover:border-blue-400">
            <span className="text-3xl">📸</span>
            <span className="text-sm text-gray-400">사진 추가하기</span>
          </div>
          <input type="file" name="image" accept="image/*" className="sr-only" />
        </label>

        <input name="title" placeholder="물건 이름을 써봐요"
          className="bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm" required />

        <textarea name="description" placeholder="물건 설명을 써봐요 (상태, 특징)"
          rows={3} className="bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm resize-none" />

        <div className="bg-white rounded-2xl p-4">
          <label className="text-xs font-bold text-gray-500 block mb-2">카테고리</label>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map(c => (
              <label key={c.value} className="cursor-pointer">
                <input type="radio" name="category" value={c.value} className="sr-only"
                  defaultChecked={c.value === 'toy'} />
                <div className="text-center py-2 px-1 rounded-xl border-2 border-transparent text-sm font-medium
                  has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 hover:bg-gray-50">
                  {c.label}
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 flex items-center gap-3">
          <span className="text-sm font-bold text-gray-600">가격</span>
          <input name="price" type="number" placeholder="0" min="0" max="100000" step="500"
            className="flex-1 text-right text-xl font-black text-blue-800 border-none outline-none" required />
          <span className="font-bold text-gray-600">원</span>
        </div>

        <button type="submit"
          className="bg-blue-600 text-white rounded-2xl py-4 font-black text-base">
          부모님께 등록 요청하기 ✉️
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: 수동 테스트**

```bash
# 로그인 후 http://localhost:3000/child/sell
# 사진 + 제목 + 가격 입력 후 제출
# Supabase → items 테이블에 status='pending' 행 확인
```

- [ ] **Step 4: 커밋**

```bash
git add app/(child)/sell/
git commit -m "feat: child item listing with image upload (pending approval)"
```

---

## Task 7: 보호자 승인 대시보드

**Files:**
- Create: `app/(parent)/dashboard/page.tsx`
- Create: `app/(parent)/approval/page.tsx`
- Create: `app/(parent)/approval/actions.ts`

- [ ] **Step 1: 승인 처리 Server Action**

`app/(parent)/approval/actions.ts`:
```typescript
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function approveItem(itemId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인 필요' }

  // 내 자녀의 물건인지 확인
  const { data: item } = await supabase.from('items')
    .select('*, seller_child_id(parent_id)')
    .eq('id', itemId).single()

  if (!item || (item.seller_child_id as any).parent_id !== user.id)
    return { error: '권한 없음' }

  const { error } = await supabase.from('items')
    .update({ status: 'active', approved_at: new Date().toISOString() })
    .eq('id', itemId)

  if (error) return { error: '승인 실패' }
  revalidatePath('/parent/approval')
  revalidatePath('/parent/dashboard')
  return { success: true }
}

export async function rejectItem(itemId: string) {
  const supabase = createClient()
  const { error } = await supabase.from('items')
    .update({ status: 'rejected' }).eq('id', itemId)
  if (error) return { error: '거부 실패' }
  revalidatePath('/parent/approval')
  return { success: true }
}
```

- [ ] **Step 2: 보호자 대시보드 페이지**

`app/(parent)/dashboard/page.tsx`:
```typescript
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ParentDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: children } = await supabase
    .from('children').select('*').eq('parent_id', user!.id)

  const { data: pendingItems } = await supabase
    .from('items').select('*, item_images(*)')
    .in('seller_child_id', children?.map(c => c.id) ?? [])
    .eq('status', 'pending')

  const { data: recentTrades } = await supabase
    .from('trades').select('*, items(title, price)')
    .in('seller_child_id', children?.map(c => c.id) ?? [])
    .order('completed_at', { ascending: false }).limit(5)

  const child = children?.[0]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-blue-800 text-white p-5">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs opacity-75 mb-1">보호자 대시보드</p>
            <h1 className="text-lg font-black">{child?.nickname ?? '자녀'} 님의 활동</h1>
          </div>
          <div className="flex items-center gap-2">
            {(pendingItems?.length ?? 0) > 0 && (
              <Link href="/parent/approval"
                className="bg-yellow-400 text-yellow-900 rounded-full w-7 h-7 flex items-center justify-center text-xs font-black">
                {pendingItems!.length}
              </Link>
            )}
            <span className="text-xl">🔔</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-blue-700 rounded-xl p-3 text-center">
            <div className="text-lg font-black">{child?.seed_points ?? 0}</div>
            <div className="text-xs opacity-75">씨앗 포인트</div>
          </div>
          <div className="bg-blue-700 rounded-xl p-3 text-center">
            <div className="text-lg font-black">{recentTrades?.length ?? 0}</div>
            <div className="text-xs opacity-75">총 거래</div>
          </div>
          <div className="bg-blue-700 rounded-xl p-3 text-center">
            <div className="text-sm font-black">
              {child?.badge_level === 'sprout' ? '🌱 새싹' :
               child?.badge_level === 'fruit'  ? '🍎 열매' :
               child?.badge_level === 'tree'   ? '🌳 나무' : '🌲 숲'}
            </div>
            <div className="text-xs opacity-75">등급</div>
          </div>
        </div>
      </div>

      {/* 승인 대기 알림 */}
      {(pendingItems?.length ?? 0) > 0 && (
        <Link href="/parent/approval"
          className="mx-4 mt-4 p-4 bg-yellow-50 border border-yellow-300 rounded-2xl flex items-center gap-3 block">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-black text-sm">승인 대기 {pendingItems!.length}건</p>
            <p className="text-xs text-gray-500">탭해서 확인하세요</p>
          </div>
          <span className="ml-auto text-blue-500">→</span>
        </Link>
      )}

      {/* 자녀 없을 경우 추가 안내 */}
      {!child && (
        <div className="mx-4 mt-4 p-6 bg-white rounded-2xl text-center">
          <p className="text-3xl mb-2">👶</p>
          <p className="font-bold mb-3">자녀 계정을 추가해주세요</p>
          <Link href="/parent/children/new"
            className="inline-block bg-blue-600 text-white rounded-xl px-6 py-2 text-sm font-bold">
            자녀 추가하기
          </Link>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: 승인 페이지**

`app/(parent)/approval/page.tsx`:
```typescript
import { createClient } from '@/lib/supabase/server'
import { approveItem, rejectItem } from './actions'

export default async function ApprovalPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: children } = await supabase
    .from('children').select('id').eq('parent_id', user!.id)

  const { data: pendingItems } = await supabase
    .from('items').select('*, item_images(*), children(nickname, avatar)')
    .in('seller_child_id', children?.map(c => c.id) ?? [])
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-4 py-4 flex items-center gap-3">
        <a href="/parent/dashboard" className="text-gray-500">←</a>
        <h1 className="font-black text-lg">등록 승인 요청</h1>
      </div>
      {pendingItems?.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-20 text-gray-400">
          <span className="text-5xl mb-3">✅</span>
          <p className="font-bold">대기 중인 요청이 없어요</p>
        </div>
      ) : (
        <div className="p-4 flex flex-col gap-4">
          {pendingItems?.map(item => (
            <div key={item.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <div className="h-44 bg-blue-50 flex items-center justify-center text-6xl">
                {item.category === 'toy' ? '🧸' : item.category === 'book' ? '📚' :
                 item.category === 'sports' ? '⚽' : item.category === 'clothing' ? '👕' : '📦'}
              </div>
              <div className="p-4">
                <h3 className="font-black text-base mb-1">{item.title}</h3>
                <p className="text-blue-800 font-black text-xl mb-2">
                  {item.price.toLocaleString()}원
                </p>
                {item.ai_suggested_min && (
                  <div className="bg-blue-50 rounded-xl p-2 text-xs text-blue-800 mb-3">
                    🤖 AI 추천 가격: {item.ai_suggested_min.toLocaleString()}~{item.ai_suggested_max?.toLocaleString()}원
                  </div>
                )}
                {item.description && (
                  <p className="text-sm text-gray-500 mb-4">{item.description}</p>
                )}
                <div className="flex gap-3">
                  <form action={async () => { 'use server'; await rejectItem(item.id) }}>
                    <button className="flex-1 border-2 border-red-400 text-red-500 rounded-xl py-3 px-6 font-bold text-sm">
                      ✕ 거부
                    </button>
                  </form>
                  <form action={async () => { 'use server'; await approveItem(item.id) }}
                    className="flex-1">
                    <button className="w-full bg-green-500 text-white rounded-xl py-3 font-black text-sm">
                      ✓ 승인하기
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: 수동 테스트**

```bash
# 1. /child/sell 에서 물건 등록
# 2. /parent/approval 에서 승인 버튼 클릭
# 3. Supabase → items 테이블에 status='active', approved_at 설정 확인
# 4. /child/home 에서 해당 물건 노출 확인
```

- [ ] **Step 5: 커밋**

```bash
git add app/(parent)/
git commit -m "feat: parent approval dashboard and item approval flow"
```

---

## Task 8: 상품 목록 & 지역 기반 탐색 (아이 홈)

**Files:**
- Create: `app/(child)/home/page.tsx`
- Create: `components/child/ItemCard.tsx`
- Create: `lib/location.ts`

- [ ] **Step 1: 거리 계산 유틸 + 테스트**

`lib/location.ts`:
```typescript
// Haversine 공식으로 두 좌표 간 거리(km) 계산
export function distanceKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`
  return `${km.toFixed(1)}km`
}
```

- [ ] **Step 2: ItemCard 컴포넌트**

`components/child/ItemCard.tsx`:
```typescript
import Link from 'next/link'

const CATEGORY_EMOJI: Record<string, string> = {
  toy: '🧸', book: '📚', stationery: '✏️',
  sports: '⚽', clothing: '👕', other: '📦'
}

const CATEGORY_BG: Record<string, string> = {
  toy: 'bg-blue-50', book: 'bg-green-50', stationery: 'bg-yellow-50',
  sports: 'bg-orange-50', clothing: 'bg-purple-50', other: 'bg-gray-50'
}

interface Props {
  item: {
    id: string
    title: string
    price: number
    category: string
    school_name: string | null
    district: string | null
  }
}

export default function ItemCard({ item }: Props) {
  return (
    <Link href={`/child/item/${item.id}`}
      className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm active:scale-95 transition-transform">
      <div className={`h-28 flex items-center justify-center text-5xl ${CATEGORY_BG[item.category] ?? 'bg-gray-50'}`}>
        {CATEGORY_EMOJI[item.category] ?? '📦'}
      </div>
      <div className="p-3">
        <p className="font-bold text-sm truncate">{item.title}</p>
        <p className="font-black text-blue-800 text-base mt-1">
          {item.price.toLocaleString()}원
        </p>
        <p className="text-xs text-gray-400 mt-1">
          🏫 {item.school_name ?? item.district ?? '동네'}
        </p>
      </div>
    </Link>
  )
}
```

- [ ] **Step 3: 아이 홈 페이지 (상품 목록)**

`app/(child)/home/page.tsx`:
```typescript
import { createClient } from '@/lib/supabase/server'
import ItemCard from '@/components/child/ItemCard'

const CATEGORY_LABELS = [
  { value: 'all', label: '전체' },
  { value: 'toy', label: '🧸 장난감' },
  { value: 'book', label: '📚 도서' },
  { value: 'stationery', label: '✏️ 문구' },
  { value: 'sports', label: '⚽ 스포츠' },
  { value: 'clothing', label: '👕 의류' },
]

interface Props {
  searchParams: { category?: string; registered?: string }
}

export default async function ChildHomePage({ searchParams }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 현재 로그인 보호자의 자녀 정보
  const { data: child } = await supabase
    .from('children').select('*').eq('parent_id', user!.id).single()

  // 같은 학교 또는 같은 동네 아이템 조회
  let query = supabase.from('items').select('*').eq('status', 'active')
  if (child?.school_name) {
    query = query.eq('school_name', child.school_name)
  } else if (child?.district) {
    query = query.eq('district', child.district)
  }

  const category = searchParams.category
  if (category && category !== 'all') query = query.eq('category', category)

  const { data: items } = await query
    .order('approved_at', { ascending: false }).limit(20)

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 상단 그리팅 */}
      <div className="bg-gradient-to-b from-blue-700 to-blue-500 text-white px-4 pt-5 pb-6">
        <p className="text-sm opacity-80">안녕하세요, {child?.nickname ?? '친구'}! 👋</p>
        <h1 className="text-lg font-black mt-1">오늘도 좋은 거래 해봐요</h1>
        <div className="mt-2 inline-flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-xs font-bold">
          🌱 씨앗 포인트 {child?.seed_points ?? 0}점
          · {child?.badge_level === 'fruit' ? '🍎 열매' : '🌱 새싹'} 등급
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto">
        {CATEGORY_LABELS.map(c => (
          <a key={c.value}
            href={`/child/home?category=${c.value}`}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-colors ${
              (searchParams.category ?? 'all') === c.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200'
            }`}>
            {c.label}
          </a>
        ))}
      </div>

      {/* 물건 그리드 */}
      {items?.length === 0 ? (
        <div className="flex flex-col items-center mt-20 text-gray-400">
          <span className="text-4xl mb-2">🏡</span>
          <p className="font-bold text-sm">아직 등록된 물건이 없어요</p>
          <a href="/child/sell"
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-bold">
            내 물건 팔기
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4 mt-1">
          {items?.map(item => <ItemCard key={item.id} item={item} />)}
        </div>
      )}

      {/* 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-2 px-4">
        {[
          { icon: '🏠', label: '홈', href: '/child/home' },
          { icon: '🔍', label: '탐색', href: '/child/home' },
          { icon: '📦', label: '내 물건', href: '/child/sell' },
          { icon: '💬', label: '채팅', href: '/child/home' },
        ].map(n => (
          <a key={n.label} href={n.href}
            className="flex flex-col items-center gap-0.5 text-xs text-gray-400">
            <span className="text-xl">{n.icon}</span>{n.label}
          </a>
        ))}
      </nav>
    </div>
  )
}
```

- [ ] **Step 4: 수동 테스트**

```bash
# 1. 물건 등록 → 보호자 승인 → /child/home 에서 카드 노출 확인
# 2. 카테고리 필터 클릭 시 URL 변경 및 결과 필터링 확인
```

- [ ] **Step 5: 커밋**

```bash
git add app/(child)/home/ components/child/ItemCard.tsx lib/location.ts
git commit -m "feat: child home with location-based item feed and category filter"
```

---

## Task 9: 채팅 (실시간 + PII 자동 차단)

**Files:**
- Create: `app/(child)/chat/[id]/page.tsx`
- Create: `app/(child)/item/[id]/page.tsx`
- Create: `app/api/chat/route.ts`

- [ ] **Step 1: 채팅방 생성 API**

`app/api/chat/route.ts`:
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { filterPII, hasPII } from '@/lib/pii-filter'

// POST /api/chat — 채팅방 생성 또는 기존 방 반환
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { itemId } = await req.json()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const { data: buyerChild } = await supabase
    .from('children').select('id').eq('parent_id', user.id).single()
  if (!buyerChild) return NextResponse.json({ error: '자녀 계정 필요' }, { status: 400 })

  const { data: item } = await supabase
    .from('items').select('seller_child_id').eq('id', itemId).single()
  if (!item) return NextResponse.json({ error: '상품 없음' }, { status: 404 })

  // 기존 채팅방 조회
  const { data: existing } = await supabase.from('chat_rooms')
    .select('id').eq('item_id', itemId).eq('buyer_child_id', buyerChild.id).single()
  if (existing) return NextResponse.json({ roomId: existing.id })

  // 새 채팅방 생성
  const { data: room, error } = await supabase.from('chat_rooms').insert({
    item_id: itemId,
    buyer_child_id: buyerChild.id,
    seller_child_id: item.seller_child_id,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ roomId: room.id })
}

// PUT /api/chat — 메시지 전송
export async function PUT(req: NextRequest) {
  const supabase = createClient()
  const { roomId, content, msgType = 'text' } = await req.json()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const { data: child } = await supabase
    .from('children').select('id').eq('parent_id', user.id).single()

  const filtered = filterPII(content)
  const isFlagged = hasPII(content)

  const { data, error } = await supabase.from('messages').insert({
    room_id: roomId,
    sender_child_id: child!.id,
    content: filtered,
    msg_type: msgType,
    is_flagged: isFlagged,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: data })
}
```

- [ ] **Step 2: 채팅 페이지 (실시간)**

`app/(child)/chat/[id]/page.tsx`:
```typescript
'use client'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const STICKERS = ['😊', '👍', '🤔', '🎉', '💰', '🙏', '😅', '❤️']

interface Message {
  id: string; content: string; msg_type: string;
  sender_child_id: string; created_at: string; is_flagged: boolean
}

export default function ChatPage({ params }: { params: { id: string } }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [myChildId, setMyChildId] = useState<string>('')
  const supabase = createClient()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 내 자녀 ID 조회
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('children').select('id')
        .eq('parent_id', user.id).single()
        .then(({ data }) => data && setMyChildId(data.id))
    })

    // 기존 메시지 로드
    supabase.from('messages').select('*')
      .eq('room_id', params.id)
      .order('created_at').then(({ data }) => data && setMessages(data))

    // Realtime 구독
    const channel = supabase.channel(`room-${params.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `room_id=eq.${params.id}`
      }, payload => {
        setMessages(prev => [...prev, payload.new as Message])
      }).subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [params.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(content: string, type = 'text') {
    if (!content.trim()) return
    await fetch('/api/chat', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: params.id, content, msgType: type })
    })
    setInput('')
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <a href="/child/home" className="text-gray-400">←</a>
        <span className="font-black">채팅</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.map(msg => {
          const isMe = msg.sender_child_id === myChildId
          return (
            <div key={msg.id} className={`flex gap-2 max-w-[80%] ${isMe ? 'self-end flex-row-reverse' : ''}`}>
              {!isMe && <div className="w-7 h-7 rounded-full bg-orange-300 flex-shrink-0 flex items-center justify-center text-sm">🦁</div>}
              <div className={`px-3 py-2 rounded-2xl text-sm ${
                isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white text-gray-800 rounded-tl-sm shadow-sm'
              }`}>
                {msg.is_flagged && <span className="text-xs opacity-75 block mb-1">⚠️ 일부 정보가 차단됐어요</span>}
                {msg.msg_type === 'sticker' ? <span className="text-2xl">{msg.content}</span> : msg.content}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="bg-white border-t flex-shrink-0">
        <div className="text-xs text-orange-600 bg-orange-50 px-4 py-2">
          🔒 전화번호·이메일은 자동으로 차단돼요
        </div>
        <div className="flex gap-2 px-4 py-2 overflow-x-auto">
          {STICKERS.map(s => (
            <button key={s} onClick={() => sendMessage(s, 'sticker')}
              className="text-xl flex-shrink-0">{s}</button>
          ))}
        </div>
        <div className="flex gap-2 px-4 py-3 border-t">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
            placeholder="메시지를 입력하세요..."
            className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none" />
          <button onClick={() => sendMessage(input)}
            className="w-9 h-9 bg-blue-600 rounded-full text-white flex items-center justify-center">
            ›
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 수동 테스트**

```bash
# 두 개 브라우저 탭으로 같은 채팅방 열기
# 한쪽에서 메시지 전송 → 다른 쪽에서 실시간 수신 확인
# "010-1234-5678" 입력 → "📵[개인정보 차단]📵" 로 표시 확인
```

- [ ] **Step 4: 커밋**

```bash
git add app/(child)/chat/ app/api/chat/
git commit -m "feat: real-time chat with Supabase Realtime and PII filtering"
```

---

## Task 10: 씨앗 포인트 & 배지 시스템

**Files:**
- Create: `lib/seed-points.ts`
- Create: `lib/seed-points.test.ts`
- Modify: `app/api/items/route.ts` (거래 완료 트리거)

- [ ] **Step 1: 씨앗 포인트 로직 테스트 작성**

`lib/seed-points.test.ts`:
```typescript
import { calcBadgeLevel, SELLER_REWARD, BUYER_REWARD } from './seed-points'

describe('Seed Points', () => {
  it('판매자는 20점, 구매자는 10점', () => {
    expect(SELLER_REWARD).toBe(20)
    expect(BUYER_REWARD).toBe(10)
  })

  it('포인트에 따라 배지 레벨 결정', () => {
    expect(calcBadgeLevel(0)).toBe('sprout')   // 새싹
    expect(calcBadgeLevel(50)).toBe('fruit')   // 열매
    expect(calcBadgeLevel(150)).toBe('tree')   // 나무
    expect(calcBadgeLevel(400)).toBe('forest') // 숲
  })
})
```

- [ ] **Step 2: 씨앗 포인트 구현**

`lib/seed-points.ts`:
```typescript
export const SELLER_REWARD = 20
export const BUYER_REWARD = 10

type BadgeLevel = 'sprout' | 'fruit' | 'tree' | 'forest'

export function calcBadgeLevel(points: number): BadgeLevel {
  if (points >= 300) return 'forest'
  if (points >= 100) return 'tree'
  if (points >= 30)  return 'fruit'
  return 'sprout'
}
```

- [ ] **Step 3: 테스트 통과 확인**

```bash
npx jest lib/seed-points.test.ts
# Expected: PASS (3/3)
```

- [ ] **Step 4: 거래 완료 시 포인트 적립 API**

`app/api/items/[id]/complete/route.ts`:
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { SELLER_REWARD, BUYER_REWARD, calcBadgeLevel } from '@/lib/seed-points'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { buyerChildId, safeLocationId } = await req.json()

  const { data: item } = await supabase.from('items')
    .select('seller_child_id, price').eq('id', params.id).single()
  if (!item) return NextResponse.json({ error: '상품 없음' }, { status: 404 })

  // 거래 기록 생성
  await supabase.from('trades').insert({
    item_id: params.id,
    seller_child_id: item.seller_child_id,
    buyer_child_id: buyerChildId,
    final_price: item.price,
    safe_location_id: safeLocationId,
    seller_seed_earned: SELLER_REWARD,
    buyer_seed_earned: BUYER_REWARD,
  })

  // 상품 상태 업데이트
  await supabase.from('items').update({ status: 'sold', sold_at: new Date().toISOString() })
    .eq('id', params.id)

  // 씨앗 포인트 업데이트 (판매자)
  const { data: seller } = await supabase.from('children')
    .select('seed_points').eq('id', item.seller_child_id).single()
  const newSellerPoints = (seller?.seed_points ?? 0) + SELLER_REWARD
  await supabase.from('children').update({
    seed_points: newSellerPoints,
    badge_level: calcBadgeLevel(newSellerPoints),
  }).eq('id', item.seller_child_id)

  // 씨앗 포인트 업데이트 (구매자)
  const { data: buyer } = await supabase.from('children')
    .select('seed_points').eq('id', buyerChildId).single()
  const newBuyerPoints = (buyer?.seed_points ?? 0) + BUYER_REWARD
  await supabase.from('children').update({
    seed_points: newBuyerPoints,
    badge_level: calcBadgeLevel(newBuyerPoints),
  }).eq('id', buyerChildId)

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 5: 커밋**

```bash
git add lib/seed-points.ts lib/seed-points.test.ts app/api/items/
git commit -m "feat: seed points and badge level system on trade completion"
```

---

## Task 11: Vercel 배포

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: Vercel CLI 설치 및 로그인**

```bash
npm install -g vercel
vercel login
```

- [ ] **Step 2: 환경변수 설정**

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
```

- [ ] **Step 3: 첫 배포**

```bash
vercel --prod
# → https://aimarket.vercel.app (또는 커스텀 도메인) URL 출력
```

- [ ] **Step 4: Supabase Auth Redirect URL 설정**

```
Supabase 대시보드 → Authentication → URL Configuration
Site URL: https://aimarket.vercel.app
Redirect URLs: https://aimarket.vercel.app/**
```

- [ ] **Step 5: 배포 후 E2E 수동 테스트**

```
1. 보호자 회원가입 → 자녀 계정 추가
2. 물건 등록 (아이) → 보호자 승인
3. 다른 계정으로 채팅 → PII 차단 확인
4. 거래 완료 → 씨앗 포인트 적립 확인
```

- [ ] **Step 6: 최종 커밋 및 태그**

```bash
git add .
git commit -m "feat: production deployment on Vercel"
git tag v0.1.0-mvp
git push origin main --tags
```

---

## 자체 검토 (Spec Coverage)

기획서 핵심 요구사항 대비 계획 커버리지:

| 요구사항 | 담당 Task | 상태 |
|----------|-----------|------|
| 보호자 계정 생성 | Task 3 | ✅ |
| 자녀 계정 연동 | Task 4 | ✅ |
| 물건 등록 (아이) + 이미지 | Task 6 | ✅ |
| 보호자 승인/거부 | Task 7 | ✅ |
| 학교·동네 기반 매칭 | Task 8 | ✅ |
| 개인정보 자동 차단 채팅 | Task 5 + 9 | ✅ |
| 스티커 채팅 | Task 9 | ✅ |
| 보호자 대시보드 | Task 7 | ✅ |
| 씨앗 포인트·배지 | Task 10 | ✅ |
| RLS (데이터 보안) | Task 2 | ✅ |
| 배포 | Task 11 | ✅ |
| AI 가격 추천 | — | ⚠️ Phase 2 범위, MVP 제외 |
| 안전 거래 장소 지도 | — | ⚠️ Phase 2, 목록만 DB에 존재 |
| 용돈 계좌 연동 | — | ⚠️ Phase 2 범위 제외 |
