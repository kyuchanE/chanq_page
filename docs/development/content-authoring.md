# Detail Content Authoring Policy

## Status and scope

The shared text/directive/link contract is implemented. Validated local media, controlled GIF playback, and full mixed-content round-trip verification remain planned in DEV-09B and DEV-09C in the [development roadmap](../project-roadmap.md).

Apply this contract to project case studies, Blog articles, and Retrospectives. Home, About, Contact, list summaries, and Skills do not become rich-text editors or new detail routes. PostgreSQL remains authoritative for writing; reviewed JSON imports contain Markdown `body` strings. See [ADR-0009](../architecture/decisions/0009-use-controlled-detail-markdown.md) for the architectural decision and [content import](content-import.md) for the executable local workflow.

## Current implementation review

| Requested capability | Current evidence | Remaining work |
|---|---|---|
| Selected-text styling | One server-rendered detail component supports CommonMark strong/emphasis and controlled `:underline[text]`. Import rejects raw HTML and unsupported directives; rendering independently omits HTML and retains safe text. | Keep media and broader cross-site quality verification separate. |
| Still images and GIFs | Markdown image destinations receive the body-link safety filter; rejected destinations become alternative text. Otherwise baseline image rendering remains. There is no reviewed `public/` media collection or GIF playback control. | Add local-only media validation, assets, responsive rendering, intrinsic sizing, and controlled animation. Current HTTP(S) image support is not release-ready media support. |
| GitHub and website links | Import and rendering share decoded/normalized HTTP(S), root-path, and generated-heading fragment rules. External links include a new-tab notice and `noopener noreferrer`. Body links use bold, double-underlined styling to distinguish them from underlined prose. | Owner review of external destination availability; media-specific path rules remain planned. |
| Mixed content and repeated sections | The shared renderer preserves ordered CommonMark sections and maps body H1 to H2. Four-section text fixtures cover identical project/article/retrospective output. | Verify real images before/after prose and the complete media round trip in DEV-09B/DEV-09C. |

Evidence: [shared renderer](../../src/features/content/presentation/markdown/detail-markdown.tsx), [Markdown adapter](../../src/features/content/infrastructure/markdown/detail-markdown.ts), [import parser](../../src/features/content/infrastructure/imports/parse-content-import.ts), [contract tests](../../tests/unit/features/content/detail-markdown.test.ts), and [shared component tests](../../tests/component/detail-markdown.test.tsx). These checks establish text/link behavior, not image loading or animation behavior.

The importer checks body type, length, NUL characters, frontmatter, reserved fixture markers, parsed directives/HTML, and decoded link destinations before opening the import transaction in either mode. Referenced media files, type, size, alternative-text quality, and GIF posters are not yet inspected. Successful import therefore does not establish media readiness.

## Text and document structure

- Keep `title`, `summary`, and SEO fields plain text. The page header owns the only H1. Use `##` for body sections and `###` through `######` for deeper structure without skipping levels. Preserve the existing H1-to-H2 fallback for older bodies.
- Use `**important text**` or `__important text__` for bold and `*emphasized text*` for italic. Double underscores do not mean underline.
- Use `:underline[text]` for the implemented project extension; it is not standard CommonMark. Only this inline directive with nonempty text and no attribute suffix (including empty `{}`) is allowed; text, strong, emphasis, and inline code may be its children. Code spans, indented code, and fenced code blocks remain literal. Escape the leading colon as `\:underline[text]` to show syntax in prose; quote or escape other directive-like text such as `status:pending` as well.
- Render underline through a fixed application-owned text component/style, not authored HTML. Disallow author-supplied classes, styles, IDs, event handlers, arbitrary directive names, and nested directives. Reject unsupported directives during import; public rendering must retain safe readable text without creating an active element.
- Retain ordinary paragraphs, lists, quotes, and code blocks. Do not impose a section-count limit beyond the current 200,000-character body and 2 MiB import limits. GFM tables, arbitrary layouts, and executable embeds are not added by this policy.
- Site typography tokens own font family, size, weight scale, and colors. Use underline sparingly and keep links visually distinguishable by more than color alone. Important meaning must remain understandable without visual emphasis.
- The shared body styles restore visible list bullets/numbers after the global CSS reset and reserve responsive anchor scroll margins for the sticky header. Browser tests check list marker styles and that a followed heading is below the header, not merely inside the viewport.

## Links

