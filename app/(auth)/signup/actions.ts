'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signUp(prevState: { error?: string } | null, formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string

  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error || !data.user) return { error: error?.message ?? '회원가입 실패' }

  const { error: profileError } = await supabase
    .from('parent_profiles')
    .insert({ id: data.user.id, name })

  if (profileError) return { error: '프로필 생성 실패' }

  redirect('/parent/dashboard')
}
