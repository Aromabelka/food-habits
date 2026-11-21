import { readFile, mkdir, writeFile } from 'node:fs/promises';
const read = path => readFile(new URL('../'+path, import.meta.url),'utf8');
const [html,css,logic,app,backend,manifest]=await Promise.all(['src/index.html','src/styles.css','src/survey.js','src/app.js','apps-script/Code.gs','apps-script/appsscript.json'].map(read));
const page=html.replace('<!-- STYLES -->',`<style>${css}</style>`).replace('<!-- SCRIPTS -->',`<script>${logic}\n${app}</script>`);
await mkdir(new URL('../dist/apps-script/',import.meta.url),{recursive:true});
await Promise.all([writeFile(new URL('../dist/index.html',import.meta.url),page),...Object.entries({'Index.html':page,'Code.gs':backend,'Survey.gs':logic,'appsscript.json':manifest}).map(([name,body])=>writeFile(new URL('../dist/apps-script/'+name,import.meta.url),body))]);
console.log('Built local preview: dist/index.html; Apps Script project: dist/apps-script');
