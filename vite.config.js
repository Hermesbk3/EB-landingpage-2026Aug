import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite';
import { ENTRY_PAGES, findEntryPage } from '#entry-pages';
import { LANDING_TRANSLATIONS } from '#landing-translations';
import { renderEntryPage } from '#render-entry-page';
import {
  getCanonicalUrl,
  INFORMATIONAL_PAGES,
  LOCALES as SITE_LOCALES,
  SITE_URL,
} from '#site-config';

const page = (pathname) => fileURLToPath(new URL(pathname, import.meta.url));
const homePage = page('index.html');

// htmlLanguage uses BCP 47 for HTML/SEO. appLanguage uses the app's
// ISO 3166-1 alpha-2 convention.
const LOCALES = [
  { route: 'ph', htmlLanguage: 'fil-PH', appLanguage: 'ph', name: 'Filipino' },
  { route: 'th', htmlLanguage: 'th-TH', appLanguage: 'th', name: 'ไทย' },
  { route: 'vn', htmlLanguage: 'vi-VN', appLanguage: 'vi', name: 'Tiếng Việt' },
  { route: 'my', htmlLanguage: 'ms-MY', appLanguage: 'my', name: 'Bahasa Melayu' },
  { route: 'cn', htmlLanguage: 'zh-CN', appLanguage: 'cn', name: '简体中文' },
  { route: 'hk', htmlLanguage: 'zh-HK', appLanguage: 'hk', name: '繁體中文（香港）' },
  { route: 'id', htmlLanguage: 'id-ID', appLanguage: 'id', name: 'Bahasa Indonesia' },
];

const LANGUAGE_SUGGESTION_PATTERN =
  /<!-- language-suggestion:start -->[\s\S]*?<!-- language-suggestion:end -->/g;
const DEMO_DATA_PATTERN =
  /(var DEMO = {[\s\S]*?\n      };)(?=\n\n      \/\* ── Row HTML)/;
