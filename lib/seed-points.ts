export const SELLER_REWARD = 20
export const BUYER_REWARD = 10

export type BadgeLevel = 'sprout' | 'fruit' | 'tree' | 'forest'

export function calcBadgeLevel(points: number): BadgeLevel {
  if (points >= 300) return 'forest'
  if (points >= 100) return 'tree'
  if (points >= 30) return 'fruit'
  return 'sprout'
}
