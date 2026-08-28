export const SITE_URL = 'https://ecomblade.com';

export const LOCALES = [
  { key: 'en', route: '', htmlLanguage: 'en', appLanguage: 'en', name: 'English' },
  { key: 'ph', route: 'ph', htmlLanguage: 'fil-PH', appLanguage: 'ph', name: 'Filipino' },
  { key: 'th', route: 'th', htmlLanguage: 'th-TH', appLanguage: 'th', name: 'ไทย' },
  { key: 'vn', route: 'vn', htmlLanguage: 'vi-VN', appLanguage: 'vi', name: 'Tiếng Việt' },
  { key: 'my', route: 'my', htmlLanguage: 'ms-MY', appLanguage: 'my', name: 'Bahasa Melayu' },
  { key: 'cn', route: 'cn', htmlLanguage: 'zh-CN', appLanguage: 'cn', name: '简体中文' },
  { key: 'hk', route: 'hk', htmlLanguage: 'zh-HK', appLanguage: 'hk', name: '繁體中文（香港）' },
  { key: 'id', route: 'id', htmlLanguage: 'id-ID', appLanguage: 'id', name: 'Bahasa Indonesia' },
];

export const REGIONS = {
  indonesia: { slug: 'indonesia', code: 'ID', currency: 'IDR' },
  malaysia: { slug: 'malaysia', code: 'MY', currency: 'MYR' },
  philippines: { slug: 'philippines', code: 'PH', currency: 'PHP' },
  singapore: { slug: 'singapore', code: 'SG', currency: 'SGD' },
  thailand: { slug: 'thailand', code: 'TH', currency: 'THB' },
  vietnam: { slug: 'vietnam', code: 'VN', currency: 'VND' },
  'united-states': { slug: 'united-states', code: 'US', currency: 'USD' },
};

const southeastAsiaRegions = [
  'indonesia',
  'malaysia',
  'philippines',
  'singapore',
  'thailand',
  'vietnam',
];

export const MARKETPLACES = {
  alibaba: {
    slug: 'alibaba',
    asset: 'alibaba.webp',
    productRegions: ['united-states'],
    apiRegions: ['united-states'],
    modes: ['product', 'category'],
    regionParameter: null,
  },
  amazon: {
    slug: 'amazon',
    asset: 'amazon.webp',
    productRegions: ['united-states'],
    apiRegions: ['united-states'],
    modes: ['product', 'category'],
    regionParameter: null,
  },
  lazada: {
    slug: 'lazada',
    asset: 'lazada.webp',
    productRegions: [...southeastAsiaRegions],
    apiRegions: [...southeastAsiaRegions],
    modes: ['product', 'category', 'store'],
    regionParameter: 'country',
  },
  shopee: {
    slug: 'shopee',
    asset: 'shopee.webp',
    productRegions: [...southeastAsiaRegions],
    apiRegions: [...southeastAsiaRegions],
    modes: ['product', 'category', 'store'],
    regionParameter: 'country',
  },
  temu: {
    slug: 'temu',
    asset: 'temu.webp',
    productRegions: ['united-states'],
    apiRegions: ['united-states'],
    modes: ['product', 'category', 'store'],
    regionParameter: null,
  },
  tiktok: {
    slug: 'tiktok-shop',
    asset: 'c1-marketplace.webp',
    productRegions: [...southeastAsiaRegions, 'united-states'],
    apiRegions: [...southeastAsiaRegions],
    modes: ['product', 'category', 'store'],
    regionParameter: 'country',
  },
};

export const FEATURES = {
  'market-radar': { slug: 'market-radar', asset: 'c1-marketplace.webp' },
  'product-research': { slug: 'product-research', asset: 'c1-marketplace.webp' },
  'category-research': { slug: 'category-research', asset: 'c2-filter.webp' },
  'store-research': { slug: 'store-research', asset: 'c2-filter.webp' },
  'advanced-filters': { slug: 'advanced-filters', asset: 'c2-filter.webp' },
  'data-exports': { slug: 'data-exports', asset: 'c3-export.webp' },
  'ai-connectors': { slug: 'ai-connectors', asset: 'c4-ai.webp' },
};

export const INFORMATIONAL_PAGES = [
  { path: '/about/', lastModified: '2026-08-04' },
  { path: '/contact/', lastModified: '2026-08-04' },
  { path: '/privacy/', lastModified: '2026-08-04' },
  { path: '/terms-and-conditions/', lastModified: '2026-08-04' },
  { path: '/refund-policy/', lastModified: '2026-08-04' },
];

export function getLocalizedPath(path, locale) {
  return locale.route ? `/${locale.route}${path}` : path;
}

export function getCanonicalUrl(path, locale) {
  return `${SITE_URL}${getLocalizedPath(path, locale)}`;
}