const DEMO_DATA_TOKEN = '__ECOMBLADE_DEMO_DATA__';
const DEMO_TRANSLATION_KEYS = [
  'water_bottle',
  'indonesia',
  'thailand',
  'malaysia',
  'united_states',
];
const LANGUAGE_OPTIONS = [
  { route: '', name: 'English' },
  { route: 'ph', name: 'Filipino' },
  { route: 'th', name: 'ไทย' },
  { route: 'vn', name: 'Tiếng Việt' },
  { route: 'my', name: 'Bahasa Melayu' },
  { route: 'cn', name: '简体中文' },
  { route: 'hk', name: '繁體中文（香港）' },
  { route: 'id', name: 'Bahasa Indonesia' },
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceFlexibleWhitespace(html, english, translation) {
  const pattern = escapeRegExp(english).replace(/\s+/g, '\\s+');
  return html.replace(new RegExp(pattern, 'g'), translation);
}

function applyTranslations(html, translations, route) {
  const tokenizedTranslations = [];
  let output = html;

  translations.forEach((translation, index) => {
    const token = `__ECOMBLADE_TRANSLATION_${index}__`;
    const nextOutput = replaceFlexibleWhitespace(output, translation.en, token);
    if (nextOutput !== output) {
      tokenizedTranslations.push({ token, value: translation[route] });
      output = nextOutput;
    }
  });

  tokenizedTranslations.forEach(({ token, value }) => {
    output = output.replaceAll(token, value);
  });

  return output;
}

function localizeHomePage(englishHtml, locale) {
  const localizedUrl = `https://ecomblade.com/${locale.route}/`;
  let html = englishHtml.replace(LANGUAGE_SUGGESTION_PATTERN, '');
  const demoDataMatch = html.match(DEMO_DATA_PATTERN);

  if (!demoDataMatch) {
    throw new Error('Could not isolate the homepage demo data.');
  }

  html = html.replace(demoDataMatch[1], DEMO_DATA_TOKEN);

  const translations = Object.values(LANDING_TRANSLATIONS).sort(
    (left, right) => right.en.length - left.en.length,
  );

  html = applyTranslations(html, translations, locale.route);

  const demoTranslations = DEMO_TRANSLATION_KEYS.map(
    (key) => LANDING_TRANSLATIONS[key],
  ).sort((left, right) => right.en.length - left.en.length);
  const localizedDemoData = applyTranslations(
    demoDataMatch[1],
    demoTranslations,
    locale.route,
  );
  html = html.replace(DEMO_DATA_TOKEN, localizedDemoData);

  html = html
    .replace('<html lang="en">', `<html lang="${locale.htmlLanguage}">`)
    .replace(
      '<link rel="canonical" href="https://ecomblade.com/" />',
      `<link rel="canonical" href="${localizedUrl}" />`,
    )
    .replace(
      '<meta property="og:url" content="https://ecomblade.com/" />',
      `<meta property="og:url" content="${localizedUrl}" />`,
    )
    .replace(
      /(data-language-current\s*>\s*)English(\s*<\/span\s*>)/,
      `$1${locale.name}$2`,
    )
    .replace(
      ' hreflang="en" lang="en" aria-current="page"',
      ' hreflang="en" lang="en"',
    )
    .replace(
      `href="/${locale.route}/" hreflang=`,
      `href="/${locale.route}/" aria-current="page" hreflang=`,
    )
    .replace(
      '"@id": "https://ecomblade.com/#website"',
      `"@id": "${localizedUrl}#website"`,
    )
    .replace(
      /("@type": "WebSite",[\s\S]*?"url": )"https:\/\/ecomblade\.com\/"/,
      `$1"${localizedUrl}"`,
    )
    .replace('"inLanguage": "en"', `"inLanguage": "${locale.htmlLanguage}"`);

  html = html
    .replaceAll(
      'https://app.ecomblade.com/login?language=en',
      `https://app.ecomblade.com/login?language=${locale.appLanguage}`,
    )
    .replaceAll(
      'https://app.ecomblade.com/register?language=en',
      `https://app.ecomblade.com/register?language=${locale.appLanguage}`,
    )
    .replaceAll('href="/marketplaces/', `href="/${locale.route}/marketplaces/`)
    .replaceAll('href="/features/', `href="/${locale.route}/features/`)
    .replaceAll('href="/api/', `href="/${locale.route}/api/`)
    .replaceAll('href="/pricing/', `href="/${locale.route}/pricing/`);

  LANGUAGE_OPTIONS.forEach((option) => {
    const href = option.route ? `/${option.route}/` : '/';
    const linkPattern = new RegExp(`(<a href="${href}"[^>]*>)[^<]*(<\\/a>)`);
    html = html.replace(linkPattern, `$1${option.name}$2`);
  });

  return html;
}

function staticLocalePages() {
  return {
    name: 'static-locale-pages',
    enforce: 'post',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const pathname = new URL(
          request.url ?? '/',
          'http://localhost',
        ).pathname;
        const locale = LOCALES.find(({ route }) => pathname === `/${route}/`);

        if (!locale) {
          next();
          return;
        }

        try {
          const englishHtml = readFileSync(homePage, 'utf8');
          const localizedHtml = localizeHomePage(englishHtml, locale);
          const transformedHtml = await server.transformIndexHtml(
            pathname,
            localizedHtml,
          );

          response.statusCode = 200;
          response.setHeader('Content-Type', 'text/html; charset=utf-8');
          response.end(transformedHtml);
        } catch (error) {
          next(error);
        }
      });
    },
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        const englishPage = bundle['index.html'];

        if (!englishPage || englishPage.type !== 'asset') {
          throw new Error('Vite did not emit the English homepage.');
        }

        const englishHtml = String(englishPage.source);
        LOCALES.forEach((locale) => {
          const fileName = `${locale.route}/index.html`;
          this.emitFile({
            type: 'asset',
            fileName,
            source: localizeHomePage(englishHtml, locale),
          });
        });
      },
    },
  };
}

