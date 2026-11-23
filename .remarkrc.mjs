import { commentMarker } from 'mdast-comment-marker'
import remarkDirective from 'remark-directive'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkLintNoUndefinedReferences from 'remark-lint-no-undefined-references'
import remarkPresetRecommended from 'remark-preset-lint-recommended'
import remarkRetext from 'remark-retext'
import retextEnglish from 'retext-english'
import retextEquality from 'retext-equality'
import retextProfanities from 'retext-profanities'
import retextQuotes from 'retext-quotes'
import retextSyntaxMentions from 'retext-syntax-mentions'
import { unified } from 'unified'
import { messageControl } from 'unified-message-control'

const retextPreset = [
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
        'just',
        'simple',
        'simply',
        'boys',
      ],
    })
    .use(retextProfanities, { sureness: 1, ignore: ['black', 'ball'] })
    .use(retextQuotes)
    .use(retextSyntaxMentions),
]

const messageControlPreset = () => (tree, file) =>
  messageControl(tree, {
    file,
    name: 'retext-simplify',
    marker: commentMarker,
    test: 'html',
  })

export default {
  settings: {
    bullet: '-',
    emphasis: '_',
    strong: '*',
    'tab-size': 1,
  },
  plugins: [
    remarkFrontmatter, // YAML in MD
    remarkGfm, // GitHub Flavored Markdown
    remarkDirective, // Admonitions
    remarkPresetRecommended,
    // Allow GitHub alerts such as `> [!WARNING]`
    [
      remarkLintNoUndefinedReferences,
      { allow: [/^!(note|tip|important|warning|caution)$/i] },
    ],
    retextPreset,
    messageControlPreset,
  ],
}
