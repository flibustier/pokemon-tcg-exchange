import { h, type FunctionalComponent, type VNodeChild } from 'vue'

import { t, type MessageKey } from '@/services/i18n'

// A text with tags: <strong>, <b> and <br/> are HTML, any other one is a slot, which gets what the
// tag holds.
//
//   "login.noAccount": "No account yet? <link>Create one</link>"
//
//   <RichText text="login.noAccount">
//     <template #link="{ text }"><a href="…">{{ text }}</a></template>
//   </RichText>

const TAG = /<(\w+)(?:\/>|>(.*?)<\/\1>)/g
const HTML = ['strong', 'b', 'br']

const RichText: FunctionalComponent<
  { text: MessageKey },
  Record<string, never>,
  { [tag: string]: { text: string } }
> = ({ text: key }, { slots }) => {
  const text = t(key)
  const parts: VNodeChild[] = []
  let end = 0
  for (const match of text.matchAll(TAG)) {
    const [whole, tag, inside = ''] = match
    parts.push(text.slice(end, match.index))
    parts.push(HTML.includes(tag) ? h(tag, inside || undefined) : slots[tag]?.({ text: inside }))
    end = match.index + whole.length
  }
  parts.push(text.slice(end))
  return parts
}
RichText.props = ['text']

export default RichText
