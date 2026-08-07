import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { LANDING_TRANSLATIONS } from '#landing-translations';

const root = resolve(import.meta.dirname, '..');
const locales = [
  { route: '', htmlLanguage: 'en', appLanguage: 'en', name: 'English', canonical: 'https://ecomblade.com/' },
  { route: 'ph', htmlLanguage: 'fil-PH', appLanguage: 'ph', name: 'Filipino', canonical: 'https://ecomblade.com/ph/' },
  { route: 'th', htmlLanguage: 'th-TH', appLanguage: 'th', name: 'ไทย', canonical: 'https://ecomblade.com/th/' },
  { route: 'vn', htmlLanguage: 'vi-VN', appLanguage: 'vi', name: 'Tiếng Việt', canonical: 'https://ecomblade.com/vn/' },
  { route: 'my', htmlLanguage: 'ms-MY', appLanguage: 'my', name: 'Bahasa Melayu', canonical: 'https://ecomblade.com/my/' },
  { route: 'cn', htmlLanguage: 'zh-CN', appLanguage: 'cn', name: '简体中文', canonical: 'https://ecomblade.com/cn/' },
  { route: 'hk', htmlLanguage: 'zh-HK', appLanguage: 'hk', name: '繁體中文（香港）', canonical: 'https://ecomblade.com/hk/' },
  { route: 'id', htmlLanguage: 'id-ID', appLanguage: 'id', name: 'Bahasa Indonesia', canonical: 'https://ecomblade.com/id/' },
];

const translationLocaleKeys = locales
  .map((locale) => locale.route || 'en')
  .sort();
Object.entries(LANDING_TRANSLATIONS).forEach(([key, translations]) => {
  assert.deepEqual(
    Object.keys(translations).sort(),
    translationLocaleKeys,
    `${key} must contain every landing-page locale`,
  );
  translationLocaleKeys.forEach((locale) => {
    assert.ok(translations[locale].trim(), `${key}.${locale} must not be empty`);
  });
});

locales.forEach((locale) => {
  const pathname = locale.route
    ? resolve(root, 'dist', locale.route, 'index.html')
    : resolve(root, 'dist', 'index.html');
  const html = readFileSync(pathname, 'utf8');

  assert.match(html, new RegExp(`<html lang="${locale.htmlLanguage}">`));
  assert.ok(
    html.includes(`<link rel="canonical" href="${locale.canonical}" />`),
    `${locale.route || 'en'} has the wrong canonical URL`,
  );
  assert.equal(
    (html.match(/rel="alternate"/g) ?? []).length,
    9,
    `${locale.route || 'en'} must expose all hreflang alternatives`,
  );
  assert.ok(html.includes('/assets/EB-logo-nav.png'));
  assert.ok(!html.includes('__ECOMBLADE_'));
  const appLanguageLinks = [
    ...html.matchAll(
      /href="https:\/\/app\.ecomblade\.com\/(?:login|register)\?language=([^"]+)"/g,
    ),
  ];
  assert.ok(appLanguageLinks.length > 0);
  appLanguageLinks.forEach((match) => {
    assert.equal(match[1], locale.appLanguage);
  });

  const localeKey = locale.route || 'en';
  assert.ok(html.includes(`<title>${LANDING_TRANSLATIONS.title[localeKey]}</title>`));
  assert.match(
    html,
    new RegExp(
      `data-language-current\\s*>\\s*${locale.name}\\s*<\\/span\\s*>`,
    ),
  );

  const structuredDataMatch = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
  );
  assert.ok(structuredDataMatch);
  const structuredData = JSON.parse(structuredDataMatch[1]);
  assert.equal(structuredData['@graph'][1].inLanguage, locale.htmlLanguage);

  const inlineScripts = [...html.matchAll(/<script(?![^>]*type="application\/ld\+json")[^>]*>([\s\S]*?)<\/script>/g)]
    .map((match) => match[1])
    .filter(Boolean);
  inlineScripts.forEach((code) => new Function(code));

  if (locale.route) {
    assert.ok(!html.includes('id="language-suggestion"'));
    assert.ok(!html.includes('ecomblade-language-suggestion:v1'));
    assert.ok(html.includes(`href="/${locale.route}/" aria-current="page"`));
  } else {
    assert.ok(html.includes('id="language-suggestion"'));
    assert.ok(html.includes('ecomblade-language-suggestion:v1'));
  }
});

const sitemap = readFileSync(resolve(root, 'dist', 'sitemap.xml'), 'utf8');
locales.forEach((locale) => {
  assert.ok(sitemap.includes(`<loc>${locale.canonical}</loc>`));
});

const englishHtml = readFileSync(resolve(root, 'dist', 'index.html'), 'utf8');
const suggestionBlock = englishHtml.match(
  /<!-- language-suggestion:start -->[\s\S]*?<script>([\s\S]*?)<\/script>[\s\S]*?<!-- language-suggestion:end -->/,
);
assert.ok(suggestionBlock);

