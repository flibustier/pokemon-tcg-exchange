import type { Card } from './services/cards'

export interface Proposal {
  icon?: string
  pseudo?: string
  language?: string
  friend_id: string
  card_wanted: string
  card_to_give: string
  other_user_date: string
  card1: Card
  card2: Card
}

export interface Discussion {
  pseudo: string
  avatar: string
  language: string
  friend_id: string
  last_message: string
  last_message_date: string
  read: boolean
}

export interface Message {
  from: string
  to: string
  message: string
  sent: string
  read: string | null
}
