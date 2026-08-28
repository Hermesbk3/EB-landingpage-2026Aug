import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ENTRY_PAGE_TRANSLATIONS } from '#entry-page-translations';
import { ENTRY_PAGES } from '#entry-pages';
import {
  getCanonicalUrl,
  getLocalizedPath,
  LOCALES,
  MARKETPLACES,
} from '#site-config';

const root = resolve(import.meta.dirname, '..');

Object.entries(ENTRY_PAGE_TRANSLATIONS).forEach(([key, translations]) => {
  assert.deepEqual(
    Object.keys(translations).sort(),
    LOCALES.map((locale) => locale.key).sort(),
    `${key} must contain every entry-page locale.`,
  );
  LOCALES.forEach((locale) => {
    assert.equal(typeof translations[locale.key], 'string');
    assert.ok(
      translations[locale.key].trim(),
      `${key}.${locale.key} must not be empty.`,
    );
  });
});

const southeastAsia = [
  'indonesia',
  'malaysia',
  'philippines',
  'singapore',
  'thailand',
  'vietnam',
];
const expectedMarketplaces = {
  alibaba: ['united-states'],
  amazon: ['united-states'],
  lazada: southeastAsia,
  shopee: southeastAsia,
  temu: ['united-states'],
  'tiktok-shop': [...southeastAsia, 'united-states'],
};
const expectedApiRegions = {
  alibaba: ['united-states'],
  amazon: ['united-states'],
  lazada: southeastAsia,
  shopee: southeastAsia,
  temu: ['united-states'],
  'tiktok-shop': southeastAsia,
};
const expectedFeatures = [
  'market-radar',
  'product-research',
  'category-research',
  'store-research',
  'advanced-filters',
  'data-exports',
  'ai-connectors',
];

const expectedConceptPaths = [
  '/marketplaces/',
  '/features/',
  '/api/',
  ...Object.entries(expectedMarketplaces).flatMap(([marketplace, regions]) => [
    `/marketplaces/${marketplace}/`,
    ...regions.map((region) => `/marketplaces/${marketplace}/${region}/`),
  ]),
  ...expectedFeatures.map((feature) => `/features/${feature}/`),
  ...Object.entries(expectedApiRegions).flatMap(([marketplace, regions]) => [
    `/api/${marketplace}/`,
    ...regions.map((region) => `/api/${marketplace}/${region}/`),
  ]),
].sort();

assert.equal(expectedConceptPaths.length, 65);
assert.deepEqual(
  ENTRY_PAGES.map(({ path }) => path).sort(),
  expectedConceptPaths,
  'Generated entry-page concepts do not match the independent route matrix.',
);

const pageTitles = new Map();
const pageDescriptions = new Map();
let generatedPageCount = 0;

