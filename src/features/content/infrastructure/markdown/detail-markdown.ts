import type { Nodes, Parent, Root } from "mdast";
import remarkDirective from "remark-directive";
import remarkParse from "remark-parse";
import { unified, type Plugin } from "unified";

import { resolveBodyLink } from "../../domain/markdown/body-link";
import {
  DETAIL_MEDIA_BUDGETS,
  resolveDetailMedia,
  type DetailMediaAsset,
  type ResolvedDetailMedia,
} from "./detail-media";

export type DetailMarkdownIssue = Readonly<{
  rule: "html" | "directive" | "link" | "media" | "media-budget";
  line: number;
  column: number;
}>;

export type DetailMarkdownOptions = Readonly<{
  contentSlug?: string;
  mediaRoot?: string;
}>;

export type DetailMarkdownAnalysis = Readonly<{
  issues: readonly DetailMarkdownIssue[];
  media: readonly ResolvedDetailMedia[];
  uniqueAssets: readonly DetailMediaAsset[];
  uniqueAssetBytes: number;
}>;

function plainText(node: Nodes): string {
  if (node.type === "html") return "";
  if ("value" in node) return node.value;
  if ("alt" in node) return node.alt ?? "";
  return "children" in node ? node.children.map(plainText).join("") : "";
}

function isUnderlineChild(node: Nodes): boolean {
  return (
    node.type === "text" ||
    node.type === "inlineCode" ||
    ((node.type === "strong" || node.type === "emphasis") &&
      node.children.every(isUnderlineChild))
  );
}

function walk(node: Nodes, visit: (node: Nodes) => void) {
  visit(node);
  if ("children" in node) node.children.forEach((child) => walk(child, visit));
}

/** Both import inspection and public rendering run this same tree policy. */
function controlTree(
  tree: Root,
  source: string,
  options: DetailMarkdownOptions,
): DetailMarkdownAnalysis {
  const issues: DetailMarkdownIssue[] = [];
  const media: ResolvedDetailMedia[] = [];
  const uniqueAssets = new Map<string, DetailMediaAsset>();
  const report = (node: Nodes, rule: DetailMarkdownIssue["rule"]) => {
    issues.push({
      rule,
      line: node.position?.start.line ?? 1,
      column: node.position?.start.column ?? 1,
    });
  };

  function controlSyntax(parent: Parent) {
    parent.children.forEach((node, index) => {
      if (node.type === "html") report(node, "html");
      if (
        node.type === "textDirective" ||
        node.type === "leafDirective" ||
        node.type === "containerDirective"
      ) {
        const valid =
          node.type === "textDirective" &&
          node.name === "underline" &&
          Object.keys(node.attributes ?? {}).length === 0 &&
          source
            .slice(node.position?.start.offset, node.position?.end.offset)
            .endsWith("]") &&
          plainText(node).trim().length > 0 &&
          node.children.every(isUnderlineChild);
        if (!valid) {
          report(node, "directive");
          const text = {
            type: "text" as const,
            value:
              plainText(node) ||
              source.slice(
                node.position?.start.offset,
                node.position?.end.offset,
              ),
          };
          parent.children[index] =
            node.type === "textDirective"
              ? text
              : { type: "paragraph", children: [text] };
          return;
        }
        node.data = {
          hName: "span",
          hProperties: { className: ["content-underline"] },
        };
      }
      if ("children" in node) controlSyntax(node);
    });
  }
  controlSyntax(tree);

  const targets = new Set<string>();
  walk(tree, (node) => {
    if (node.type !== "heading") return;
    const label = plainText(node)
      .normalize("NFKC")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-|-$/g, "");
    const base = `content-${label || "section"}`;
    let id = base;
    for (let suffix = 2; targets.has(id); suffix++) id = `${base}-${suffix}`;
    targets.add(id);
    node.depth = node.depth === 1 ? 2 : node.depth;
    node.data = { hProperties: { id } };
  });

  const definitions = new Map<string, Extract<Nodes, { type: "definition" }>>();
  walk(tree, (node) => {
    if (node.type === "definition") {
      definitions.set(node.identifier.toLowerCase(), node);
    }
  });
  const imageDefinitions = new Set<Extract<Nodes, { type: "definition" }>>();
  let lastMediaNode: Nodes | undefined;
  walk(tree, (node) => {
    if (node.type !== "image" && node.type !== "imageReference") return;
    const definition =
      node.type === "imageReference"
        ? definitions.get(node.identifier.toLowerCase())
        : undefined;
    if (definition) imageDefinitions.add(definition);
    const sourcePath = node.type === "image" ? node.url : definition?.url;
    const result =
      sourcePath && options.contentSlug
        ? resolveDetailMedia(sourcePath, node.alt ?? undefined, {
            contentSlug: options.contentSlug,
            mediaRoot: options.mediaRoot,
          })
        : { ok: false as const, reason: "path" as const };
    if (!result.ok) {
      report(node, "media");
      if (node.type === "image") node.url = "";
      if (definition) definition.url = "";
      return;
    }
    lastMediaNode = node;
    media.push(result.media);
    for (const asset of result.media.assets)
      uniqueAssets.set(asset.path, asset);
  });

  const uniqueAssetBytes = [...uniqueAssets.values()].reduce(
    (total, asset) => total + asset.bytes,
    0,
  );
  if (lastMediaNode && uniqueAssetBytes > DETAIL_MEDIA_BUDGETS.bodyBytes) {
    report(lastMediaNode, "media-budget");
    walk(tree, (node) => {
      if (node.type === "image") node.url = "";
      if (node.type === "imageReference") {
        const definition = definitions.get(node.identifier.toLowerCase());
        if (definition) definition.url = "";
      }
    });
  }

  walk(tree, (node) => {
    // Definitions include destinations used by reference links.
    if (node.type !== "link" && node.type !== "definition") {
      return;
    }
    if (node.type === "definition" && imageDefinitions.has(node)) return;
    const link = resolveBodyLink(node.url, targets);
    if (!link) report(node, "link");
    node.url = link?.href ?? "";
  });
  return {
    issues,
    media,
    uniqueAssets: [...uniqueAssets.values()],
    uniqueAssetBytes,
  };
}

const parser = unified().use(remarkParse).use(remarkDirective);

export function analyzeDetailMarkdown(
  body: string,
  options: DetailMarkdownOptions = {},
): DetailMarkdownAnalysis {
  return controlTree(parser.parse(body), body, options);
}

export function inspectDetailMarkdown(
  body: string,
  options: DetailMarkdownOptions = {},
): readonly DetailMarkdownIssue[] {
  return analyzeDetailMarkdown(body, options).issues;
}

function controlledDetailPlugin(
  options: DetailMarkdownOptions,
): Plugin<[], Root> {
  return () => (tree, file) => {
    controlTree(tree, String(file.value), options);
  };
}

export function detailMarkdownPlugins(options: DetailMarkdownOptions) {
  return [remarkDirective, controlledDetailPlugin(options)];
}
