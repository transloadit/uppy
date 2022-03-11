import remarkRetext from 'remark-retext'
import { unified } from 'unified'
import retextEnglish from 'retext-english'
import retextEquality from 'retext-equality'
import retextProfanities from 'retext-profanities'
import retextQuotes from 'retext-quotes'
import retextSimplify from 'retext-simplify'
import retextSyntaxMentions from 'retext-syntax-mentions'

export default [
  remarkRetext,
  unified()
    .use(retextEnglish)
    .use(retextEquality, { ignore: ['disabled', 'host', 'hosts', 'invalid', 'whitespace'] })
    .use(retextProfanities, { sureness: 1 })
    .use(retextQuotes)
    .use(retextSimplify, {
      ignore: [
        'accurate',
        'address',
        'alternatively',
        'component',
        'equivalent',
        'function',
        'identify',
        'implement',
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
        'validate',
      ],
    })
    .use(retextSyntaxMentions),
]
