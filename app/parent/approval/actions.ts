'use server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function approveItem(formData: FormData) {
  const itemId = formData.get('itemId') as string
  if (!itemId) return { error: '상품 ID 없음' }

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

  // Use admin client to bypass RLS for status update
  const admin = getAdminClient()
  const { error } = await admin.from('items')
    .update({ status: 'active', approved_at: new Date().toISOString() })
    .eq('id', itemId)

  if (error) return { error: '승인 실패: ' + error.message }

  revalidatePath('/parent/approval')
  revalidatePath('/parent/dashboard')
  revalidatePath('/child/home')
  return { success: true }
}

export async function rejectItem(formData: FormData) {
  const itemId = formData.get('itemId') as string
  if (!itemId) return { error: '상품 ID 없음' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인 필요' }

  const { data: item } = await supabase.from('items')
    .select('id, seller_child_id').eq('id', itemId).single()
  if (!item) return { error: '상품을 찾을 수 없습니다' }

  const { data: child } = await supabase.from('children')
    .select('id').eq('id', item.seller_child_id).eq('parent_id', user.id).single()
  if (!child) return { error: '권한 없음' }

  const admin = getAdminClient()
  const { error } = await admin.from('items')
    .update({ status: 'rejected' }).eq('id', itemId)

  if (error) return { error: '거부 실패: ' + error.message }

  revalidatePath('/parent/approval')
  revalidatePath('/parent/dashboard')
  return { success: true }
}
