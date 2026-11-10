# almide.github.io

The landing page for [Almide](https://github.com/almide/almide), served at <https://almide.github.io/>.

Plain HTML and CSS, no build step.

| Path | What |
|---|---|
| `index.html` | English page |
| `ja/index.html` | Japanese page |
| `style.css` | Shared styles (light and dark) |
| `favicon.svg` | Logo, same file as the docs site |
| `fonts/` | Geist and Geist Mono (variable, Latin subset), self-hosted. SIL Open Font License 1.1, © The Geist Project Authors |

## Keeping it true

Every technical statement on the page is taken from the compiler repository. When one of these changes, the page changes with it:

- The three counts in the hero (checkers, certified Wasm programs, annotations) and the commit they are dated to. The certified count is the header of `crates/almide-wasm/tests/golden/witness-fixtures.txt`.
- The diagnostics in section 05 are real compiler output (`almide check`, `almide fix`).
- The code sample in section 02 must pass `almide check` and print the shown output with `almide run --target wasm`.
- Section 06 mirrors `docs/contracts/proven-vs-trusted.md` and `docs/design/MEMORY-SAFETY.md`.

## Preview

Open `index.html` in a browser.
