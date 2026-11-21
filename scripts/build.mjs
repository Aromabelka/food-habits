import { readFile, mkdir, writeFile, rm } from 'node:fs/promises';
const read = path => readFile(new URL('../'+path, import.meta.url),'utf8');
const [html,css,logic,app,backend,manifest,config,bridge]=await Promise.all(['src/index.html','src/styles.css','src/survey.js','src/app.js','apps-script/Code.gs','apps-script/appsscript.json','src/config.js','apps-script/Bridge.html'].map(read));
const page=html.replace('<!-- STYLES -->',`<style>${css}</style>`).replace('<!-- SCRIPTS -->',`<script>${config}\n${logic}\n${app}</script>`);
await mkdir(new URL('../dist/apps-script/',import.meta.url),{recursive:true});
await Promise.all(['Code.js','Survey.js'].map(name=>rm(new URL('../dist/apps-script/'+name,import.meta.url),{force:true})));
await Promise.all([writeFile(new URL('../dist/index.html',import.meta.url),page),...Object.entries({'Index.html':page,'Code.gs':backend,'Bridge.html':bridge,'Survey.gs':logic,'appsscript.json':manifest}).map(([name,body])=>writeFile(new URL('../dist/apps-script/'+name,import.meta.url),body))]);
console.log('Built local preview: dist/index.html; Apps Script project: dist/apps-script');

await writeFile(new URL('../dist/privacy.html',import.meta.url),await read('src/privacy.html'));
// Keep branch-based Pages compatible while repository settings still use main:/.
await writeFile(new URL('../index.html',import.meta.url),page);
await writeFile(new URL('../privacy.html',import.meta.url),await read('src/privacy.html'));
