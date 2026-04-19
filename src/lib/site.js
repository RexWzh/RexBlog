export const site = {
  title: 'AI \u8bd5\u70bc\u573a',
  description: '记录模型产出、实验过程与协作结果。',
  author: 'Rex',
  language: 'zh-Hans',
  url: 'http://www.wzhecnu.cn',
  navigation: [
    { href: '/', label: '首页' },
    { href: '/archives/', label: '归档' },
    { href: '/tags/', label: '标签' },
    { href: '/about/', label: '关于' }
  ]
};

function pad(value) {
  return String(value).padStart(2, '0');
}

export function sortPosts(posts) {
  return [...posts].sort((left, right) => right.data.date.valueOf() - left.data.date.valueOf());
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

export function formatLongDate(date) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

export function getPostPermalink(post) {
  if (post.data.permalink) {
    return post.data.permalink;
  }

  const { date } = post.data;
  return `/${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())}/${post.slug}/`;
}

export function getTagPermalink(tag) {
  return `/tags/${encodeURIComponent(tag)}/`;
}

export function getTagMap(posts) {
  const tagMap = new Map();

  for (const post of posts) {
    for (const tag of post.data.tags ?? []) {
      if (!tagMap.has(tag)) {
        tagMap.set(tag, []);
      }
      tagMap.get(tag).push(post);
    }
  }

  return new Map(
    [...tagMap.entries()]
      .sort((left, right) => left[0].localeCompare(right[0], 'zh-Hans'))
      .map(([tag, tagPosts]) => [tag, sortPosts(tagPosts)])
  );
}

export function getArchiveGroups(posts) {
  const groups = new Map();

  for (const post of sortPosts(posts)) {
    const year = String(post.data.date.getFullYear());
    if (!groups.has(year)) {
      groups.set(year, []);
    }
    groups.get(year).push(post);
  }

  return [...groups.entries()].map(([year, yearPosts]) => ({ year, posts: yearPosts }));
}
