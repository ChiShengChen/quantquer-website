import { access, readFile, writeFile } from 'node:fs/promises';
import { offeringRoutes } from '../data/studio-offerings.mjs';
import { studioDemoRoutes } from '../data/studio-demos.mjs';
import { labsRoutes } from './build-vnext-labs.mjs';
import { escapeHtml, origin, studioPath } from './vnext-layout.mjs';

const file = new URL('../sitemap.xml', import.meta.url);
const portfolio = JSON.parse(await readFile(new URL('../data/projects.json', import.meta.url), 'utf8'));
const date = portfolio.siteUpdated;
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Invalid siteUpdated date in data/projects.json');
const legacyRoutes = [
  '/semiconductor-ai/', '/financial-intelligence/', '/labs/interactive/', '/project-planner/',
  '/labs/evidence/vision/', '/labs/evidence/photonics/', '/labs/evidence/gpu/', '/labs/evidence/research/',
];
const pairs = ['/', '/work/', '/contact/', ...offeringRoutes, ...studioDemoRoutes, ...labsRoutes,
  ...portfolio.projects.map(project => `/work/${project.slug}/`),
];
if (new Set(pairs).size !== pairs.length) throw new Error('Sitemap contains duplicate routes');
const projectDates = new Map(portfolio.projects.map(project => [`/work/${project.slug}/`, project.updated ?? date]));
const alternate = (route, language, locale = language) => `<xhtml:link rel="alternate" hreflang="${language}" href="${origin}${studioPath(route, locale)}"/>`;
const urls = [];
for (const route of legacyRoutes) urls.push({ path: route, lastmod: date, alternates: [] });
for (const route of pairs) {
  const alternates = [alternate(route, 'zh-Hant', 'zh'), alternate(route, 'en'), alternate(route, 'x-default', 'zh')];
  for (const locale of ['zh', 'en']) urls.push({ path: studioPath(route, locale), lastmod: projectDates.get(route) ?? date, alternates });
}
await Promise.all(urls.map(({ path }) => access(new URL(`../${path.slice(1)}index.html`, import.meta.url))));
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.map(({ path, lastmod, alternates }) => `  <url><loc>${escapeHtml(origin + path)}</loc><lastmod>${lastmod}</lastmod>${alternates.join('')}</url>`).join('\n')}
</urlset>
`;
if (process.argv.includes('--check')) {
  if (await readFile(file, 'utf8') !== sitemap) throw new Error('Outdated sitemap.xml');
} else await writeFile(file, sitemap);
console.log(`${process.argv.includes('--check') ? 'Verified' : 'Generated'} ${urls.length} sitemap routes.`);
