import { calcBadgeLevel, SELLER_REWARD, BUYER_REWARD } from './seed-points'

describe('Seed Points', () => {
  it('판매자는 20점, 구매자는 10점을 받는다', () => {
    expect(SELLER_REWARD).toBe(20)
    expect(BUYER_REWARD).toBe(10)
  })

  it('0~29점: 새싹(sprout)', () => {
    expect(calcBadgeLevel(0)).toBe('sprout')
    expect(calcBadgeLevel(29)).toBe('sprout')
  })

  it('30~99점: 열매(fruit)', () => {
    expect(calcBadgeLevel(30)).toBe('fruit')
    expect(calcBadgeLevel(99)).toBe('fruit')
  })

  it('100~299점: 나무(tree)', () => {
    expect(calcBadgeLevel(100)).toBe('tree')
    expect(calcBadgeLevel(299)).toBe('tree')
  })

  it('300점 이상: 숲(forest)', () => {
    expect(calcBadgeLevel(300)).toBe('forest')
    expect(calcBadgeLevel(999)).toBe('forest')
  })
})
