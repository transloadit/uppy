import remarkRetext from 'remark-retext'
import { unified } from 'unified'
import retextEnglish from 'retext-english'
import retextEquality from 'retext-equality'
import retextProfanities from 'retext-profanities'
import retextQuotes from 'retext-quotes'
import retextSimplify from 'retext-simplify'
import retextSyntaxMentions from 'retext-syntax-mentions'
import retextSyntaxUrls from 'retext-syntax-urls'

export default [
  remarkRetext,
  unified()
    .use(retextEnglish)
    .use(retextEquality, { ignore: ['whitespace'] })
    .use(retextProfanities, { sureness: 1 })
    .use(retextQuotes)
    .use(retextSimplify, {
      ignore: ['address', 'component', 'function', 'interface', 'maintain', 'request', 'type'],
    })
    .use(retextSyntaxMentions)
    .use(retextSyntaxUrls),
]
