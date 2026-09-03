import Markdown from "react-markdown";

import { resolveBodyLink } from "../../domain/markdown/body-link";
import { detailMarkdownPlugins } from "../../infrastructure/markdown/detail-markdown";

/** Content-specific parsing is an outer adapter, shared with the import boundary. */
export function DetailMarkdown({ body }: Readonly<{ body: string }>) {
  return (
    <div className="content-markdown">
      <Markdown
        remarkPlugins={detailMarkdownPlugins}
        skipHtml
        urlTransform={(url) => resolveBodyLink(url)?.href ?? ""}
        components={{
          img: ({ alt, src, title }) => {
            if (!src) return <span>{alt || "Image unavailable."}</span>;
            // Preserve baseline images until DEV-09B supplies validated media;
            // rejected destinations must never cause an empty-source request.
            // eslint-disable-next-line @next/next/no-img-element
            return <img alt={alt ?? ""} src={src} title={title} />;
          },
          a: ({ children, href }) => {
            const link = resolveBodyLink(href ?? "");
            if (!link) return <span>{children}</span>;
            return (
              <a
                href={link.href}
                rel={link.external ? "noopener noreferrer" : undefined}
                target={link.external ? "_blank" : undefined}
              >
                {children}
                {link.external ? (
                  <span className="sr-only"> (opens in a new tab)</span>
                ) : null}
              </a>
            );
          },
        }}
      >
        {body}
      </Markdown>
    </div>
  );
}
