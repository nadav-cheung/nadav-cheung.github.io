'use strict';

/**
 * Sort posts with a `chapter` front-matter field by chapter order (ascending).
 * Posts without a chapter field retain default date-based ordering.
 *
 * This ensures book chapters always appear in reading order on index/category/tag pages.
 */

hexo.extend.filter.register('before_generate', function () {
  const posts = hexo.locals.get('posts');
  if (!posts || !posts.data) return;

  posts.data.sort((a, b) => {
    const ca = a.chapter;
    const cb = b.chapter;

    // Both have chapter → sort by chapter ascending (reading order)
    if (ca && cb) return ca - cb;

    // One has chapter, one doesn't → chapter posts come after non-chapter posts
    if (ca && !cb) return 1;
    if (!ca && cb) return -1;

    // Neither has chapter → default date-descending
    return b.date - a.date;
  });
});
