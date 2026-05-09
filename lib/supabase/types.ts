export type ItemCategory = 'toy' | 'book' | 'stationery' | 'sports' | 'clothing' | 'other'
export type ItemStatus = 'draft' | 'pending' | 'active' | 'reserved' | 'sold' | 'rejected'
export type BadgeLevel = 'sprout' | 'fruit' | 'tree' | 'forest'

export interface ParentProfile {
  id: string
  name: string
  phone: string | null
  created_at: string
}

export interface Child {
  id: string
  parent_id: string
  nickname: string
  avatar: string
  school_name: string | null
  grade: number | null
  district: string | null
  lat: number | null
  lng: number | null
  seed_points: number
  badge_level: BadgeLevel
  created_at: string
}

export interface Item {
  id: string
  seller_child_id: string
  title: string
  description: string | null
  price: number
  category: ItemCategory
  status: ItemStatus
  condition: string
  school_name: string | null
  district: string | null
  lat: number | null
  lng: number | null
  ai_suggested_min: number | null
  ai_suggested_max: number | null
  created_at: string
  approved_at: string | null
  sold_at: string | null
}

export interface ItemImage {
  id: string
  item_id: string
  storage_path: string
  display_order: number
}

export interface SafeLocation {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  type: string
  district: string | null
}

export interface ChatRoom {
  id: string
  item_id: string
  buyer_child_id: string
  seller_child_id: string
  trade_status: string
  created_at: string
}

export interface Message {
  id: string
  room_id: string
  sender_child_id: string
  content: string
  msg_type: string
  is_flagged: boolean
  created_at: string
}

export interface Trade {
  id: string
  item_id: string
  seller_child_id: string
  buyer_child_id: string
  final_price: number
  safe_location_id: string | null
  completed_at: string
  seller_seed_earned: number
  buyer_seed_earned: number
}
