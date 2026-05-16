'use server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function approveItem(formData: FormData): Promise<void> {
  const itemId = formData.get('itemId') as string
  if (!itemId) redirect('/parent/approval?error=no-id')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify item belongs to this parent's child
  const { data: item } = await supabase.from('items')
    .select('id, seller_child_id').eq('id', itemId).single()
  if (!item) redirect('/parent/approval?error=not-found')

  const { data: child } = await supabase.from('children')
    .select('id').eq('id', item.seller_child_id).eq('parent_id', user.id).single()
  if (!child) redirect('/parent/approval?error=no-permission')

  const admin = getAdminClient()
  await admin.from('items')
    .update({ status: 'active', approved_at: new Date().toISOString() })
    .eq('id', itemId)

  revalidatePath('/parent/approval')
  revalidatePath('/parent/dashboard')
  revalidatePath('/child/home')
}

export async function rejectItem(formData: FormData): Promise<void> {
  const itemId = formData.get('itemId') as string
  if (!itemId) redirect('/parent/approval?error=no-id')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: item } = await supabase.from('items')
    .select('id, seller_child_id').eq('id', itemId).single()
  if (!item) redirect('/parent/approval?error=not-found')

  const { data: child } = await supabase.from('children')
    .select('id').eq('id', item.seller_child_id).eq('parent_id', user.id).single()
  if (!child) redirect('/parent/approval?error=no-permission')

  const admin = getAdminClient()
  await admin.from('items')
    .update({ status: 'rejected' }).eq('id', itemId)

  revalidatePath('/parent/approval')
  revalidatePath('/parent/dashboard')
}
