import React from 'react';
import CodeBlock from '@theme/CodeBlock';
import Admonition from '@theme/Admonition';

// import packageJson from '../../package.json';
import packageJson from 'uppy/package.json';

const { version: uppyVersion } = packageJson;

export default function UppyCdnExample({
	children,
	uppyCssName = 'uppy.min.css',
	uppyJsName = 'uppy.min.mjs',
}) {
	let lines = [];

	React.Children.toArray(children).forEach((child) => {
		lines = [
			...lines,
			...String(child)
				.trim()
				.split('\n')
				.map((line) => line.trim()),
		];
	});

	const linesProcessed = lines.map((line) => `  ${line}`).join('\n');

	const uppyJsUrl = `https://releases.transloadit.com/uppy/v${uppyVersion}/${uppyJsName}`;
	const html = `\
<!-- 1. Add CSS to \`<head>\` -->
<link href="https://releases.transloadit.com/uppy/v${uppyVersion}/${uppyCssName}" rel="stylesheet">

<!-- 2. Initialize -->
<div id="uppy"></div>

<script type="module">
${linesProcessed.replace(/{{UPPY_JS_URL}}/g, uppyJsUrl)}
</script>
`;

	return (
		<>
			<Admonition type="caution">
				<p>
					The bundle consists of most Uppy plugins, so this method is not
					recommended for production, as your users will have to download all
					plugins when you are likely using only a few.
				</p>
				<p>
					It can be useful to speed up your development environment, so don't
					hesitate to use it to get you started.
				</p>
			</Admonition>
			<CodeBlock language="html">{html}</CodeBlock>
		</>
	);
}
