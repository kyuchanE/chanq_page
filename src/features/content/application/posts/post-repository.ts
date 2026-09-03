import type {
  PostKind,
  PostSlug,
  PublishedPostDetail,
  PublishedPostListItem,
} from "@/features/content/domain/posts/post";

export type PostRepositoryErrorCode = "invalid-data" | "unavailable";

export class PostRepositoryError extends Error {
  readonly code: PostRepositoryErrorCode;

  constructor(
    code: PostRepositoryErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "PostRepositoryError";
    this.code = code;
  }
}

export interface PostRepository {
  findPublishedBySlug(
    kind: PostKind,
    slug: PostSlug,
  ): Promise<PublishedPostDetail | null>;
  listPublished(kind: PostKind): Promise<readonly PublishedPostListItem[]>;
}
