# ADR-0009: Use Controlled Detail Markdown

## Status

Accepted and implemented. Shared text/underline/link rendering, validated local media, controlled GIF playback, and the complete three-detail mixed-content workflow are verified. Broader cross-site quality and owner-reviewed release content remain in the [development roadmap](../../project-roadmap.md).

Refines [ADR-0003](0003-use-postgresql-for-mvp-content.md) and [ADR-0008](0008-use-versioned-content-imports.md) without replacing their content ownership or import transaction decisions.

## Context

Project, article, and retrospective details need selected-text emphasis, images/GIFs, website/GitHub links, and unrestricted section ordering. The current CommonMark renderers already support much of the text structure, but skip raw HTML and duplicate their heading/link configuration. Image nodes use default rendering without a reviewed media workflow or animation controls. The importer validates the body string, not its parsed destinations or assets.

Allowing arbitrary HTML for underline or introducing an MDX runtime would change the content trust boundary. Treating the exclusion of an image upload system as a ban on media insertion would unnecessarily prevent useful technical evidence.

## Decision

- Keep PostgreSQL Markdown `body` text and the version-1 JSON import envelope. Media files are versioned presentation assets under `public/media/`; body references do not create a second authority for writing or a binary database store.
- Retain CommonMark and add only the controlled `:underline[text]` inline extension. Do not enable raw HTML, executable MDX, arbitrary components, classes, styles, or general author-selected directives.
- Use one content-feature renderer for project and post details. Keep parsing/filesystem/framework libraries at outer boundaries and pure validation rules framework-independent. Share the contract between import validation and defensive public rendering.
- Allow interleaved sections, prose, still images, controlled GIFs, and descriptive links without fixed subtitle fields. Site tokens own typography; metadata stays plain text.
- Keep media local and reviewed, with validated file references, alternative text, sizing, and byte budgets. Require a static companion poster and explicit Play/Stop interaction for GIFs; only that interaction needs a client component.
- Do not equate the parser's default URL filter with the project destination policy. Validate allowed destinations after decoding, reject active/unsupported schemes and paths, and preserve safe readable fallbacks for legacy rows.
- Define the syntax, media naming, budgets, and compatibility requirements in the canonical [authoring policy](../../development/content-authoring.md). Verify the complete local workflow before cross-site quality review, owner-reviewed release content, and the release rehearsal.

## Alternatives considered

- **Raw HTML or MDX:** unnecessary execution/attribute surface for text emphasis and media insertion; conflicts with the approved non-executable content boundary.
- **A rich-text CMS or block-table model:** adds administration, migrations, and content-shape complexity without a current need beyond ordered Markdown.
- **CommonMark alone:** covers most content but does not provide underline or accessible GIF playback controls.
- **Remote media URLs or an upload service:** adds availability, privacy, network, and storage ownership concerns. Link to websites now; reconsider remote embedding only when separately approved.
- **Separate renderer policies per route:** permits security, accessibility, and syntax drift for the same authored content.

## Consequences

No database migration or import-envelope change is expected. Existing inputs must be audited before tighter body validation is enabled; unsafe legacy values must not bypass public rendering protections. The underline extension is project-specific and needs documented authoring syntax and parser-level tests. Any added parser/media dependency needs an implementation-time justification, pinned resolution, and compatibility checks.

Media and writing have separate promotion artifacts: release files must exist before referenced bodies are published, and draft status cannot make public assets private. GIF posters, controls, and media budgets add explicit authoring and verification work but keep animation optional. Production deployment, uploads, and cache changes remain outside this decision's authorization.

## Revisit when

Revisit when browser editing, private media, remote media hosting, video, additional syntax extensions, or content revisions become approved requirements, or measured content needs justify changing the media budgets. Preserve stable published URLs and review the trust boundary before widening the contract.
