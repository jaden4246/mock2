import { filterPII, hasPII } from './pii-filter'

describe('PII Filter', () => {
  it('전화번호를 마스킹한다 (하이픈 포함)', () => {
    expect(filterPII('010-1234-5678로 연락해')).toBe('📵[개인정보 차단]📵로 연락해')
  })

  it('전화번호를 마스킹한다 (하이픈 없음)', () => {
    expect(filterPII('01012345678 알려줘')).toBe('📵[개인정보 차단]📵 알려줘')
  })

  it('이메일을 마스킹한다', () => {
    expect(filterPII('abc@naver.com 써줘')).toBe('📵[개인정보 차단]📵 써줘')
  })

  it('PII 없는 메시지는 그대로 반환한다', () => {
    expect(filterPII('레고 아직 있나요?')).toBe('레고 아직 있나요?')
  })

  it('hasPII는 PII 존재 여부 boolean 반환', () => {
    expect(hasPII('010-1234-5678')).toBe(true)
    expect(hasPII('괜찮아요!')).toBe(false)
  })

  it('이메일 hasPII 감지', () => {
    expect(hasPII('test@gmail.com')).toBe(true)
  })

  it('여러 PII가 있는 경우 모두 마스킹', () => {
    const result = filterPII('010-1234-5678 또는 abc@naver.com')
    expect(result).toBe('📵[개인정보 차단]📵 또는 📵[개인정보 차단]📵')
  })
})