function runLanguageSuggestion({
  languages,
  savedSuggestionState,
  savedPreference,
  blockedStorage = false,
  timeZone = 'UTC',
}) {
  const listeners = {};
  const elements = {
    'language-suggestion': { hidden: true },
    'language-suggestion-copy': { textContent: '' },
    'language-suggestion-accept': {
      textContent: '',
      addEventListener(event, listener) {
        listeners[`accept:${event}`] = listener;
      },
    },
    'language-suggestion-dismiss': {
      addEventListener(event, listener) {
        listeners[`dismiss:${event}`] = listener;
      },
    },
  };
  const storedValues = new Map();
  if (savedSuggestionState) {
    storedValues.set(
      'ecomblade-language-suggestion:v1',
      JSON.stringify(savedSuggestionState),
    );
  }
  if (savedPreference) {
    storedValues.set(
      'ecomblade-language-preference:v1',
      JSON.stringify(savedPreference),
    );
  }
  let assignedRoute = null;

  const localStorage = {
    getItem(key) {
      if (blockedStorage) throw new Error('Storage blocked');
      return storedValues.get(key) ?? null;
    },
    setItem(key, value) {
      if (blockedStorage) throw new Error('Storage blocked');
      storedValues.set(key, value);
    },
    removeItem(key) {
      if (blockedStorage) throw new Error('Storage blocked');
      storedValues.delete(key);
    },
  };
  const window = {
    localStorage,
    location: {
      assign(route) {
        assignedRoute = route;
      },
    },
    setTimeout(callback) {
      callback();
    },
  };

  runInNewContext(suggestionBlock[1], {
    Date,
    Intl: {
      DateTimeFormat: () => ({
        resolvedOptions: () => ({ timeZone }),
      }),
    },
    JSON,
    document: { getElementById: (id) => elements[id] },
    navigator: { language: languages[0], languages },
    window,
  });

  return {
    elements,
    listeners,
    getAssignedRoute: () => assignedRoute,
    getStoredValue: (key) => storedValues.get(key) ?? null,
  };
}

const thaiSuggestion = runLanguageSuggestion({ languages: ['th-TH', 'en'] });
assert.equal(thaiSuggestion.elements['language-suggestion'].hidden, false);
assert.equal(thaiSuggestion.elements['language-suggestion-accept'].textContent, 'View in ไทย');
thaiSuggestion.listeners['accept:click']();
assert.equal(thaiSuggestion.getAssignedRoute(), '/th/');
assert.equal(
  JSON.parse(
    thaiSuggestion.getStoredValue('ecomblade-language-preference:v1'),
  ).action,
  'selected',
);
assert.equal(
  thaiSuggestion.getStoredValue('ecomblade-language-suggestion:v1'),
  null,
);

const hongKongSuggestion = runLanguageSuggestion({
  languages: ['zh-HK', 'zh-CN'],
});
assert.equal(hongKongSuggestion.elements['language-suggestion'].hidden, false);
assert.equal(
  hongKongSuggestion.elements['language-suggestion-accept'].textContent,
  'View in 繁體中文（香港）',
);
hongKongSuggestion.listeners['accept:click']();
assert.equal(hongKongSuggestion.getAssignedRoute(), '/hk/');

const hongKongTimeZoneSuggestion = runLanguageSuggestion({
  languages: ['en-US', 'en'],
  timeZone: 'Asia/Hong_Kong',
});
assert.equal(
  hongKongTimeZoneSuggestion.elements['language-suggestion-accept'].textContent,
  'View in 繁體中文（香港）',
);

const malaySuggestion = runLanguageSuggestion({ languages: ['ms-MY', 'en'] });
assert.equal(malaySuggestion.elements['language-suggestion'].hidden, false);
malaySuggestion.listeners['accept:click']();
assert.equal(malaySuggestion.getAssignedRoute(), '/my/');

const dismissedSuggestion = runLanguageSuggestion({ languages: ['vi-VN'] });
dismissedSuggestion.listeners['dismiss:click']();
assert.equal(dismissedSuggestion.elements['language-suggestion'].hidden, true);
assert.equal(
  JSON.parse(
    dismissedSuggestion.getStoredValue('ecomblade-language-suggestion:v1'),
  ).action,
  'dismissed',
);
assert.equal(
  dismissedSuggestion.getStoredValue('ecomblade-language-preference:v1'),
  null,
);

const secondaryIndonesianSuggestion = runLanguageSuggestion({
  languages: ['en-US', 'id-ID'],
});
assert.equal(
  secondaryIndonesianSuggestion.elements['language-suggestion'].hidden,
  false,
);
assert.equal(
  secondaryIndonesianSuggestion.elements['language-suggestion-accept'].textContent,
  'View in Bahasa Indonesia',
);

