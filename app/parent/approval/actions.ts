'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function approveItem(itemId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인 필요' }

  // Verify item belongs to this parent's child
  const { data: item } = await supabase.from('items')
    .select('id, seller_child_id').eq('id', itemId).single()
  if (!item) return { error: '상품을 찾을 수 없습니다' }

  const { data: child } = await supabase.from('children')
    .select('id').eq('id', item.seller_child_id).eq('parent_id', user.id).single()
  if (!child) return { error: '권한 없음' }

  const { error } = await supabase.from('items')
    .update({ status: 'active', approved_at: new Date().toISOString() })
    .eq('id', itemId)

  if (error) return { error: '승인 실패: ' + error.message }
  revalidatePath('/parent/approval')
  revalidatePath('/parent/dashboard')
  return { success: true }
}

export async function rejectItem(itemId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인 필요' }

  const { data: item } = await supabase.from('items')
    .select('id, seller_child_id').eq('id', itemId).single()
  if (!item) return { error: '상품을 찾을 수 없습니다' }

  const { data: child } = await supabase.from('children')
    .select('id').eq('id', item.seller_child_id).eq('parent_id', user.id).single()
  if (!child) return { error: '권한 없음' }

  const { error } = await supabase.from('items')
    .update({ status: 'rejected' }).eq('id', itemId)

  if (error) return { error: '거부 실패' }
  revalidatePath('/parent/approval')
  return { success: true }
}
