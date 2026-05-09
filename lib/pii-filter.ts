const PII_PATTERNS = [
  /01[016789]-?\d{3,4}-?\d{4}/g,
  /\d{2,3}-\d{3,4}-\d{4}/g,
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  /카카오톡\s?아이디\s?[:：]?\s?\S+/g,
]

const MASK = '📵[개인정보 차단]📵'

export function filterPII(text: string): string {
  let filtered = text
  for (const pattern of PII_PATTERNS) {
    filtered = filtered.replace(pattern, MASK)
  }
  return filtered
}

export function hasPII(text: string): boolean {
  return PII_PATTERNS.some(p => {
    const clone = new RegExp(p.source, p.flags)
    return clone.test(text)
  })
}