const englishSuggestion = runLanguageSuggestion({ languages: ['en-US', 'en'] });
assert.equal(englishSuggestion.elements['language-suggestion'].hidden, true);

const indonesianTimeZoneSuggestion = runLanguageSuggestion({
  languages: ['en-US', 'en'],
  timeZone: 'Asia/Jakarta',
});
assert.equal(
  indonesianTimeZoneSuggestion.elements['language-suggestion'].hidden,
  false,
);
assert.equal(
  indonesianTimeZoneSuggestion.elements['language-suggestion-accept'].textContent,
  'View in Bahasa Indonesia',
);

const savedSuggestion = runLanguageSuggestion({
  languages: ['id-ID'],
  savedSuggestionState: { action: 'dismissed', savedAt: Date.now() },
});
assert.equal(savedSuggestion.elements['language-suggestion'].hidden, true);

const expiredSuggestion = runLanguageSuggestion({
  languages: ['id-ID'],
  savedSuggestionState: {
    action: 'dismissed',
    savedAt: Date.now() - 366 * 24 * 60 * 60 * 1000,
  },
});
assert.equal(expiredSuggestion.elements['language-suggestion'].hidden, false);

const legacyAcceptedSuggestion = runLanguageSuggestion({
  languages: ['en-US'],
  savedSuggestionState: {
    action: 'accepted',
    route: '/vn/',
    savedAt: Date.now(),
  },
});
assert.equal(
  legacyAcceptedSuggestion.elements['language-suggestion'].hidden,
  false,
);
assert.equal(
  legacyAcceptedSuggestion.elements['language-suggestion-accept'].textContent,
  'View in Tiếng Việt',
);
assert.equal(
  legacyAcceptedSuggestion.getStoredValue(
    'ecomblade-language-suggestion:v1',
  ),
  null,
);
assert.equal(
  JSON.parse(
    legacyAcceptedSuggestion.getStoredValue(
      'ecomblade-language-preference:v1',
    ),
  ).route,
  '/vn/',
);

const englishPreference = runLanguageSuggestion({
  languages: ['id-ID'],
  savedPreference: { action: 'selected', route: '/', savedAt: Date.now() },
});
assert.equal(englishPreference.elements['language-suggestion'].hidden, true);

const indonesianPreference = runLanguageSuggestion({
  languages: ['en-US'],
  savedPreference: {
    action: 'selected',
    route: '/id/',
    savedAt: Date.now(),
  },
});
assert.equal(indonesianPreference.elements['language-suggestion'].hidden, false);
assert.equal(
  indonesianPreference.elements['language-suggestion-copy'].textContent,
  "Previously you've chosen Bahasa Indonesia.",
);
assert.equal(
  indonesianPreference.elements['language-suggestion-accept'].textContent,
  'View in Bahasa Indonesia',
);

const blockedStorageSuggestion = runLanguageSuggestion({
  languages: ['fil-PH'],
  blockedStorage: true,
});
assert.equal(blockedStorageSuggestion.elements['language-suggestion'].hidden, false);

const languageMenuScript = englishHtml.match(
  /<script>\s*(\(function closeLanguageMenuOnOutsidePointer\(\)[\s\S]*?)<\/script>/,
);
assert.ok(languageMenuScript);

let pointerHandler = null;
let linkClickHandler = null;
let menuWasClosed = false;
let storedMenuPreference = null;
const insideTarget = {};
const menu = {
  contains(target) {
    return target === insideTarget;
  },
  removeAttribute(attribute) {
    assert.equal(attribute, 'open');
    menuWasClosed = true;
  },
};
const languageOption = {
  href: 'https://ecomblade.com/id/',
  addEventListener(event, handler) {
    assert.equal(event, 'click');
    linkClickHandler = handler;
  },
};
const menuDocument = {
  addEventListener(event, handler) {
    assert.equal(event, 'pointerdown');
    pointerHandler = handler;
  },
  querySelectorAll(selector) {
    if (selector === '.language-options a') return [languageOption];
    assert.equal(selector, '.language-menu[open]');
    return [menu];
  },
};
runInNewContext(languageMenuScript[1], {
  Date,
  JSON,
  URL,
  document: menuDocument,
  window: {
    localStorage: {
      setItem(key, value) {
        assert.equal(key, 'ecomblade-language-preference:v1');
        storedMenuPreference = value;
      },
    },
  },
});
assert.ok(pointerHandler);
assert.ok(linkClickHandler);
pointerHandler({ target: insideTarget });
assert.equal(menuWasClosed, false);
pointerHandler({ target: {} });
assert.equal(menuWasClosed, true);
linkClickHandler();
assert.equal(JSON.parse(storedMenuPreference).route, '/id/');

console.log('Verified 7 static locale pages, sitemap entries, and language suggestions.');