function resolveEntryRequest(pathname) {
  const locale =
    SITE_LOCALES.find(
      (candidate) =>
        candidate.route &&
        (pathname === `/${candidate.route}` ||
          pathname.startsWith(`/${candidate.route}/`)),
    ) ?? SITE_LOCALES[0];
  const conceptPath = locale.route
    ? pathname.slice(locale.route.length + 1) || '/'
    : pathname;
  return { locale, page: findEntryPage(conceptPath) };
}

function staticEntryPages() {
  return {
    name: 'static-entry-pages',
    enforce: 'post',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const pathname = new URL(
          request.url ?? '/',
          'http://localhost',
        ).pathname;
        const { locale, page: entryPage } = resolveEntryRequest(pathname);

        if (!entryPage) {
          next();
          return;
        }

        try {
          const html = renderEntryPage(entryPage, locale);
          const transformedHtml = await server.transformIndexHtml(
            pathname,
            html,
          );
          response.statusCode = 200;
          response.setHeader('Content-Type', 'text/html; charset=utf-8');
          response.end(transformedHtml);
        } catch (error) {
          next(error);
        }
      });
    },
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        const analyticsChunk = Object.values(bundle).find(
          (output) =>
            output.type === 'chunk' &&
            (output.facadeModuleId?.endsWith('/src/analytics.js') ||
              output.name === 'analytics' ||
              output.fileName.includes('/analytics-')),
        );
        const analyticsPath = analyticsChunk
          ? `/${analyticsChunk.fileName}`
          : null;

        if (!analyticsPath) {
          throw new Error('Could not find the emitted analytics entry chunk.');
        }

        ENTRY_PAGES.forEach((entryPage) => {
          SITE_LOCALES.forEach((locale) => {
            const localizedPath = locale.route
              ? `${locale.route}${entryPage.path}`
              : entryPage.path.slice(1);
            this.emitFile({
              type: 'asset',
              fileName: `${localizedPath}index.html`,
              source: renderEntryPage(entryPage, locale, analyticsPath),
            });
          });
        });

        this.emitFile({
          type: 'asset',
          fileName: 'sitemap.xml',
          source: generateSitemap(),
        });
      },
    },
  };
}

function escapeXml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function sitemapUrl(url, lastModified, alternates = []) {
  const alternateLinks = alternates
    .map(
      ({ language, href }) =>
        `    <xhtml:link rel="alternate" hreflang="${language}" href="${escapeXml(href)}" />`,
    )
    .join('\n');
  return `  <url>\n    <loc>${escapeXml(url)}</loc>${alternateLinks ? `\n${alternateLinks}` : ''}\n    <lastmod>${lastModified}</lastmod>\n  </url>`;
}

function localizedAlternates(path) {
  return [
    ...SITE_LOCALES.map((locale) => ({
      language: locale.htmlLanguage,
      href: getCanonicalUrl(path, locale),
    })),
    { language: 'x-default', href: `${SITE_URL}${path}` },
  ];
}

function generateSitemap() {
  const urls = [];
  SITE_LOCALES.forEach((locale) => {
    urls.push(
      sitemapUrl(
        getCanonicalUrl('/', locale),
        '2026-08-05',
        localizedAlternates('/'),
      ),
    );
  });
  INFORMATIONAL_PAGES.forEach(({ path, lastModified }) => {
    urls.push(sitemapUrl(`${SITE_URL}${path}`, lastModified));
  });
  ENTRY_PAGES.forEach((entryPage) => {
    const alternates = localizedAlternates(entryPage.path);
    SITE_LOCALES.forEach((locale) => {
      urls.push(
        sitemapUrl(
          getCanonicalUrl(entryPage.path, locale),
          '2026-08-28',
          alternates,
        ),
      );
    });
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
}

export default defineConfig({
  plugins: [staticLocalePages(), staticEntryPages()],
  build: {
    rollupOptions: {
      input: {
        home: homePage,
        about: page('about/index.html'),
        contact: page('contact/index.html'),
        privacy: page('privacy/index.html'),
        termsAndConditions: page('terms-and-conditions/index.html'),
        refundPolicy: page('refund-policy/index.html'),
      },
      output: {
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
});
