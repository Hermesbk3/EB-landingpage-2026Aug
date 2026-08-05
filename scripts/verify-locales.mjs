import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { LANDING_TRANSLATIONS } from '#landing-translations';

const root = resolve(import.meta.dirname, '..');
const locales = [
  { route: '', language: 'en', name: 'English', canonical: 'https://ecomblade.com/' },
  { route: 'ph', language: 'fil-PH', name: 'Filipino', canonical: 'https://ecomblade.com/ph/' },
  { route: 'th', language: 'th-TH', name: 'ไทย', canonical: 'https://ecomblade.com/th/' },
  { route: 'vn', language: 'vi-VN', name: 'Tiếng Việt', canonical: 'https://ecomblade.com/vn/' },
  { route: 'my', language: 'ms-MY', name: 'Bahasa Melayu', canonical: 'https://ecomblade.com/my/' },
  { route: 'cn', language: 'zh-CN', name: '简体中文', canonical: 'https://ecomblade.com/cn/' },
  { route: 'id', language: 'id-ID', name: 'Bahasa Indonesia', canonical: 'https://ecomblade.com/id/' },
];

locales.forEach((locale) => {
  const pathname = locale.route
    ? resolve(root, 'dist', locale.route, 'index.html')
    : resolve(root, 'dist', 'index.html');
  const html = readFileSync(pathname, 'utf8');

  assert.match(html, new RegExp(`<html lang="${locale.language}">`));
  assert.ok(
    html.includes(`<link rel="canonical" href="${locale.canonical}" />`),
    `${locale.route || 'en'} has the wrong canonical URL`,
  );
  assert.equal(
    (html.match(/rel="alternate"/g) ?? []).length,
    8,
    `${locale.route || 'en'} must expose all hreflang alternatives`,
  );
  assert.ok(html.includes('/assets/EB-logo-nav.png'));
  assert.ok(!html.includes('__ECOMBLADE_'));

  const localeKey = locale.route || 'en';
  assert.ok(html.includes(`<title>${LANDING_TRANSLATIONS.title[localeKey]}</title>`));
  assert.ok(
    html.includes(
      `<span class="language-current" data-language-current>${locale.name}</span>`,
    ),
  );

  const structuredDataMatch = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
  );
  assert.ok(structuredDataMatch);
  const structuredData = JSON.parse(structuredDataMatch[1]);
  assert.equal(structuredData['@graph'][1].inLanguage, locale.language);

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

function runLanguageSuggestion({ languages, savedState, blockedStorage = false }) {
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
  let storedValue = savedState ? JSON.stringify(savedState) : null;
  let assignedRoute = null;

  const localStorage = {
    getItem() {
      if (blockedStorage) throw new Error('Storage blocked');
      return storedValue;
    },
    setItem(_key, value) {
      if (blockedStorage) throw new Error('Storage blocked');
      storedValue = value;
    },
    removeItem() {
      if (blockedStorage) throw new Error('Storage blocked');
      storedValue = null;
    },
  };
  const window = {
    localStorage,
    location: {
      assign(route) {
        assignedRoute = route;
      },
    },
    requestIdleCallback(callback) {
      callback();
    },
  };

  runInNewContext(suggestionBlock[1], {
    Date,
    JSON,
    document: { getElementById: (id) => elements[id] },
    navigator: { language: languages[0], languages },
    window,
  });

  return {
    elements,
    listeners,
    getAssignedRoute: () => assignedRoute,
    getStoredValue: () => storedValue,
  };
}

const thaiSuggestion = runLanguageSuggestion({ languages: ['th-TH', 'en'] });
assert.equal(thaiSuggestion.elements['language-suggestion'].hidden, false);
assert.equal(thaiSuggestion.elements['language-suggestion-accept'].textContent, 'View in ไทย');
thaiSuggestion.listeners['accept:click']();
assert.equal(thaiSuggestion.getAssignedRoute(), '/th/');
assert.equal(JSON.parse(thaiSuggestion.getStoredValue()).action, 'accepted');

const dismissedSuggestion = runLanguageSuggestion({ languages: ['vi-VN'] });
dismissedSuggestion.listeners['dismiss:click']();
assert.equal(dismissedSuggestion.elements['language-suggestion'].hidden, true);
assert.equal(JSON.parse(dismissedSuggestion.getStoredValue()).action, 'dismissed');

const englishSuggestion = runLanguageSuggestion({ languages: ['en-US', 'id-ID'] });
assert.equal(englishSuggestion.elements['language-suggestion'].hidden, true);

const savedSuggestion = runLanguageSuggestion({
  languages: ['id-ID'],
  savedState: { action: 'dismissed', savedAt: Date.now() },
});
assert.equal(savedSuggestion.elements['language-suggestion'].hidden, true);

const expiredSuggestion = runLanguageSuggestion({
  languages: ['id-ID'],
  savedState: { action: 'dismissed', savedAt: Date.now() - 366 * 24 * 60 * 60 * 1000 },
});
assert.equal(expiredSuggestion.elements['language-suggestion'].hidden, false);

const blockedStorageSuggestion = runLanguageSuggestion({
  languages: ['fil-PH'],
  blockedStorage: true,
});
assert.equal(blockedStorageSuggestion.elements['language-suggestion'].hidden, false);

console.log('Verified 7 static locale pages, sitemap entries, and language suggestions.');
