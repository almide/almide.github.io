import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import { readFile, mkdir } from 'node:fs/promises';
const root = path.resolve(new URL('../', import.meta.url).pathname);
const routes = ['/', '/ja/', '/zh/', '/story/', '/ja/story/', '/zh/story/'];
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.svg':'image/svg+xml', '.woff2':'font/woff2' };
const server = http.createServer(async (req,res) => {
  try {
    let file = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (file.endsWith('/')) file += 'index.html';
    file = path.resolve(root, `.${file}`);
    if (!file.startsWith(`${root}${path.sep}`)) { res.writeHead(403).end(); return; }
    const content = await readFile(file);
    res.writeHead(200, {'Content-Type':mime[path.extname(file)] || 'application/octet-stream'}).end(content);
  } catch { res.writeHead(404).end('Not found'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {});
await mkdir(`${root}/test-results`, {recursive:true});
try {
  for (const width of [320, 360, 375, 390, 740, 768, 1024, 1440]) {
    for (const scheme of ['light','dark']) {
      for (const route of routes) {
        const page = await browser.newPage({viewport:{width,height:1000},colorScheme:scheme,reducedMotion:'reduce'});
        const errors=[]; const failed=[];
        page.on('pageerror', error=>errors.push(error.message));
        page.on('response', response=>{if(response.status()>=400) failed.push(`${response.status()} ${response.url()}`);});
        assert.equal((await page.goto(base+route)).status(), 200);
        await page.evaluate(()=>document.fonts.ready);
        const measurements = await page.evaluate(()=>({
          width:innerWidth, scroll:document.documentElement.scrollWidth,
          links:[...document.querySelectorAll('.top a, .theme-toggle')].map(el=>({text:el.textContent.trim(),...el.getBoundingClientRect().toJSON()})),
          heroChildren:document.querySelector('.hero').children.length,
          accent:getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),
          bg:getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(),
          introSize:parseFloat(getComputedStyle(document.querySelector('.hero .sub')).fontSize),
          factSize:parseFloat(getComputedStyle(document.querySelector('.facts span')).fontSize),
          navSize:parseFloat(getComputedStyle(document.querySelector('.primary-nav a')).fontSize),
        }));
        assert.ok(measurements.scroll <= width+1, `Page overflow at ${route} ${width} ${scheme}: ${JSON.stringify(measurements)}`);
        assert.equal(measurements.heroChildren, 2, `Hero structure at ${route}`);
        assert.equal(measurements.accent,scheme==='light'?'#0a6e82':'#5fd4e6');
        assert.equal(measurements.bg,scheme==='light'?'#f4f6f4':'#070c0c');
        if (width<=760) {
          assert.ok(measurements.introSize>=16 && measurements.factSize>=13 && measurements.navSize>=12, `Mobile reading sizes at ${route}`);
          assert.ok(await page.locator('.diagram-hint').first().isVisible());
          if (!route.includes('story')) {
            assert.equal(await page.locator('.prop.head').isVisible(), false);
            assert.ok(await page.locator('.mobile-label').first().isVisible());
            assert.equal(await page.locator('.prop:not(.head)').first().evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),1);
          }
        }
        for (const rect of measurements.links) {
          assert.ok(rect.x>=-1 && rect.right<=width+1, `Header out of viewport ${route} ${width}: ${JSON.stringify(rect)}`);
          assert.ok(rect.height>=43 && rect.width>=43, `Small touch target ${route}: ${JSON.stringify(rect)}`);
        }
        if (width===320 || width===390 || width===1440) {
          const name=(route.replaceAll('/','-')||'home')+`-${width}-${scheme}`;
          await page.screenshot({path:`${root}/test-results/${name}.png`});
          if (width === 1440 && !route.includes('story')) {
            await page.locator('#checkers .spine.overview').screenshot({path:`${root}/test-results/${name}-evidence.png`,style:'.top { visibility: hidden; }'});
          }
          if (width===390) {
            await page.locator('.hero-evidence').screenshot({path:`${root}/test-results/${name}-facts.png`});
            await page.locator('.diagram').first().scrollIntoViewIfNeeded();
            await page.screenshot({path:`${root}/test-results/${name}-diagram.png`});
            const region=page.locator('.diagram').first();
            await region.focus(); await region.press('ArrowRight');
            await page.waitForFunction(()=>document.querySelector('.diagram').scrollLeft>0);
            assert.ok(await region.evaluate(el=>document.activeElement===el));
            assert.equal(await page.locator('.skip-link').evaluate(el=>getComputedStyle(el).opacity),'0');
            if (!route.includes('story')) {
              assert.ok(await page.locator('.mobile-label').first().isVisible());
              await page.locator('.props').first().screenshot({path:`${root}/test-results/${name}-table.png`});
            }
          }
        }
        assert.deepEqual(errors, [], `${route}: script errors`);
        assert.deepEqual(failed, [], `${route}: missing assets`);
        await page.close();
      }
    }
  }
  const page=await browser.newPage({viewport:{width:390,height:844},colorScheme:'light',reducedMotion:'reduce'});
  await page.goto(base+'/');
  await page.keyboard.press('Tab');
  assert.ok(await page.locator('.skip-link').evaluate(el=>document.activeElement===el));
  assert.equal(await page.locator('.skip-link').evaluate(el=>getComputedStyle(el).opacity),'1');
  await page.keyboard.press('Enter');
  await page.waitForURL('**/#main-content');
  const toggle=page.locator('.theme-toggle');
  await toggle.click(); assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
  await page.reload(); assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
  for (let i=0;i<4;i++) await toggle.click();
  assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
  await page.locator('.page-index a[href="#evidence"]').click();
  await page.locator('.locale-switcher a[lang="zh-Hans"]').click();
  await page.waitForURL('**/zh/#evidence');
  assert.equal(await page.locator('html').getAttribute('lang'),'zh-Hans');
  assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
  assert.ok(await page.locator('#evidence').evaluate(el=>el.getBoundingClientRect().top)>=20);
  await page.goBack(); assert.ok(page.url().endsWith('/#evidence'));
  await page.goForward(); assert.ok(page.url().endsWith('/zh/#evidence'));
  await page.goto(base+'/ja/story/');
  await page.locator('.locale-switcher a[lang="zh-Hans"]').click();
  await page.waitForURL('**/zh/story/');
  await page.locator('.primary-nav a').first().click();
  await page.waitForURL('**/zh/');
  await page.close();
  const noJS=await browser.newContext({javaScriptEnabled:false,viewport:{width:320,height:800}});
  for (const route of routes) {
    const p=await noJS.newPage(); await p.goto(base+route);
    assert.equal(await p.locator('h1').count(),1);
    assert.equal(await p.locator('.theme-toggle').isVisible(),false);
    assert.equal(await p.locator('.locale-switcher a').count(),3);
    assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await p.close();
  }
  await noJS.close();
  console.log('PASS: 96 responsive/theme renders; original palette, mobile type and diagram keyboard checks; six no-JS routes; asset, layout, theme, locale, anchor and history checks.');
} finally { await browser.close(); await new Promise(resolve=>server.close(resolve)); }
