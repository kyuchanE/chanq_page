# Current Project Scope

## Product outcome

Create a public developer portfolio that lets a visitor quickly understand the developer's specialization, practical experience, problem-solving method, technical judgment, and contact options.

## Primary audiences

- Recruiters and hiring managers
- Developers and potential collaborators
- Prospective freelance clients
- Readers arriving through technical search queries

## MVP capabilities

- Home, About, Skills, Projects, Blog, and Contact experiences
- Two or three detailed project case studies
- Three to five retrospectives or troubleshooting articles
- Responsive layouts with restrained, purposeful motion
- Accessible keyboard navigation and reduced-motion support
- Page-specific metadata, canonical URLs, sitemap, robots rules, Open Graph data, and appropriate structured data
- Static rendering by default, with revalidation only where content freshness requires it
- Local MDX or typed file content managed through Git
- Reproducible Docker build and single-instance deployment
- Public DNS and HTTPS through Cloudflare

## MVP exclusions

- User accounts and application authentication
- Comments, likes, follows, bookmarks, and community features
- Full content administration UI
- Search unless content volume creates a verified need
- React Native application
- PostgreSQL-backed content management
- Multi-server architecture
- Advertising at launch

## Definition of done

The MVP is done when:

1. Every primary route works through direct navigation and refresh.
2. At least two projects explain the problem, alternatives, decision, implementation, evidence, limitations, and next steps.
3. At least three useful articles or retrospectives are published.
4. Mobile, tablet, desktop, keyboard, focus, contrast, image alternatives, and reduced motion are verified.
5. Metadata, canonical URLs, sitemap, robots rules, Open Graph data, structured data, 404 behavior, and indexability are verified.
6. The production image builds and the application runs through Docker Compose on the intended domain with HTTPS.
7. Performance and production errors are measured and documented rather than guessed.

## Deferred-technology adoption gates

### PostgreSQL and a content API

Adopt when at least one real need exists: browser-based editing, draft workflows, shared web/mobile content, dynamic views or search, multi-device content management, or data that cannot be represented safely as versioned files.

### Nginx

Adopt when the deployment needs responsibilities that Next.js or Cloudflare should not own, such as routing multiple local services, controlled buffering or body limits, stable origin headers, or origin-level static asset policy. A single Next.js container does not require Nginx by default.

### Cloudflare Tunnel

Adopt for self-hosting when the origin should accept no public inbound connection, a stable tunnel route is operationally simpler than port forwarding, and failure/recovery behavior is documented. Cloudflare DNS and HTTPS do not require Tunnel.

### React Native

Adopt only when a mobile-specific capability such as offline reading, notifications, or a personal development log provides value beyond reproducing the website.
