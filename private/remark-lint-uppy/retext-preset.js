import remarkRetext from 'remark-retext'
import { unified } from 'unified'
import retextEnglish from 'retext-english'
import retextEquality from 'retext-equality'
import retextPassive from 'retext-passive'
import retextProfanities from 'retext-profanities'
import retextQuotes from 'retext-quotes'
import retextReadability from 'retext-readability'
import retextSimplify from 'retext-simplify'
import retextSyntaxMentions from 'retext-syntax-mentions'
import retextSyntaxUrls from 'retext-syntax-urls'

export default [
  remarkRetext,
  unified()
    .use(retextEnglish)
    .use(retextEquality, { ignore: ['whitespace'] })
    .use(retextPassive)
    .use(retextProfanities, { sureness: 1 })
    .use(retextQuotes)
    .use(retextReadability, { age: 18, minWords: 8 })
    .use(retextSimplify, {
      ignore: ['function', 'interface', 'maintain', 'type'],
    })
    .use(retextSyntaxMentions)
    .use(retextSyntaxUrls),
]
