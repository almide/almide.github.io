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

- The three counts in the hero (checkers, certified Wasm programs, annotations) and the commit they are dated to. The certified count is the header of `crates/almide-wasm/tests/golden/witness-fixtures.txt`. The Rust count is the header of `proofs/native-verified-floor.txt`. The corpus size is the number of `.almd` files in `spec/wasm_cross/`. Read all three from `origin/develop`, not from a working branch. The theorem count is the number of `Theorem`, `Lemma` and `Corollary` statements in `proofs/*.v`; it is only quoted while `Admitted` and `Axiom` both count zero there.
- The diagnostics in section 05 are real compiler output (`almide check`, `almide fix`).
- The code sample in section 02 must pass `almide check` and print the shown output with `almide run --target wasm`.
- Section 06 mirrors `docs/contracts/proven-vs-trusted.md` and `docs/design/MEMORY-SAFETY.md`.

## Preview

Open `index.html` in a browser.
