import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { SELLER_REWARD, BUYER_REWARD, calcBadgeLevel } from '@/lib/seed-points'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const { id: itemId } = await params
  const { buyerChildId, safeLocationId } = await req.json()

  // Verify item exists and belongs to this parent's child
  const { data: item } = await supabase.from('items')
    .select('seller_child_id, price, status').eq('id', itemId).single()

  if (!item) return NextResponse.json({ error: '상품 없음' }, { status: 404 })
  if (item.status !== 'active' && item.status !== 'reserved')
    return NextResponse.json({ error: '거래할 수 없는 상태입니다' }, { status: 400 })

  // Verify caller is seller's parent
  const { data: sellerChild } = await supabase.from('children')
    .select('id, seed_points').eq('id', item.seller_child_id).eq('parent_id', user.id).single()
  if (!sellerChild) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  // Get buyer child
  const { data: buyerChild } = await supabase.from('children')
    .select('id, seed_points').eq('id', buyerChildId).single()
  if (!buyerChild) return NextResponse.json({ error: '구매자 없음' }, { status: 404 })

  // Create trade record
  const { error: tradeError } = await supabase.from('trades').insert({
    item_id: itemId,
    seller_child_id: item.seller_child_id,
    buyer_child_id: buyerChildId,
    final_price: item.price,
    safe_location_id: safeLocationId ?? null,
    seller_seed_earned: SELLER_REWARD,
    buyer_seed_earned: BUYER_REWARD,
  })

  if (tradeError) return NextResponse.json({ error: tradeError.message }, { status: 500 })

  // Mark item as sold
  await supabase.from('items')
    .update({ status: 'sold', sold_at: new Date().toISOString() })
    .eq('id', itemId)

  // Update seller seed points + badge
  const newSellerPoints = (sellerChild.seed_points ?? 0) + SELLER_REWARD
  await supabase.from('children').update({
    seed_points: newSellerPoints,
    badge_level: calcBadgeLevel(newSellerPoints),
  }).eq('id', item.seller_child_id)

  // Update buyer seed points + badge
  const newBuyerPoints = (buyerChild.seed_points ?? 0) + BUYER_REWARD
  await supabase.from('children').update({
    seed_points: newBuyerPoints,
    badge_level: calcBadgeLevel(newBuyerPoints),
  }).eq('id', buyerChildId)

  return NextResponse.json({ success: true, sellerPoints: newSellerPoints, buyerPoints: newBuyerPoints })
}
