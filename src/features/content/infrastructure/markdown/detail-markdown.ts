import type { Nodes, Parent, Root } from "mdast";
import remarkDirective from "remark-directive";
import remarkParse from "remark-parse";
import { unified, type Plugin } from "unified";

import { resolveBodyLink } from "../../domain/markdown/body-link";

export type DetailMarkdownIssue = Readonly<{
  rule: "html" | "directive" | "link";
  line: number;
  column: number;
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
function controlTree(tree: Root, source: string): DetailMarkdownIssue[] {
  const issues: DetailMarkdownIssue[] = [];
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

  walk(tree, (node) => {
    // Definitions include destinations used by reference links and images.
    if (
      node.type !== "link" &&
      node.type !== "definition" &&
      node.type !== "image"
    ) {
      return;
    }
    const link = resolveBodyLink(node.url, targets);
    if (!link) report(node, "link");
    node.url = link?.href ?? "";
  });
  return issues;
}

const parser = unified().use(remarkParse).use(remarkDirective);

export function inspectDetailMarkdown(body: string): DetailMarkdownIssue[] {
  return controlTree(parser.parse(body), body);
}

const remarkControlledDetail: Plugin<[], Root> = () => {
  return (tree, file) => {
    controlTree(tree, String(file.value));
  };
};

export const detailMarkdownPlugins = [remarkDirective, remarkControlledDetail];