- Use descriptive Markdown links for citations, GitHub repositories, and websites anywhere in the body, including a final references section. Standard inline and reference-style Markdown links are supported.
- Allow absolute `https:` and `http:` destinations without embedded credentials, safe site-root-relative paths, and fragment links to existing targets. Prefer HTTPS. New body links do not require a new database field or relation table.
- Body headings receive deterministic `content-` IDs: lowercase NFKC-normalized heading text, runs of non-letter/digit characters replaced by hyphens, and duplicate suffixes `-2`, `-3`, etc. Empty labels use `content-section`. For example, `## Decision` can be referenced with `[Decision](#content-decision)`. Fragment-only links must match a generated body heading, including forward references. Renaming a heading changes its fragment; preserve referenced headings when editing. No authored IDs are accepted. Site-root paths may include query strings/fragments; their destination availability still requires review.
- Reject protocol-relative destinations, backslashes, control characters, traversal, and other schemes such as `javascript:`, `data:`, `file:`, and `vbscript:`. Apply the same policy after parser decoding/normalization, including reference-style links and image links. Do not rely on string-prefix checks alone.
- Validation checks the parsed destination and each percent-decoded layer before accepting URL normalization. Malformed, excessively nested encoding and encoded literal-percent forms that cannot be decoded safely are rejected conservatively. Bare relative paths, abbreviated `https:host` forms, and credentials (including empty userinfo) are not supported. Definitions are checked even when unused. This policy does not fetch destinations or change stored Markdown strings.
- Preserve the current external-link behavior: HTTP(S) links open a new tab with `rel="noopener noreferrer"` and an accessible new-tab notice. Internal/fragment links remain in the same tab. Missing or rejected destinations render readable text without an active link.
- Import validation reports an invalid field or content location without echoing the full body. Automated validation does not fetch arbitrary external URLs; owners review availability separately without sending messages or submitting forms.
- Project header `repositoryUrl`/`liveUrl` remain optional shortcuts. They do not limit the number or position of body links. Static Contact links are outside this body policy.

## Still images and GIFs

- Insert images at the relevant point using standard Markdown image syntax, including reference-style `![alternative text][image-id]`. Store the referenced files under `public/media/<content-slug>/` and use site-root-relative `/media/<content-slug>/...` URLs in the body. These are reviewed versioned assets, not uploads or database binaries.
- Allow PNG, JPEG (`.jpg`/`.jpeg`), static WebP, and GIF. Other animated encodings, SVG, remote image URLs, data URLs, iframes, and provider embeds are outside this MVP contract. A website or GitHub destination may be linked without embedding its remote media.
- Validate normalized paths, supported file content/type, existence, nonzero intrinsic dimensions, and nonempty alternative text automatically; review whether the alternative text meaningfully explains the image manually. Reject traversal, encoded traversal/separators, protocol-relative paths, query/fragment suffixes, backslashes, control characters, and symlink escapes outside the media root. Validation must not fetch remote files.
- Apply a release budget of at most 1 MiB per still image or poster, 5 MiB per GIF, and 10 MiB for the unique referenced assets of one body, including posters. These are project budgets, not format limits; changing them requires measured justification in the policy and tests.
- Preserve aspect ratio, reserve width/height or equivalent layout space, fit narrow viewports, and lazy-load offscreen media. A failed asset must leave useful alternative text or an accessible fallback rather than hide the surrounding explanation.
- A GIF named `demo.gif` requires a reviewed static WebP companion named `demo.poster.webp` in the same directory and with the same dimensions. Treat every `.gif` reference as controlled media. The initial/server-rendered view shows only the poster; do not load the animation until the visitor requests playback.
- Provide labeled keyboard-operable Play and Stop controls with visible focus. Play loads the original GIF without flattening its frames; Stop removes the animation and restores the poster. Stopping/replaying may restart from the first frame; frame-accurate pause/resume is not required.
- Never auto-start a GIF, including under `prefers-reduced-motion`. If reduced motion becomes enabled during playback, stop it. Without JavaScript, retain the poster, alternative text, and nearby explanation. CSS animation overrides alone do not stop an animated image.
- Reject missing posters at import time and verify asset availability in release checks. Keep parser/presentation safety independent of import success so legacy or externally modified rows cannot bypass the renderer policy.
- Keep `ogImagePath` separate: it is metadata, not a body image list. This policy does not automatically use body media for social previews or widen the existing metadata path contract.

All files in `public/` are public regardless of a database draft state. Do not commit confidential draft media, credentials, unredacted personal data, or assets without permission. Keep URLs stable; introduce a new filename for a replacement and retain any asset still referenced by published content. Release packaging must include the referenced files before their bodies are published. Production publication and cache changes still require separate authorization.

## Mixed-content example

The JSON `title` supplies the page title, for example `Offline Synchronization Case Study`. Its `body` can contain the following ordered Markdown. The media references are illustrative placeholders, not existing files or an import-ready bundle. Replace them with reviewed assets and the matching GIF poster after DEV-09B and DEV-09C pass.

