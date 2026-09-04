import Markdown from "react-markdown";

import { resolveBodyLink } from "../../domain/markdown/body-link";
import { resolveDetailMedia } from "../../infrastructure/markdown/detail-media";
import { detailMarkdownPlugins } from "../../infrastructure/markdown/detail-markdown";
import { ControlledGif } from "./controlled-gif";

/* eslint-disable @next/next/no-img-element -- Reviewed local content media needs stable public paths and intrinsic dimensions without an optimizer boundary. */

/** Content-specific parsing is an outer adapter, shared with the import boundary. */
export function DetailMarkdown({
  body,
  contentSlug,
  mediaRoot,
}: Readonly<{ body: string; contentSlug: string; mediaRoot?: string }>) {
  return (
    <div className="content-markdown">
      <Markdown
        remarkPlugins={detailMarkdownPlugins({ contentSlug, mediaRoot })}
        skipHtml
        urlTransform={(url) => resolveBodyLink(url)?.href ?? ""}
        components={{
          img: ({ alt, src, title }) => {
            const result =
              typeof src === "string"
                ? resolveDetailMedia(src, alt, { contentSlug, mediaRoot })
                : null;
            if (!result?.ok) {
              const alternativeText = alt?.trim() || "Image unavailable.";
              return (
                <span
                  aria-label={alternativeText}
                  className="content-media__fallback"
                  role="img"
                >
                  Image unavailable: {alternativeText}
                </span>
              );
            }
            if (result.media.kind === "gif" && result.media.posterPath) {
              return (
                <ControlledGif
                  alternativeText={alt!.trim()}
                  animationPath={result.media.sourcePath}
                  height={result.media.height}
                  posterPath={result.media.posterPath}
                  title={title}
                  width={result.media.width}
                />
              );
            }
            return (
              <span className="content-media content-media--still">
                <img
                  alt={alt!.trim()}
                  decoding="async"
                  height={result.media.height}
                  loading="lazy"
                  src={result.media.sourcePath}
                  title={title}
                  width={result.media.width}
                />
              </span>
            );
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
