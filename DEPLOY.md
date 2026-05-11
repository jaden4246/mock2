# 아이마켓 MVP 배포 가이드

## 1. Supabase 프로젝트 설정

1. [supabase.com](https://supabase.com) 에서 새 프로젝트 생성
2. Project Settings → API 에서 키 복사
3. SQL Editor 에서 마이그레이션 순서대로 실행:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
4. Storage → Create bucket: `item-images` (Public: false, RLS 적용됨)
5. Authentication → URL Configuration:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/**`

## 2. Vercel 배포

```bash
# Vercel CLI 설치
npm install -g vercel

# 로그인
vercel login

# 환경변수 설정
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production

# 첫 배포
vercel --prod
```

## 3. 배포 후 E2E 테스트

1. 보호자 회원가입 → 자녀 계정 추가
2. 물건 등록 (아이) → 보호자 승인 확인
3. 다른 계정으로 채팅 시작 → PII 차단 확인 (010-xxxx-xxxx 입력)
4. 거래 완료 → 씨앗 포인트 적립 확인

## 환경변수

| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role 키 (서버 전용) |
