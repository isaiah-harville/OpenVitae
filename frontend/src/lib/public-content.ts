export function showPublications(count: number): boolean {
  return count > 0;
}

export function showBlog(enabled: boolean, publishedCount: number): boolean {
  return enabled && publishedCount > 0;
}
