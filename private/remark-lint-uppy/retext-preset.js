import remarkRetext from 'remark-retext'
import { unified } from 'unified'
import unifiedMessageControl from 'unified-message-control'
import { commentMarker } from 'mdast-comment-marker'
import retextEnglish from 'retext-english'
import retextEquality from 'retext-equality'
import retextProfanities from 'retext-profanities'
import retextQuotes from 'retext-quotes'
import retextSimplify from 'retext-simplify'
import retextSyntaxMentions from 'retext-syntax-mentions'

export default [
  remarkRetext,
  unified()
    .use(unifiedMessageControl, {
      name: 'lint',
      marker: commentMarker,
      test: 'html',
    })
    .use(retextEnglish)
    .use(retextEquality, { ignore: ['host', 'hosts', 'whitespace'] })
    .use(retextProfanities, { sureness: 1 })
    .use(retextQuotes)
    .use(retextSimplify, {
      ignore: [
        'address',
        'component',
        'equivalent',
        'function',
        'identify',
        'initial',
        'interface',
        'maintain',
        'maximum',
        'minimum',
        'option',
        'parameters',
        'provide',
        'render',
        'request',
        'selection',
        'submit',
        'type',
      ],
    })
    .use(retextSyntaxMentions),
]
