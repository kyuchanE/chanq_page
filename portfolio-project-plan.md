# Personal Developer Portfolio Project Plan

## 1. Executive Summary

### Project Goal

Build a personal portfolio website that goes beyond listing technologies and clearly communicates the developer's real project experience, problem-solving process, and technical decision-making.

### MVP Scope

- Developer introduction
- Technical skills and experience
- Two to three featured projects
- Three to five development retrospectives or troubleshooting articles
- Blog listing and article pages
- Contact information and external profiles
- Responsive design and focused animations
- Search engine optimization
- Docker-based deployment
- Cloudflare DNS and HTTPS configuration

### Technical Direction

- Next.js App Router
- TypeScript
- Responsive web experience first
- Static rendering by default
- Dynamic rendering only where it is required
- Hands-on practice with content caching and revalidation
- MDX or local files for initial content management
- PostgreSQL, a REST API, and a React Native app considered after the MVP

### Out of Scope for the MVP

- React Native application
- Complex administration interface
- User registration and authentication
- Comments, likes, and follows
- Community features for visitors
- Multi-server operation
- Google AdSense advertising at launch

### Core Principle

> Prioritize clarity over visual extravagance, and demonstrate the reasoning and results behind technical choices rather than merely showing that a technology was used.

---

## 2. Detailed Project Direction

### 2.1 Project Purpose

The primary purpose of this project is not to build a large service, but to introduce the developer effectively.

Visitors should be able to answer the following questions quickly:

- What kind of developer is this person?
- Which technologies can they use?
- What real-world project experience do they have?
- How do they analyze and solve problems?
- To what extent do they consider frontend quality?
- How can someone collaborate with or contact them?

The technical goal is to gain and demonstrate practical experience with the following areas using Next.js:

- Choosing between static and dynamic rendering
- Search engine optimization
- Content caching and revalidation
- Performance optimization
- Accessibility
- Responsive UI implementation
- Docker-based deployment
- Domain operations with Cloudflare

---

## 3. Target Audience

### 3.1 Expected Visitors

- Recruiters and hiring managers
- Professional developers
- Potential project collaborators
- Prospective freelance clients
- Developers who discover technical articles through search engines

### 3.2 Primary Visitor Actions

- Read the developer introduction
- Review technical skills and experience
- Explore featured projects
- Understand the developer's problem-solving process
- Read technical articles and development retrospectives
- Visit external profiles such as GitHub
- Make contact through email or a contact form

---

## 4. MVP Information Architecture

### 4.1 Home

The home page should establish a strong first impression and communicate the most important information.

Content:

- A one-sentence developer introduction
- Primary area of expertise and technical interests
- Two to three featured projects
- Recent development articles
- Calls to action leading to projects and contact information
- Links to GitHub and other external profiles

The hero section should focus on one strong visual interaction. Avoid excessive 3D effects, autoplaying experiences, and long intro sequences.

### 4.2 About

The About page should explain the developer's background and approach to work.

Content:

- Personal introduction
- How the developer began their career in development
- Areas of interest
- Problem-solving approach
- Important principles for collaboration
- Technologies currently being studied
- Future development direction

Technical information and personal context should be balanced without turning the page into an overly long chronological biography.

### 4.3 Skills

Do not present skills as a collection of technology logos. Provide evidence of practical experience.

Examples:

- React: Component design and state management experience
- Next.js: Practical application of static and dynamic rendering, metadata, and caching
- TypeScript: Domain type design and compile-time error prevention
- PostgreSQL: Content schema design in a later project phase
- Docker: Standardization of development and production environments
- Cloudflare: DNS, HTTPS, and protection of private administrative areas

Avoid arbitrary percentages, star ratings, or similar proficiency indicators. Link each skill to a concrete implementation or project example.

### 4.4 Projects

Featured projects should be available as cards and detailed case-study pages.

Each project page should follow this structure:

1. Project overview
2. Project objective
3. Responsibilities
4. Technologies used
5. Problems that needed to be solved
6. Alternatives considered
7. Final decision and reasoning
8. Implementation process
9. Trials and errors
10. Results and validation
11. Limitations
12. Future improvements
13. GitHub repository or live deployment link

Prioritize two or three detailed case studies over a large number of shallow project entries.

