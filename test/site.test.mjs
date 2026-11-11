import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
const root = new URL('../', import.meta.url);
const routes = ['index.html', 'ja/index.html', 'zh/index.html', 'story/index.html', 'ja/story/index.html', 'zh/story/index.html'];
const read = file => readFile(new URL(file, root), 'utf8');
const html = new Map(await Promise.all(routes.map(async file => [file, await read(file)])));
for (const [file, source] of html) {
  test(`${file}: language, metadata and progressive navigation`, () => {
    const language = file.startsWith('zh/') ? 'zh-Hans' : file.startsWith('ja/') ? 'ja' : 'en';
    assert.ok(source.includes(`<html lang="${language}">`));
    assert.equal((source.match(/<h1\b/g) || []).length, 1);
    assert.equal((source.match(/rel="canonical"/g) || []).length, 1);
    assert.equal((source.match(/rel="alternate"/g) || []).length, 4);
    const languageNav = source.match(/<nav class="locale-switcher"[\s\S]*?<\/nav>/)[0];
    assert.equal((languageNav.match(/<a\b/g) || []).length, 3);
    assert.equal((languageNav.match(/aria-current="true"/g) || []).length, 1);
    assert.match(source, /class="skip-link" href="#main-content"/);
    assert.match(source, /<main id="main-content">/);
    assert.match(source, /class="theme-toggle"[^>]* hidden>/);
    assert.match(source, /<script src="[^"<>]+site\.js\?[^"<>]+" defer>/);
    const ids = [...source.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
    assert.equal(ids.length, new Set(ids).size, 'IDs must be unique');
  });
  test(`${file}: every local link, fragment and asset resolves`, async () => {
    for (const [, attr, value] of source.matchAll(/\b(href|src)="([^"]+)"/g)) {
      if (/^(https?:|mailto:|data:)/.test(value)) continue;
      const url = new URL(value, new URL(file, 'https://almide.github.io/'));
      let relative = url.pathname.slice(1);
      if (!relative || relative.endsWith('/')) relative += 'index.html';
      assert.ok((await stat(new URL(relative, root))).isFile(), `${attr} ${value}`);
      if (url.hash) {
        const target = html.get(relative) || await read(relative);
        assert.ok(target.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`), `${value} fragment`);
      }
    }
  });
}
test('Chinese translations retain all programs, diagnostic output and diagrams', () => {
  const code = source => [...source.matchAll(/<pre\b[\s\S]*?<\/pre>/g)].map(m => m[0]);
  const ids = source => [...source.matchAll(/<section id="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(code(html.get('zh/index.html')), code(html.get('index.html')));
  assert.deepEqual(ids(html.get('zh/index.html')), ids(html.get('index.html')));
  for (const prefix of ['', 'story/']) {
    const en = html.get(`${prefix}index.html`);
    const zh = html.get(`zh/${prefix}index.html`);
    assert.equal((en.match(/<svg /g)||[]).length, (zh.match(/<svg /g)||[]).length);
  }
});
test('Theme control works repeatedly even when storage is unavailable', async () => {
  const events = {}; const attributes = {}; const root = {lang:'zh-Hans', dataset:{}};
  const button = { hidden:true, dataset:{}, setAttribute:(key,value)=>attributes[key]=value, addEventListener:(name,fn)=>events[name]=fn };
  const context = { document:{documentElement:root,querySelector:()=>button,querySelectorAll:()=>[]}, window:{matchMedia:()=>({matches:false,addEventListener(){}})}, localStorage:{setItem(){throw new Error('Storage unavailable');}} };
  vm.runInNewContext(await read('site.js'), context);
  assert.equal(button.hidden, false);
  assert.equal(attributes['aria-label'], '切换为深色模式');
  events.click(); assert.equal(root.dataset.theme, 'dark');
  events.click(); assert.equal(root.dataset.theme, 'light');
});
test('Keep the original Almide light and dark palette', async () => {
  const original=JSON.parse(await read('test/original-palette.json'));
  const css=await read('style.css');
  const rootBlock=css.match(/:root \{([^}]+)\}/)[1];
  const systemDark=css.match(/:root:not\(\[data-theme="light"\]\) \{([^}]+)\}/)[1];
  const manualDark=css.match(/:root\[data-theme="dark"\] \{([^}]+)\}/)[1];
  for (const [theme,block] of [['light',rootBlock],['dark',systemDark],['dark',manualDark]]) {
    const tokens=Object.fromEntries([...block.matchAll(/(--[\w-]+): ([^;]+);/g)].map(m=>[m[1],m[2]]));
    for (const [name,value] of Object.entries(original[theme])) assert.equal(tokens[name],value,`${theme} ${name}`);
  }
});
test('Mobile diagrams and stacked comparison rows have reading aids in every language',()=>{
  for (const [file,source] of html) {
    const diagrams=[...source.matchAll(/<div class="diagram(?: plot)?"[^>]*>/g)];
    assert.ok(diagrams.length>0);
    for (const [tag] of diagrams) {
      assert.match(tag,/tabindex="0"/);
      assert.match(tag,/aria-describedby="diagram-hint-\d+"/);
    }
    if (!file.includes('story')) assert.equal((source.match(/class="mobile-label"/g)||[]).length,14);
  }
});
