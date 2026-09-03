export type BodyLink = Readonly<{
  href: string;
  external: boolean;
}>;

function classifyDestination(value: string): BodyLink | null {
  if (
    !value ||
    value !== value.trim() ||
    /[\\\p{Cc}\p{Cf}]/u.test(value) ||
    value.startsWith("//") ||
    value
      .split(/[?#]/, 1)[0]
      .split("/")
      .some((segment) => segment === "." || segment === "..")
  ) {
    return null;
  }

  if (value.startsWith("#")) {
    return value.length > 1 ? { href: value, external: false } : null;
  }

  try {
    if (value.startsWith("/")) {
      const url = new URL(value, "https://content.invalid");
      if (url.origin !== "https://content.invalid") return null;
      return {
        href: `${url.pathname}${url.search}${url.hash}`,
        external: false,
      };
    }

    // URL alone accepts abbreviated schemes and removes traversal/controls.
    // Check the authored form before accepting its normalized representation.
    if (!/^https?:\/\//i.test(value)) return null;
    const authority = value.split(/[/?#]/)[2];
    if (!authority || authority.includes("@")) return null;
    const url = new URL(value);
    if (url.username || url.password) return null;
    return { href: url.href, external: true };
  } catch {
    return null;
  }
}

/** Input is already CommonMark-decoded; inspect every percent-encoding layer. */
export function resolveBodyLink(
  destination: string,
  fragmentTargets?: ReadonlySet<string>,
): BodyLink | null {
  const original = classifyDestination(destination);
  if (!original) return null;

  let decoded = destination;
  for (let depth = 0; depth < 8; depth++) {
    if (!classifyDestination(decoded)) return null;
    if (!decoded.includes("%")) {
      if (
        decoded.startsWith("#") &&
        fragmentTargets &&
        !fragmentTargets.has(decoded.slice(1))
      ) {
        return null;
      }
      return original;
    }
    try {
      decoded = decodeURIComponent(decoded);
    } catch {
      return null;
    }
  }
  // Excessively nested or malformed encoding is not a supported authoring form.
  return null;
}
