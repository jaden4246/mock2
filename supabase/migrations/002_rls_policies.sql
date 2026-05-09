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

-- UPDATE policy for items (approve/reject/sell)
create policy "items_update" on public.items
  for update using (
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

-- 메시지 쓰기: 채팅방 참여자만
create policy "messages_write" on public.messages
  for insert with check (
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

-- 거래 내역: 판매자 또는 구매자 보호자만
create policy "trades_access" on public.trades
  for all using (
    seller_child_id in (select id from public.children where parent_id = auth.uid())
    or buyer_child_id in (select id from public.children where parent_id = auth.uid())
  );
