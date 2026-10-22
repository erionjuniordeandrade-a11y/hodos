// Sitemap paths are the HTML files the exporter wrote, minus the 404 page.
// A hand list of URLs drifts from that set: /connections shipped in the sitemap
// while the publication gate still expected the old count (60dd8b2).

export function sitemapPathForExport(name) {
  if (typeof name !== 'string' || !name.endsWith('.html') || name === '404.html') return null;
  if (name === 'index.html') return '/';
  if (name === 'lessons.html') return '/lessons';
  return `/${name.slice(0, -'.html'.length)}`;
}

// `names` is export order. Lesson pages stay in that order, which is curriculum
// order, so the sitemap bytes do not move when the set is unchanged.
export function sitemapPathsFromExport(names) {
  const paths = [];
  for (const name of names) {
    const route = sitemapPathForExport(name);
    if (route) paths.push(route);
  }
  return paths;
}

export function sitemapLocs(paths, origin = 'https://hodosatlas.com') {
  return paths.map(route => (route === '/' ? `${origin}/` : `${origin}${route}`));
}