### 4.5 Retrospectives

This section should focus on development experience, mistakes, and lessons learned.

Recommended topics:

- Revising an unsuitable technology choice
- Discovering and resolving a performance issue
- Problems encountered during deployment
- Cache invalidation issues
- Responsive design challenges
- Lessons learned from collaboration
- Architectural decisions that would be reconsidered

Use a clear label such as `Development Retrospectives`, `Problem-Solving Notes`, or `Troubleshooting`.

### 4.6 Blog

The blog should provide technical articles and project records.

MVP functionality:

- Article listing
- Article detail page
- Publication and modification dates
- Categories or tags
- Previous and next article navigation
- Links to related projects
- Open Graph metadata for sharing

Search, comments, likes, and bookmarks are excluded from the initial MVP.

### 4.7 Contact

Provide the following information:

- Email
- GitHub
- LinkedIn or other professional profiles
- A short note explaining how to get in touch

If a contact form is implemented, validate all input again on the server and consider spam protection, rate limiting, and whether personal information will be stored. An email link alone is sufficient for the MVP.

---

## 5. Rendering Strategy

### 5.1 General Principle

Do not apply server-side rendering to every page. Select a rendering strategy based on the data update frequency and whether the content varies by user.

| Page | Strategy | Reason |
|---|---|---|
| Home | Static rendering | Public information with infrequent changes |
| About | Static rendering | Infrequently updated content |
| Skills | Static rendering | Public and mostly stable content |
| Project listing | Static rendering or long-term caching | Infrequently updated content |
| Project detail | Static generation | Suitable for fast responses and search visibility |
| Blog listing | Static generation with revalidation | Must reflect newly published articles |
| Blog article | Static generation with revalidation | Reading performance and search visibility are important |
| Admin and draft preview | Dynamic rendering | Requires authentication and up-to-date data |
| Contact submission | Server-side processing | Requires secret protection and input validation |

### 5.2 Learning Objectives

After applying each rendering strategy, the developer should be able to explain:

- When is the HTML generated?
- When is the data fetched?
- When are changes reflected for visitors?
- Which data is cached?
- How long is stale data acceptable?
- Under what conditions is the cache refreshed?
- Why was this rendering strategy selected for the page?

Documenting this decision-making process is more valuable than simply stating that SSR or SSG was implemented.

---

## 6. Content Management Strategy

### 6.1 MVP

Manage initial content with MDX or structured local files.

Benefits:

- Enables a fast start without a database or administrative interface
- Allows content history to be managed through Git
- Works well with static generation
- Keeps the focus on project descriptions and technical writing
- Reduces operational complexity and potential failures

### 6.2 After the MVP

Introduce PostgreSQL and an API when publishing frequency increases or content must be shared with a mobile application.

Adoption criteria:

- Content needs to be created and edited in a browser
- Drafts and publication states need to be managed
- The React Native app must consume the same content
- Dynamic functionality such as views, search, or tags is required
- Content needs to be managed across multiple devices

PostgreSQL and a REST API should be treated as later-stage extensions introduced in response to actual requirements, not mandatory starting components.

---

## 7. SEO Plan

### 7.1 Technical SEO

- Unique title and description for each page
- Dynamic metadata for projects and articles
- Canonical URLs
- `robots.txt`
- `sitemap.xml`
- Open Graph images
- Social sharing metadata
- Correct 404 responses
- Meaningful URL structure
- Mobile-friendly design
- Image optimization
- Internal linking

Recommended URL structure:

```text
/
/about
/projects
/projects/{project-slug}
/blog
/blog/{post-slug}
/contact
```

### 7.2 Structured Data

- About page: `Person`
- Blog article: `Article` or `BlogPosting`
- General website information: `WebSite`
- Navigation hierarchy where appropriate: `BreadcrumbList`

Structured data must match the information visible on the corresponding page.

### 7.3 Content SEO

Search visibility depends more on useful, searchable content than metadata alone.

Articles should include:

- The problem encountered
- Development environment
- Root-cause analysis
- Approaches that failed
- Final solution
- Results
- A concise guide for readers facing the same problem

Use titles that describe an actual problem rather than vague topics.

Examples:

