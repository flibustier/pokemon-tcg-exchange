export interface ProposalCard {
  id: string
  rarityCode: string
  set: string
  number: number
  label: Record<string, string>
  imageName: string
}

export interface Proposal {
  icon?: string
  pseudo?: string
  language?: string
  friend_id: string
  card_wanted: string
  card_to_give: string
  card1: ProposalCard
  card2: ProposalCard
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