ENTRY_PAGES.forEach((page) => {
  LOCALES.forEach((locale) => {
    const localizedPath = getLocalizedPath(page.path, locale);
    const filePath = resolve(root, 'dist', localizedPath.slice(1), 'index.html');
    assert.ok(existsSync(filePath), `Missing generated page: ${localizedPath}`);
    generatedPageCount += 1;
    const html = readFileSync(filePath, 'utf8');
    const canonical = getCanonicalUrl(page.path, locale);
    const title = html.match(/<title>(.*?)<\/title>/)?.[1];
    const description = html.match(/<meta name="description" content="(.*?)" \/>/)?.[1];

    assert.ok(title?.trim(), `${localizedPath} must have a title.`);
    assert.ok(description?.trim(), `${localizedPath} must have a description.`);
    assert.ok(!pageTitles.has(`${locale.key}:${title}`), `${localizedPath} has a duplicate title.`);
    assert.ok(
      !pageDescriptions.has(`${locale.key}:${description}`),
      `${localizedPath} has a duplicate description.`,
    );
    pageTitles.set(`${locale.key}:${title}`, localizedPath);
    pageDescriptions.set(`${locale.key}:${description}`, localizedPath);

    assert.ok(html.includes(`<html lang="${locale.htmlLanguage}">`));
    assert.ok(html.includes(`<link rel="canonical" href="${canonical}" />`));
    assert.ok(html.includes(`<meta property="og:url" content="${canonical}" />`));
    assert.ok(html.includes(`<meta property="og:title" content="${title}" />`));
    assert.ok(html.includes(`<meta name="twitter:title" content="${title}" />`));
    assert.equal((html.match(/rel="alternate"/g) ?? []).length, 9);
    assert.equal((html.match(/<h1>/g) ?? []).length, 1);
    assert.equal((html.match(/aria-current="page"/g) ?? []).length >= 2, true);
    assert.ok(html.includes(`language=${locale.appLanguage}`));
    assert.ok(!/\{(?:marketplace|region|feature|description|currency|code)\}/.test(html));
    assert.ok(!html.includes('__ECOMBLADE_'));
    assert.ok(!html.includes('undefined'));
    assert.ok(!html.includes("\n+  --header"));

    LOCALES.forEach((alternateLocale) => {
      assert.ok(
        html.includes(`href="${getCanonicalUrl(page.path, alternateLocale)}"`),
        `${localizedPath} is missing ${alternateLocale.key} hreflang.`,
      );
      assert.ok(
        html.includes(`href="${getLocalizedPath(page.path, alternateLocale)}"`),
        `${localizedPath} language menu does not preserve the current concept.`,
      );
    });

    const jsonLdMatch = html.match(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
    );
    assert.ok(jsonLdMatch, `${localizedPath} is missing JSON-LD.`);
    const jsonLd = JSON.parse(jsonLdMatch[1]);
    assert.equal(jsonLd['@graph'][2].url, canonical);
    assert.equal(jsonLd['@graph'][2].inLanguage, locale.htmlLanguage);
    assert.equal(jsonLd['@graph'][3].itemListElement.at(-1).item, canonical);

    const localAssets = [
      ...html.matchAll(/(?:src|href)="(\/(?:assets|fonts)\/[^"?#]+)"/g),
    ].map((match) => match[1]);
    localAssets.forEach((asset) => {
      assert.ok(
        existsSync(resolve(root, 'dist', asset.slice(1))),
        `${localizedPath} references missing asset ${asset}.`,
      );
    });

    const internalLinks = [...html.matchAll(/href="(\/[^"#?]*)"/g)].map(
      (match) => match[1],
    );
    internalLinks
      .filter(
        (link) =>
          !link.startsWith('/assets/') &&
          !link.startsWith('/fonts/') &&
          link !== '/favicon.ico',
      )
      .forEach((link) => {
        const target = link.endsWith('/') ? link : `${link}/`;
        assert.ok(
          existsSync(resolve(root, 'dist', target.slice(1), 'index.html')),
          `${localizedPath} contains unresolved internal link ${link}.`,
        );
      });
  });
});

assert.equal(generatedPageCount, 520);

const sitemap = readFileSync(resolve(root, 'dist', 'sitemap.xml'), 'utf8');
const sitemapLocations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(
  (match) => match[1],
);
assert.equal(sitemapLocations.length, 533);
assert.equal(new Set(sitemapLocations).size, 533);
assert.equal((sitemap.match(/<xhtml:link /g) ?? []).length, 4752);
assert.ok(!sitemap.includes('/api/tiktok-shop/united-states/'));
ENTRY_PAGES.forEach((page) => {
  LOCALES.forEach((locale) => {
    assert.ok(sitemapLocations.includes(getCanonicalUrl(page.path, locale)));
  });
});

const regionalApiMarketplaces = ['lazada', 'shopee', 'tiktok'];
regionalApiMarketplaces.forEach((marketplaceKey) => {
  const marketplace = MARKETPLACES[marketplaceKey];
  marketplace.apiRegions.forEach((regionKey) => {
    const html = readFileSync(
      resolve(root, 'dist', 'api', marketplace.slug, regionKey, 'index.html'),
      'utf8',
    );
    const code = {
      indonesia: 'ID',
      malaysia: 'MY',
      philippines: 'PH',
      singapore: 'SG',
      thailand: 'TH',
      vietnam: 'VN',
    }[regionKey];
    assert.ok(html.includes(`country%3D${code}`) || html.includes(`country=${code}`));
  });
});

['alibaba', 'amazon', 'temu'].forEach((marketplaceKey) => {
  const html = readFileSync(
    resolve(root, 'dist', 'api', marketplaceKey, 'united-states', 'index.html'),
    'utf8',
  );
  const codeBlock = html.match(/<pre><code>([\s\S]*?)<\/code><\/pre>/)?.[1] ?? '';
  assert.ok(!codeBlock.includes('country%3D'));
  assert.ok(!codeBlock.includes('country='));
});

const expectedApiParameters = {
  alibaba: ['query', 'page=1', 'pageSize?', 'categoryId', 'tab?'],
  amazon: ['query', 'page=1', 'sort?', 'categoryId'],
  lazada: ['query', 'country', 'page=1', 'sort?', 'categoryId'],
  shopee: ['query', 'country', 'page=1', 'filters?', 'categoryId', 'categoryLevel=2'],
  temu: ['query', 'page=1', 'sort?', 'categoryId'],
  'tiktok-shop': ['query', 'country', 'page=1', 'sort?', 'categoryId'],
};
Object.entries(expectedApiParameters).forEach(([marketplaceSlug, parameters]) => {
  const html = readFileSync(
    resolve(root, 'dist', 'api', marketplaceSlug, 'index.html'),
    'utf8',
  );
  parameters.forEach((parameter) => {
    assert.ok(
      html.includes(parameter),
      `/api/${marketplaceSlug}/ is missing API parameter ${parameter}.`,
    );
  });
});

console.log('Verified 65 concepts, 520 localized entry pages, 533 sitemap URLs, SEO metadata, structured data, assets, and internal links.');