- `My Experience Learning Next.js`
- `Why a Blog Cache Failed to Refresh in the Next.js App Router`
- `Resolving Next.js Image Optimization Failures in Docker`
- `A Cache Conflict Between Cloudflare and Next.js`

---

## 8. Design and Frontend Presentation

### 8.1 Design Objective

Balance visual impact with usability.

Potential areas for visual interaction:

- Primary hero interaction
- Project card transitions
- Smooth page navigation
- Content reveals during scrolling
- Visualization of project processes

### 8.2 Considerations

- Animations must not obstruct access to content
- Do not force identical effects on mobile devices
- Ensure reliable behavior on lower-performance devices
- Respect the `prefers-reduced-motion` setting
- Ensure primary features are accessible using only a keyboard
- Verify text contrast and visible focus states
- Prevent decorative JavaScript from excessively increasing initial load time

Use visually elaborate implementations only when they serve a clear user-facing purpose.

---

## 9. Deployment and Infrastructure

### 9.1 MVP Deployment Architecture

```text
Visitor
  -> Cloudflare DNS and HTTPS
  -> Web server or reverse proxy
  -> Docker Compose
  -> Next.js application
```

Begin with a single Next.js instance.

### 9.2 Cloudflare Zero Trust

Do not place the public portfolio or blog behind authentication because search engine crawlers may be unable to access the pages.

Potential Zero Trust targets:

- Administration interface
- Private previews
- Internal monitoring
- Database administration tools
- Development-only services

### 9.3 Caching Considerations

Using Cloudflare with Next.js can introduce multiple caching layers.

```text
Browser cache
  -> Cloudflare CDN cache
  -> Next.js server cache
  -> Database
```

Apply and verify Next.js caching first. Add Cloudflare HTML caching afterward.

Refreshing the Next.js cache does not necessarily prevent Cloudflare from serving an older HTML response. Cache policies and invalidation methods must therefore be managed separately for each layer.

---

## 10. MVP Definition of Done

The MVP is complete when all of the following conditions are satisfied.

### Content

- Developer introduction is complete
- At least two featured projects are published
- Every featured project includes a problem-solving process
- At least three retrospectives or technical articles are published
- Contact information and external profiles are connected

### Functionality

- All primary pages are implemented
- Dynamic routes for projects and blog articles are implemented
- Mobile, tablet, and desktop layouts are supported
- Unknown routes produce a correct 404 response
- Basic error states are implemented

### SEO

- Page-specific metadata is present
- Sitemap and robots configuration are complete
- Open Graph images are provided
- Canonical URLs are configured
- Structured data is validated
- Google Search Console is connected
- Public pages are verified as indexable

### Quality

- Keyboard navigation works
- Images provide alternative text
- Mobile readability is verified
- Performance is measured for primary pages
- The production environment is checked for errors
- Reduced-motion preferences are supported

### Deployment

- A Docker image can be built
- The application runs through Docker Compose
- The production domain is connected
- HTTPS is enabled
- Public pages are not blocked by Zero Trust
- Page refreshes and direct URL access work in production

---

## 11. Post-MVP Roadmap

### Update 1: Improve Content Quality

The goal is to make the portfolio more convincing.

- Add more project case studies
- Publish more retrospectives and troubleshooting articles
- Improve project screenshots and process materials
- Add measurable outcomes and performance results
- Rewrite explanations that are difficult for visitors to understand

Prioritize content quality over new functionality.

### Update 2: Database and Content API

Introduce PostgreSQL and an API when content-management requirements emerge.

Potential functionality:

- Article storage
- Draft and publication states
- Categories and tags
- Project management
- Creation and modification timestamps
- Public API
- Admin-only editing features

Avoid migrating all MDX content at once. Verify that existing URLs and SEO information remain intact throughout the migration.

### Update 3: Administration Features

- Administrator authentication
- Article creation and editing
- Preview functionality
- Publishing and unpublishing
- Image upload
- Cache revalidation
- Change history

Protect the administration interface with Cloudflare Zero Trust or application-level authentication.

### Update 4: Advanced Caching

- Cache tags per article
- Blog listing revalidation after publication
- Article cache revalidation after editing
- Integration between Next.js and Cloudflare cache invalidation
- Performance measurements before and after caching
- A documented response process for cache inconsistencies

Design caching around the balance between performance and data freshness.

