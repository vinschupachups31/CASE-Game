// Builds a single self-contained HTML page of the web build (fonts and JS inlined),
// for sharing a playable demo link. Run after `npx expo export --platform web`.
// Usage: node scripts/build-demo.mjs [output.html]
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const out = process.argv[2] ?? 'dist-demo/case-demo.html';
const jsDir = 'dist/_expo/static/js/web';
const bundle = readFileSync(`${jsDir}/${readdirSync(jsDir).find((f) => f.endsWith('.js'))}`, 'utf8').replace(/<\/script/gi, '<\\/script');

const fonts = {
  InstrumentSerif_400Regular: 'instrument-serif/400Regular/InstrumentSerif_400Regular.ttf',
  InstrumentSerif_400Regular_Italic: 'instrument-serif/400Regular_Italic/InstrumentSerif_400Regular_Italic.ttf',
  Inter_400Regular: 'inter/400Regular/Inter_400Regular.ttf',
  Inter_600SemiBold: 'inter/600SemiBold/Inter_600SemiBold.ttf',
  JetBrainsMono_400Regular: 'jetbrains-mono/400Regular/JetBrainsMono_400Regular.ttf',
};
const faces = Object.entries(fonts)
  .map(([family, path]) => {
    const data = readFileSync(`node_modules/@expo-google-fonts/${path}`).toString('base64');
    return `@font-face{font-family:'${family}';src:url(data:font/ttf;base64,${data}) format('truetype');font-display:block}`;
  })
  .join('\n');

const html = `<title>CASE 23:17</title>
<style>
/* Single dark look, like the app: near-black ground, warm white ink. */
:root{--bg:#07080A;--ink:#F2EDE4;color-scheme:dark;background:var(--bg)}
html,body{height:100%;margin:0;background:var(--bg);color:var(--ink);overflow:hidden;font-family:'Inter_400Regular',system-ui,sans-serif}
#root{display:flex;height:100%;flex:1}
${faces}
</style>
<div id="root"></div>
<script>window.__CASE_FONTS_INLINED__=true;</script>
<script>${bundle}</script>
`;

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
console.log(`${out} — ${(html.length / 1024 / 1024).toFixed(2)} MB`);
