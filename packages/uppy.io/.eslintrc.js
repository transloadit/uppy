module.exports = {
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 2022,
		jsx: false,
	},
	env: { node: false },
	plugins: ['@docusaurus', 'markdown', 'mdx'],
	extends: [
		'plugin:@docusaurus/recommended',
		'plugin:@typescript-eslint/recommended',
	],
	rules: {
		'@typescript-eslint/no-var-requires': 'off',
		'@typescript-eslint/no-unused-vars': 'off',
		'@typescript-eslint/no-require-imports': 'off',
	},
	overrides: [
		{
			files: ['./*.js'],
			parserOptions: {
				sourceType: 'script',
			},
			env: {
				node: true,
			},
		},
		{
			files: ['**/*.md', '*.md'],
			processor: 'markdown/markdown',
		},
		{
			files: ['**/*.mdx', '*.mdx'],
			extends: 'plugin:mdx/recommended',
		},
		{
			files: ['**/*.md/*.js', '**/*.mdx/*.js'],
			env: {
				node: false,
				browser: true,
			},
		},
		{
			files: [
				'**/*.ts',
				'**/*.tsx',
				'**/*.md/*.ts',
				'**/*.mdx/*.ts',
				'**/*.md/*.tsx',
				'**/*.mdx/*.tsx',
			],
			parser: '@typescript-eslint/parser',
			plugins: ['@typescript-eslint'],
		},
		{
			files: [
				'**/*.jsx',
				'**/*.tsx',
				'**/*.md/*.jsx',
				'**/*.mdx/*.jsx',
				'**/*.md/*.tsx',
				'**/*.mdx/*.tsx',
			],
			parserOptions: {
				ecmaFeatures: {
					jsx: true,
				},
			},
		},
	],
};
