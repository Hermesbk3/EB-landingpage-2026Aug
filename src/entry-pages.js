import { FEATURES, MARKETPLACES } from '#site-config';

const pages = [
  { kind: 'hub', section: 'marketplaces', path: '/marketplaces/' },
  { kind: 'hub', section: 'features', path: '/features/' },
  { kind: 'hub', section: 'api', path: '/api/' },
];

Object.entries(MARKETPLACES).forEach(([marketplaceKey, marketplace]) => {
  pages.push({
    kind: 'marketplace',
    marketplaceKey,
    path: `/marketplaces/${marketplace.slug}/`,
  });

  marketplace.productRegions.forEach((regionKey) => {
    pages.push({
      kind: 'marketplace-region',
      marketplaceKey,
      regionKey,
      path: `/marketplaces/${marketplace.slug}/${regionKey}/`,
    });
  });
});

Object.entries(FEATURES).forEach(([featureKey, feature]) => {
  pages.push({
    kind: 'feature',
    featureKey,
    path: `/features/${feature.slug}/`,
  });
});

Object.entries(MARKETPLACES).forEach(([marketplaceKey, marketplace]) => {
  pages.push({
    kind: 'api-marketplace',
    marketplaceKey,
    path: `/api/${marketplace.slug}/`,
  });

  marketplace.apiRegions.forEach((regionKey) => {
    pages.push({
      kind: 'api-region',
      marketplaceKey,
      regionKey,
      path: `/api/${marketplace.slug}/${regionKey}/`,
    });
  });
});

if (pages.length !== 65) {
  throw new Error(`Expected 65 entry-page concepts, received ${pages.length}.`);
}

export const ENTRY_PAGES = pages;

export function findEntryPage(path) {
  const normalizedPath = path.endsWith('/') ? path : `${path}/`;
  return ENTRY_PAGES.find((page) => page.path === normalizedPath);
}
