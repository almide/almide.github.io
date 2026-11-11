# almide.github.io

The landing page for [Almide](https://github.com/almide/almide), served at <https://almide.github.io/>.

Plain HTML and CSS, no build step. A small optional script remembers the colour scheme; every page and language link works without JavaScript.

The layout follows the [O6lvl4 portfolio](https://o6lvl4.github.io/O6lvl4-portfolio/): monochrome surfaces, a red accent, JetBrains Mono, and a compact evidence panel. The complete header stays available on mobile, with navigation separated from language and theme controls.

| Path | What |
|---|---|
| `index.html` | English page |
| `ja/index.html` | Japanese page |
| `zh/index.html` | Simplified Chinese page (`zh-Hans`) |
| `story/index.html`, `ja/story/index.html`, `zh/story/index.html` | Development history in all three languages |
| `site.js` | Optional theme preference and section-aware language switching |
| `style.css` | Shared styles (light and dark) |
| `favicon.svg` | Logo, same file as the docs site |
| `fonts/` | Self-hosted JetBrains Mono (SIL OFL 1.1; license included), with the existing Geist fonts retained |

## Keeping it true

Every technical statement on the page is taken from the compiler repository. When one of these changes, the page changes with it:

- The evidence counts in the hero (theorems, certified programs, standard library functions and Wasm size) and the commit they are dated to. The certified count is the header of `crates/almide-wasm/tests/golden/witness-fixtures.txt`. The Rust count is the header of `proofs/native-verified-floor.txt`. The corpus size is the number of `.almd` files in `spec/wasm_cross/`. Read all three from `origin/develop`, not from a working branch. The theorem count is the number of `Theorem`, `Lemma` and `Corollary` statements in `proofs/*.v`; it is only quoted while `Admitted` and `Axiom` both count zero there.
- The diagnostics in section 05 are real compiler output (`almide check`, `almide fix`).
- The code sample in section 02 must pass `almide check` and print the shown output with `almide run --target wasm`.
- Section 06 mirrors `docs/contracts/proven-vs-trusted.md` and `docs/design/MEMORY-SAFETY.md`.

## Preview

Open `index.html` in a browser, or serve the repository with any static HTTP server.

## Verification

```sh
npm ci
npm test
npx playwright install chromium
npm run verify
```

The dependency-free static tests check all six pages, metadata, local links and assets, preserved Chinese code examples, and theme controls with unavailable storage. Browser verification checks five widths (320, 390, 768, 1024 and 1440 px) in both themes, JavaScript-disabled navigation, missing assets, theme persistence, language switches, section anchors and Back/Forward. Screenshots are written to `test-results/`. Set `CHROMIUM_PATH` to use an existing Chromium executable.

The Verify website workflow runs these checks on pull requests and pushes to `main`, and keeps screenshots as an artifact. GitHub Pages continues to publish the static root from `main`; this workflow does not change the deployment source.

When editing shared navigation or content, update English, Japanese and Simplified Chinese together. Language links keep the corresponding Home or Story route, and home-page section anchors stay the same across languages.