### Update 5: Analytics and Operational Improvements

- Analyze Google Search Console performance
- Review incoming search queries
- Identify page exit points
- Monitor application errors
- Track performance over time
- Analyze frequently viewed articles and projects
- Use privacy-conscious visitor analytics

Use these findings to improve titles, content structure, and internal links.

### Update 6: Evaluate a React Native App

Begin React Native development only when one or more of the following conditions are met:

- A mobile-specific feature provides clear value
- Offline article storage is required
- New-article notifications are required
- The project expands into a personal development-record tool
- A stable shared API is available
- Real users request a mobile application

Defer development if the app would only reproduce the portfolio website.

### Update 7: Evaluate Advertising

Consider AdSense only after the site has accumulated sufficient content and traffic.

Principles:

- Do not place advertisements on the Home, About, or Projects pages
- Limit advertisements to blog article pages
- Clearly distinguish advertisements from content
- Measure the effect on performance and user experience
- Review privacy policy and consent requirements
- Prioritize portfolio credibility over revenue

---

## 12. Development Sequence

### Phase 1: Planning and Content Preparation

- Confirm the website's purpose
- Define target visitors
- Finalize the page structure
- Select featured projects
- Draft the introduction and project content
- Choose a visual direction and design references

### Phase 2: Core Web Implementation

- Configure the Next.js project
- Build the shared layout
- Implement navigation and footer
- Implement responsive design
- Build the Home, About, and Projects pages
- Apply baseline accessibility practices

### Phase 3: Content System

- Design the MDX or local content structure
- Implement project listing and detail pages
- Implement blog listing and article pages
- Add categories and tags
- Implement 404 and error handling

### Phase 4: Rendering and Caching

- Verify static rendering
- Implement a dynamic-page exercise
- Add blog revalidation
- Test cache refresh scenarios
- Compare response behavior before and after caching

### Phase 5: SEO and Quality Assurance

- Add metadata
- Add sitemap and robots configuration
- Add Open Graph assets
- Add structured data
- Run Lighthouse checks
- Test mobile layouts, keyboard navigation, and reduced motion

### Phase 6: Deployment

- Configure Docker
- Run the application with Docker Compose
- Connect the domain
- Configure Cloudflare DNS and HTTPS
- Verify the production environment
- Register the website with Google Search Console

### Phase 7: Project Retrospective

- Document the reasons behind technical choices
- Record problems encountered
- Explain failed approaches
- Explain the final solutions
- Include performance measurements
- Identify future improvements

---

## 13. Critical Considerations

### Scope Expansion

The greatest risk is turning the portfolio into a CMS, community platform, and mobile application at the same time.

A proposed feature should be added only if it passes the following questions:

- Is it necessary for visitors to understand the developer?
- Does it help demonstrate a core capability?
- Is it important enough to delay the MVP release?
- Does a real requirement currently exist?

If any answer is unclear, defer the feature until after the MVP.

### Technology for Its Own Sake

Do not introduce SSR, a database, state-management libraries, or microservices where they are unnecessary. Appropriate technical choices are more valuable than the number of technologies used.

### Insufficient Content

A visually complete site still has limited value if project explanations and technical articles are missing. Content writing and development should proceed together.

### Excessive Animation

Visual effects must remain within performance, readability, and accessibility constraints. Always test mobile devices and reduced-motion environments.

### SEO Expectations

Adding a sitemap and metadata does not guarantee immediate high rankings. Search visibility grows through concrete content, consistent publishing, internal linking, and accumulated site credibility.

### Cache Complexity

Before introducing caching, define the source of truth, update timing, and acceptable stale period. Do not introduce Next.js caching and Cloudflare caching simultaneously.

### Describing Experience

Do not present unverified technologies as established expertise. Describe them as practical experience only after implementation, testing, production operation, and retrospective analysis.

---

## 14. Final Project Direction

This project should be more than a profile page. It should demonstrate three capabilities at the same time:

1. Real development experience and problem-solving ability
2. High-quality frontend implementation
3. The ability to evaluate and validate rendering, SEO, caching, and deployment decisions

The final message should be:

> A developer who can deliver complete web products by considering not only visual quality and user experience, but also performance, search visibility, accessibility, and production operations.
