'use strict';

const pagination = require('hexo-pagination');

// Override the default category generator (hexo-generator-category) to support
// chapter-based ordering. Scripts in scripts/ load AFTER plugins, so this
// generator's output for the same routes wins over the default one.

hexo.extend.generator.register('category', function (locals) {
  const config = this.config;
  const perPage = config.category_generator.per_page;
  const paginationDir = config.pagination_dir || 'page';

  return locals.categories.reduce((result, category) => {
    if (!category.length) return result;

    const posts = category.posts.sort('date');

    if (posts.data.some(p => p.chapter !== undefined)) {
      posts.data.sort((a, b) => {
        const ca = a.chapter;
        const cb = b.chapter;

        if (ca !== undefined && cb !== undefined) return ca - cb;
        if (ca !== undefined) return -1;
        if (cb !== undefined) return 1;

        return b.date - a.date;
      });
    }

    const data = pagination(category.path, posts, {
      perPage,
      layout: ['category', 'archive', 'index'],
      format: paginationDir + '/%d/',
      data: {
        category: category.name,
      },
    });

    return result.concat(data);
  }, []);
});