```markdown
## Problem and constraints

Explain the problem with **important evidence**, *context*, and a
:underline[key constraint].

![Diagram showing the synchronization boundaries][architecture-image]

## Interaction demonstration

![Offline edits being synchronized after reconnecting][sync-demo]

Explain what the demonstration shows and its limitations.

## Verification and lessons

Describe the verification method, results, and remaining tradeoffs.
Add as many further sections as the narrative needs.

## References

- [Background documentation](https://example.com/reference)

## Source code

- [Example source repository](https://github.com/example/example)

[architecture-image]: /media/offline-sync/architecture.png
[sync-demo]: /media/offline-sync/demo.gif
```

The companion for the GIF above is `/media/offline-sync/demo.poster.webp`. When preparing version-1 JSON, encode line breaks in `body` as `\n` using a JSON-aware editor or serializer; literal unescaped newlines inside a JSON string are invalid. Do not copy Markdown fences around the whole body. The example's sections, order, and count are suggestions, not a fixed template.

## Implementation, verification, and compatibility

Project/post presentation uses one controlled detail renderer in the `content` feature. Its pure URL policy lives in domain code; the shared Markdown adapter lives in infrastructure and is used directly by the outer presentation and import adapters. Neither parser types nor React enter application/domain code. `remark-directive` 4.0.0 supplies syntax-tree parsing with correct escapes and code boundaries, not author-selected HTML; the project handles only underline. `remark-parse` 11.0.0 and `unified` 11.0.5 are explicit direct dependencies matching the existing renderer's parser stack, and `@types/mdast` 4.0.4 supplies development-only tree types. This avoids a second regex-based Markdown grammar. Server rendering remains the default; the future GIF interaction will require a small client leaf.

The PostgreSQL `body` text column and version-1 import shape are unchanged. Before activating text validation, a read-only audit found no text/link incompatibilities in 7 example JSON bodies, 9 development database bodies, and 8 isolated test database bodies. No author-owned data was rewritten. The example and isolated-fixture audits are also regression tests. Incoming bodies are checked separately from stored snapshot schemas, so a reviewed valid import can repair a legacy body; dry-run never rewrites it. These findings do not audit the future media contract.

Text validation is covered by unit/component tests for supported syntax, escaping, code, heading structure, safe fallbacks, and hostile destinations. [PostgreSQL import tests](../../tests/integration/imports/postgres-content-import.test.ts) cover both modes, invalid-body CLI exit code 2 with unchanged seven-table snapshots, normalized text readback for all three detail kinds, repeat stability, unrelated-data preservation, and deliberate legacy repair. [Text browser journeys](../../tests/e2e/detail-markdown.spec.ts) cover all three detail types, direct URLs, refresh, generated anchors, responsive widths, keyboard links/focus, text styling, metadata, and reduced-motion mode. These tests do not establish media behavior.

The shared-text verification passed `./scripts/check.sh` (214 unit/component tests, formatting, lint, types, migration consistency, and production build), `pnpm db:test:repositories` (32 isolated application-role integration tests), and `pnpm test:e2e` (19 production-server Chromium journeys). The three new detail journeys use 375, 768, and 1440 pixel widths. Desktop project and mobile article captures were also visually reviewed for text order, emphasis/link distinction, list markers, and overflow. The test runner resets only the synthetic test database; development writing and production systems are unchanged. Screenshots are ignored test output, not release assets.

The remaining media verification must cover image loading/dimensions, mixed reading order, GIF play/stop, reduced-motion changes, no-JavaScript posters, and invalid-media imports. `./scripts/check.sh` remains mandatory. Keep those controls marked planned until DEV-09B/DEV-09C pass.

Known unrelated baseline limitation: project detail metadata has title/description/Open Graph fields but no canonical URL. Blog and Retrospectives already expose canonical URLs. The project canonical gap is recorded under DEV-10, not treated as a text-rendering regression or resolved by this slice.

## External references

CommonMark defines the baseline text, link, and image syntax but no dedicated underline syntax: [CommonMark specification](https://spec.commonmark.org/0.31.2/). `react-markdown` supports controlled components and parser extensions while `skipHtml` omits authored HTML: [react-markdown documentation](https://github.com/remarkjs/react-markdown). A directive parser still needs project-owned handling; installing one must not enable arbitrary tags or attributes: [remark-directive documentation](https://github.com/remarkjs/remark-directive). The GIF policy uses explicit user control consistent with the accessibility concern explained in [W3C Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html); the always-stopped initial state is this project's stricter choice.
