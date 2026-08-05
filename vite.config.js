import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite';
import { LANDING_TRANSLATIONS } from '#landing-translations';

const page = (pathname) => fileURLToPath(new URL(pathname, import.meta.url));
const homePage = page('index.html');

const LOCALES = [
  { route: 'ph', language: 'fil-PH', name: 'Filipino' },
  { route: 'th', language: 'th-TH', name: 'ไทย' },
  { route: 'vn', language: 'vi-VN', name: 'Tiếng Việt' },
  { route: 'my', language: 'ms-MY', name: 'Bahasa Melayu' },
  { route: 'cn', language: 'zh-CN', name: '简体中文' },
  { route: 'id', language: 'id-ID', name: 'Bahasa Indonesia' },
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
    .replace('<html lang="en">', `<html lang="${locale.language}">`)
    .replace(
      '<link rel="canonical" href="https://ecomblade.com/" />',
      `<link rel="canonical" href="${localizedUrl}" />`,
    )
    .replace(
      '<meta property="og:url" content="https://ecomblade.com/" />',
      `<meta property="og:url" content="${localizedUrl}" />`,
    )
    .replace(
      'data-language-current>English</span>',
      `data-language-current>${locale.name}</span>`,
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
    .replace('"inLanguage": "en"', `"inLanguage": "${locale.language}"`);

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

export default defineConfig({
  plugins: [staticLocalePages()],
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
