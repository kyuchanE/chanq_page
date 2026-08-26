# ADR-0007: Classify Posts by Kind

## Status

Accepted

## Context

The MVP has separate Blog and Retrospectives sections, but both publish the same core content shape: a titled Markdown document with publication state, timestamps, SEO metadata, tags, and related projects. The initial PostgreSQL schema stores both concepts in `posts` without a queryable distinction.

The public repository and routes need to select a section before they are implemented. The decision must also establish whether one post can appear in both sections, which route owns its detail URL, and how canonical metadata avoids duplicate public content.

## Decision

Classify every post with one required project-owned `kind`:

- `article` belongs to the Blog section.
- `retrospective` belongs to the Retrospectives section.

Use a PostgreSQL `post_kind` enum and a required `posts.kind` column. Keep articles and retrospectives in the shared `posts` aggregate because their publication, metadata, tag, and project-relation invariants are the same.

A post has exactly one kind and cannot appear in both sections. Cross-section discovery may use links, tags, or related content, but those mechanisms do not change URL ownership.

Stable public URL ownership is:

- Articles: `/blog/{slug}`
- Retrospectives: `/retrospectives/{slug}`

Each detail page uses its owning URL as the canonical URL. A draft, unknown slug, or post requested through the route for the other kind returns not found; the application does not render duplicate content or use a cross-canonical fallback. Slugs remain globally unique across all posts.

The forward migration classifies every pre-existing post as `article` to preserve rows without inferring retrospective meaning from tags or copy. It then removes the temporary database default, so every future insert must choose a kind explicitly. The migration preserves existing post identifiers, slugs, publication states, and timestamps.

## Alternatives considered

- **Use a constrained category or reserved tag:** rejected because editorial tags are many-to-many metadata and should not own routing, canonical behavior, or section membership.
- **Allow many-to-many section membership:** rejected because one row could then have two public detail URLs, creating ambiguous ownership and duplicate-content behavior without a current syndication requirement.
- **Use separate article and retrospective tables:** rejected because both concepts currently share the same fields, constraints, relations, and lifecycle; separate tables would duplicate repository and migration behavior.
- **Use an `is_retrospective` boolean:** rejected because a named kind expresses the domain and extends more safely if another mutually exclusive post kind is approved later.

## Consequences

- Public post queries must require an expected kind in addition to publication state and slug.
- Blog and Retrospectives can share mapping and presentation behavior while retaining distinct routes and metadata.
- Content import must require a valid explicit kind and must not silently classify new rows.
- Changing an existing post's kind changes its owning public URL and therefore requires deliberate redirect and SEO review after launch.
- Adding a future post kind requires a reviewed enum migration and an explicit URL owner.

## Revisit when

Revisit this decision if the product requires intentional cross-section syndication, a post to have multiple canonical presentations, or a new content concept whose fields and lifecycle no longer fit the shared post aggregate.
