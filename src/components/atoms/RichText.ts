import { h, type FunctionalComponent } from 'vue'

import { t, type MessageKey } from '@/services/i18n'
import { HTML_TAGS, parseTags } from '@/services/texts'

// A text with tags. Those that are not HTML are slots, which get what the tag holds.
//
//   "login.noAccount": "No account yet? <link>Create one</link>"
//
//   <RichText text="login.noAccount">
//     <template #link="{ text }"><a href="…">{{ text }}</a></template>
//   </RichText>
const RichText: FunctionalComponent<
  { text: MessageKey },
  Record<string, never>,
  { [tag: string]: { text: string } }
> = ({ text: key }, { slots }) =>
  parseTags(t(key)).map((part) => {
    if (typeof part === 'string') return part
    const { tag, text } = part
    return HTML_TAGS.includes(tag) ? h(tag, text || undefined) : slots[tag]?.({ text })
  })
RichText.props = ['text']

export default RichText
