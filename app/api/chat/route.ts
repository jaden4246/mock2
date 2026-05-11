import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { filterPII, hasPII } from '@/lib/pii-filter'

// POST /api/chat — create or get existing chat room for an item
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { itemId } = await req.json()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const { data: buyerChild } = await supabase
    .from('children').select('id').eq('parent_id', user.id).single()
  if (!buyerChild) return NextResponse.json({ error: '자녀 계정 필요' }, { status: 400 })

  const { data: item } = await supabase
    .from('items').select('seller_child_id').eq('id', itemId).eq('status', 'active').single()
  if (!item) return NextResponse.json({ error: '상품 없음' }, { status: 404 })

  // Cannot buy your own item
  if (item.seller_child_id === buyerChild.id)
    return NextResponse.json({ error: '자신의 물건은 구매할 수 없습니다' }, { status: 400 })

  // Return existing room if any
  const { data: existing } = await supabase.from('chat_rooms')
    .select('id').eq('item_id', itemId).eq('buyer_child_id', buyerChild.id).single()
  if (existing) return NextResponse.json({ roomId: existing.id })

  const { data: room, error } = await supabase.from('chat_rooms').insert({
    item_id: itemId,
    buyer_child_id: buyerChild.id,
    seller_child_id: item.seller_child_id,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ roomId: room.id })
}

// PUT /api/chat — send a message
export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { roomId, content, msgType = 'text' } = await req.json()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const { data: child } = await supabase
    .from('children').select('id').eq('parent_id', user.id).single()
  if (!child) return NextResponse.json({ error: '자녀 계정 필요' }, { status: 400 })

  const filtered = filterPII(content)
  const flagged = hasPII(content)

  const { data, error } = await supabase.from('messages').insert({
    room_id: roomId,
    sender_child_id: child.id,
    content: filtered,
    msg_type: msgType,
    is_flagged: flagged,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: data })
}
