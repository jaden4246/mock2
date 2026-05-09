'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createChild(prevState: { error?: string } | null, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다' }

  const nickname = formData.get('nickname') as string
  const avatar = formData.get('avatar') as string
  const schoolName = formData.get('school_name') as string
  const grade = Number(formData.get('grade'))
  const district = formData.get('district') as string

  // Validate grade
  if (grade < 1 || grade > 6) return { error: '학년은 1~6학년만 가능합니다' }
  // Validate nickname
  if (!nickname || nickname.trim().length < 2) return { error: '닉네임을 2자 이상 입력해주세요' }

  const { error } = await supabase.from('children').insert({
    parent_id: user.id,
    nickname: nickname.trim(),
    avatar: avatar || 'lion',
    school_name: schoolName?.trim() || null,
    grade: grade || null,
    district: district?.trim() || null,
  })

  if (error) return { error: '자녀 계정 생성 실패: ' + error.message }
  redirect('/parent/dashboard')
}
