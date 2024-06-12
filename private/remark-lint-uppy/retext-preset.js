import remarkRetext from 'remark-retext'
import { unified } from 'unified'
import retextEnglish from 'retext-english'
// eslint-disable-next-line import/no-unresolved
import retextEquality from 'retext-equality'
// eslint-disable-next-line import/no-unresolved
import retextProfanities from 'retext-profanities'
import retextQuotes from 'retext-quotes'
import retextSyntaxMentions from 'retext-syntax-mentions'

export default [
  remarkRetext,
  unified()
    .use(retextEnglish)
    .use(retextEquality, {
      ignore: [
        'disabled',
        'host',
        'hosts',
        'invalid',
        'whitespace',
        'of course',
      ],
    })
    .use(retextProfanities, { sureness: 1 })
    .use(retextQuotes)
    .use(retextSyntaxMentions),
]
