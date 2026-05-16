'use server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function createItem(prevState: { error?: string } | null, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인 필요' }

  const { data: child } = await supabase
    .from('children').select('id, school_name, district')
    .eq('parent_id', user.id).single()
  if (!child) return { error: '자녀 계정을 먼저 추가해주세요' }

  const title = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim()
  const price = Number(formData.get('price'))
  const category = formData.get('category') as string

  if (!title || title.length < 2) return { error: '제목을 2자 이상 입력해주세요' }
  if (isNaN(price) || price < 0 || price > 100000) return { error: '가격은 0~100,000원 사이여야 합니다' }

  // Upload image using admin client (bypasses storage RLS)
  const image = formData.get('image') as File
  let storagePath = ''
  if (image && image.size > 0) {
    const ext = image.name.split('.').pop() ?? 'jpg'
    const path = `items/${child.id}/${Date.now()}.${ext}`
    const admin = getAdminClient()
    const { error: uploadError } = await admin.storage
      .from('item-images').upload(path, image, {
        contentType: image.type || 'image/jpeg',
        upsert: false,
      })
    if (uploadError) {
      console.error('Upload error:', uploadError.message)
    } else {
      storagePath = path
    }
  }

  const { data: item, error } = await supabase.from('items').insert({
    seller_child_id: child.id,
    title,
    description: description || null,
    price,
    category: category as any,
    status: 'pending',
    school_name: child.school_name,
    district: child.district,
  }).select().single()

  if (error || !item) return { error: '등록 실패: ' + error?.message }

  if (storagePath) {
    await supabase.from('item_images').insert({
      item_id: item.id,
      storage_path: storagePath,
    })
  }

  redirect('/child/home?registered=true')
}
