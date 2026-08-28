import { getApiResponseExample } from '#api-response-examples';
import {
  fillTemplate,
  getEntryTranslations,
} from '#entry-page-translations';
import { ENTRY_PAGES } from '#entry-pages';
import { LANDING_TRANSLATIONS } from '#landing-translations';
import {
  FEATURES,
  getCanonicalUrl,
  getLocalizedPath,
  LOCALES,
  MARKETPLACES,
  REGIONS,
  SITE_URL,
} from '#site-config';

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const format = (value, variables) => fillTemplate(value, variables);

function pageVariables(page, copy) {
  const marketplaceName = page.marketplaceKey
    ? copy.marketplaceNames[page.marketplaceKey]
    : '';
  const regionName = page.regionKey ? copy.regionNames[page.regionKey] : '';
  const featureName = page.featureKey ? copy.featureNames[page.featureKey] : '';
  const region = page.regionKey ? REGIONS[page.regionKey] : null;

  return {
    marketplace: marketplaceName,
    region: regionName,
    feature: featureName,
    description: page.featureKey
      ? copy.featureDescriptions[page.featureKey]
      : '',
    currency: region?.currency ?? '',
    code: region?.code ?? '',
  };
}

function getPageMeta(page, copy, locale) {
  const variables = pageVariables(page, copy);

  if (page.kind === 'pricing') {
    return {
      title: `${LANDING_TRANSLATIONS.pricing[locale.key]} — Ecomblade`,
      description: copy.pricing.metaDescription,
      h1: LANDING_TRANSLATIONS.pricing_title[locale.key],
      intro: LANDING_TRANSLATIONS.pricing_desc[locale.key],
    };
  }
  if (page.kind === 'hub') {
    return copy.hubs[page.section];
  }
  if (page.kind === 'marketplace') {
    return {
      title: format(copy.marketplace.title, variables),
      description: format(copy.marketplace.description, variables),
      h1: format(copy.marketplace.h1, variables),
      intro: format(copy.marketplace.intro, variables),
    };
  }
  if (page.kind === 'marketplace-region') {
    return {
      title: format(copy.marketplace.regionTitle, variables),
      description: format(copy.marketplace.regionDescription, variables),
      h1: format(copy.marketplace.regionH1, variables),
      intro: format(copy.marketplace.regionIntro, variables),
    };
  }
  if (page.kind === 'feature') {
    return {
      title: format(copy.feature.title, variables),
      description: format(copy.feature.description, variables),
      h1: format(copy.feature.h1, variables),
      intro: format(copy.feature.intro, variables),
    };
  }
  if (page.kind === 'api-marketplace') {
    return {
      title: format(copy.api.title, variables),
      description: format(copy.api.description, variables),
      h1: format(copy.api.h1, variables),
      intro: format(copy.api.intro, variables),
    };
  }
  return {
    title: format(copy.api.regionTitle, variables),
    description: format(copy.api.regionDescription, variables),
    h1: format(copy.api.regionH1, variables),
    intro: format(copy.api.regionIntro, variables),
  };
}

function renderLanguageAlternates(page) {
  const links = LOCALES.map(
    (locale) =>
      `<link rel="alternate" hreflang="${locale.htmlLanguage}" href="${getCanonicalUrl(page.path, locale)}" />`,
  );
  links.push(
    `<link rel="alternate" hreflang="x-default" href="${SITE_URL}${page.path}" />`,
  );
  return links.join('\n    ');
}

function renderLanguageMenu(page, locale, copy) {
  const options = LOCALES.map((option) => {
    const current = option.key === locale.key ? ' aria-current="page"' : '';
    return `<a href="${getLocalizedPath(page.path, option)}" hreflang="${option.htmlLanguage}" lang="${option.htmlLanguage}"${current}>${escapeHtml(option.name)}</a>`;
  }).join('');

  return `<details class="language-menu"><summary aria-label="${escapeHtml(copy.nav.language)}"><span aria-hidden="true">🌐</span><span>${escapeHtml(locale.name)}</span></summary><div class="language-options">${options}</div></details>`;
}

function renderMobileMenu(locale, copy) {
  return `<details class="mobile-menu"><summary aria-label="${escapeHtml(copy.common.navigationMenu)}"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M3 5H15M3 9H15M3 13H15" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" /></svg></summary><div class="mobile-menu-panel"><a href="${getLocalizedPath('/marketplaces/', locale)}">${escapeHtml(copy.nav.marketplaces)}</a><a href="${getLocalizedPath('/features/', locale)}">${escapeHtml(copy.nav.features)}</a><a href="${getLocalizedPath('/api/', locale)}">${escapeHtml(copy.nav.api)}</a><a href="${getLocalizedPath('/pricing/', locale)}">${escapeHtml(copy.nav.pricing)}</a></div></details>`;
}

function renderNavigation(page, locale, copy) {
  return `<nav class="site-nav" aria-label="Primary"><div class="container nav-inner">
    <a href="${getLocalizedPath('/', locale)}" class="logo"><img src="/assets/EB-logo-nav.png" alt="Ecomblade" width="104" height="26" /></a>
    <div class="nav-links"><a href="${getLocalizedPath('/marketplaces/', locale)}">${escapeHtml(copy.nav.marketplaces)}</a><a href="${getLocalizedPath('/features/', locale)}">${escapeHtml(copy.nav.features)}</a><a href="${getLocalizedPath('/api/', locale)}">${escapeHtml(copy.nav.api)}</a><a href="${getLocalizedPath('/pricing/', locale)}">${escapeHtml(copy.nav.pricing)}</a></div>
    <div class="nav-actions">${renderLanguageMenu(page, locale, copy)}<a class="button secondary desktop-action" href="https://app.ecomblade.com/login?language=${locale.appLanguage}">${escapeHtml(copy.nav.login)}</a><a class="button primary" href="https://app.ecomblade.com/register?language=${locale.appLanguage}">${escapeHtml(copy.nav.start)}</a>${renderMobileMenu(locale, copy)}</div>
  </div></nav>`;
}

function getBreadcrumbs(page, copy) {
  const crumbs = [{ label: copy.common.home, path: '/' }];
  if (page.kind === 'hub') {
    crumbs.push({ label: copy.nav[page.section], path: page.path });
    return crumbs;
  }
  if (page.kind.startsWith('marketplace')) {
    crumbs.push({ label: copy.nav.marketplaces, path: '/marketplaces/' });
    const marketplace = MARKETPLACES[page.marketplaceKey];
    crumbs.push({
      label: copy.marketplaceNames[page.marketplaceKey],
      path: `/marketplaces/${marketplace.slug}/`,
    });
  } else if (page.kind === 'feature') {
    crumbs.push({ label: copy.nav.features, path: '/features/' });
    crumbs.push({ label: copy.featureNames[page.featureKey], path: page.path });
  } else if (page.kind.startsWith('api')) {
    crumbs.push({ label: copy.nav.api, path: '/api/' });
    const marketplace = MARKETPLACES[page.marketplaceKey];
    crumbs.push({
      label: copy.marketplaceNames[page.marketplaceKey],
      path: `/api/${marketplace.slug}/`,
    });
  } else {
    crumbs.push({ label: copy.nav.pricing, path: page.path });
  }
  if (page.regionKey) {
    crumbs.push({ label: copy.regionNames[page.regionKey], path: page.path });
  }
  return crumbs;
}

function renderBreadcrumbs(page, locale, copy) {
  const crumbs = getBreadcrumbs(page, copy);
  return `<nav class="breadcrumbs" aria-label="${escapeHtml(copy.common.breadcrumbLabel)}"><ol>${crumbs
    .map((crumb, index) => {
      const isLast = index === crumbs.length - 1;
      return `<li>${isLast ? `<span aria-current="page">${escapeHtml(crumb.label)}</span>` : `<a href="${getLocalizedPath(crumb.path, locale)}">${escapeHtml(crumb.label)}</a>`}</li>`;
    })
    .join('')}</ol></nav>`;
}

function renderCard({ path, title, description, image, imageWidth = 1000, imageHeight = 625, linkLabel }, locale, copy) {
  const resolvedLinkLabel = linkLabel ?? copy.common.explore;
  return `<article class="card"><div class="card-image">${image ? `<img src="/assets/${image}" alt="" width="${imageWidth}" height="${imageHeight}" loading="lazy" decoding="async" />` : ''}</div><div class="card-body"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p><a class="text-link" href="${getLocalizedPath(path, locale)}">${escapeHtml(resolvedLinkLabel)} <span aria-hidden="true">→</span></a></div></article>`;
}

function renderHub(page, locale, copy) {
  if (page.section === 'marketplaces') {
    return `<section class="section"><div class="container"><div class="card-grid">${Object.entries(MARKETPLACES)
      .map(([key, marketplace]) =>
        renderCard(
          {
            path: `/marketplaces/${marketplace.slug}/`,
            title: copy.marketplaceNames[key],
            description: format(copy.marketplace.description, {
              marketplace: copy.marketplaceNames[key],
            }),
            image: marketplace.asset,
            imageWidth: marketplace.assetWidth,
            imageHeight: marketplace.assetHeight,
          },
          locale,
          copy,
        ),
      )
      .join('')}</div></div></section>`;
  }
  if (page.section === 'features') {
    return `<section class="section"><div class="container"><div class="card-grid">${Object.entries(FEATURES)
      .map(([key, feature]) =>
        renderCard(
          {
            path: `/features/${feature.slug}/`,
            title: copy.featureNames[key],
            description: copy.featureDescriptions[key],
            image: feature.asset,
          },
          locale,
          copy,
        ),
      )
      .join('')}${renderCard(
        {
          path: '/api/',
          title: copy.nav.api,
          description: copy.hubs.api.description,
          image: 'c7-api.webp',
          linkLabel: copy.common.learnMore,
        },
        locale,
        copy,
      )}</div></div></section>`;
  }
  return `<section class="section"><div class="container"><div class="card-grid">${Object.entries(MARKETPLACES)
    .map(([key, marketplace]) =>
      renderCard(
        {
          path: `/api/${marketplace.slug}/`,
          title: format(copy.api.title, { marketplace: copy.marketplaceNames[key] }),
          description: format(copy.api.description, { marketplace: copy.marketplaceNames[key] }),
          image: marketplace.asset,
          imageWidth: marketplace.assetWidth,
          imageHeight: marketplace.assetHeight,
        },
        locale,
        copy,
      ),
    )
    .join('')}</div></div></section>`;
}

function renderWorkflowList(marketplace, copy) {
  const labels = {
    product: copy.common.product,
    category: copy.common.category,
    store: copy.common.store,
  };
  return marketplace.modes.map((mode) => `<li>${escapeHtml(labels[mode])}</li>`).join('');
}

function renderMarketplacePage(page, locale, copy) {
  const marketplace = MARKETPLACES[page.marketplaceKey];
  const variables = pageVariables(page, copy);
  const regionCards = marketplace.productRegions
    .map((regionKey) => {
      const region = REGIONS[regionKey];
      return renderCard(
        {
          path: `/marketplaces/${marketplace.slug}/${region.slug}/`,
          title: copy.regionNames[regionKey],
          description: format(copy.marketplace.regionDescription, {
            ...variables,
            region: copy.regionNames[regionKey],
            currency: region.currency,
          }),
        },
        locale,
        copy,
      );
    })
    .join('');

  const regional = page.kind === 'marketplace-region';
  return `<section class="section"><div class="container split"><div><span class="eyebrow">${escapeHtml(copy.common.whatYouCanResearch)}</span><h2>${escapeHtml(copy.common.supportedWorkflows)}</h2><p>${escapeHtml(format(copy.marketplace.decisionText, variables))}</p><ul class="check-list">${renderWorkflowList(marketplace, copy)}</ul></div><div class="visual-panel"><img src="/assets/${marketplace.asset}" alt="${escapeHtml(`${variables.marketplace} ${copy.common.overview}`)}" width="${marketplace.assetWidth}" height="${marketplace.assetHeight}" loading="eager" decoding="async" /></div></div></section>
  ${regional ? `<section class="section tinted"><div class="container narrow"><span class="eyebrow">${escapeHtml(copy.common.regionCoverage)}</span><h2>${escapeHtml(`${variables.region} · ${variables.currency}`)}</h2><p>${escapeHtml(format(copy.marketplace.regionText, variables))}</p><p>${escapeHtml(copy.regionContexts[page.regionKey])}</p></div></section>` : `<section class="section tinted"><div class="container"><span class="eyebrow">${escapeHtml(copy.common.availableRegions)}</span><div class="card-grid compact">${regionCards}</div></div></section>`}
  <section class="section"><div class="container narrow"><span class="eyebrow">${escapeHtml(copy.common.faq)}</span><div class="faq-list"><details open><summary>${escapeHtml(format(regional ? copy.marketplace.regionFaqQ : copy.marketplace.faqOneQ, variables))}</summary><p>${escapeHtml(format(regional ? copy.marketplace.regionFaqA : copy.marketplace.faqOneA, variables))}</p></details><details><summary>${escapeHtml(format(copy.marketplace.faqTwoQ, variables))}</summary><p>${escapeHtml(format(copy.marketplace.faqTwoA, variables))}</p></details></div></div></section>`;
}

function renderFeaturePage(page, locale, copy) {
  const feature = FEATURES[page.featureKey];
  const variables = pageVariables(page, copy);
  const marketplaceAvailability = page.featureKey === 'store-research'
    ? 'Lazada · Shopee · Temu · TikTok Shop'
    : page.featureKey === 'market-radar'
      ? 'Lazada · Shopee · TikTok Shop'
      : 'Alibaba · Amazon · Lazada · Shopee · Temu · TikTok Shop';
  return `<section class="section"><div class="container split"><div><span class="eyebrow">${escapeHtml(copy.common.howItWorks)}</span><h2>${escapeHtml(copy.common.builtFor)}</h2><p>${escapeHtml(format(copy.feature.steps, variables))}</p><p>${escapeHtml(format(copy.feature.value, variables))}</p><div class="availability"><strong>${escapeHtml(copy.common.updated)}</strong><span>${escapeHtml(marketplaceAvailability)}</span></div></div><div class="visual-panel"><img src="/assets/${feature.asset}" alt="${escapeHtml(copy.featureNames[page.featureKey])}" width="1000" height="625" loading="eager" decoding="async" /></div></div></section>
  <section class="section tinted"><div class="container narrow"><span class="eyebrow">${escapeHtml(copy.common.faq)}</span><div class="faq-list"><details open><summary>${escapeHtml(format(copy.feature.faqQ, variables))}</summary><p>${escapeHtml(format(copy.feature.faqA, variables))}</p></details></div></div></section>`;
}

function getApiQuery(page) {
  const marketplace = MARKETPLACES[page.marketplaceKey];
  const regionKey = page.regionKey ?? marketplace.apiRegions[0];
  const region = REGIONS[regionKey];
  const parameters = new URLSearchParams({
    platform: page.marketplaceKey,
    query: 'wireless earbuds',
    page: '1',
  });
  if (marketplace.regionParameter) parameters.set('country', region.code);
  return parameters.toString();
}

function getApiParameterSummary(marketplaceKey) {
  const parameters = {
    alibaba: {
      search: 'platform, query, page=1, pageSize?',
      category: 'platform, categoryId, page=1, tab?, deliveryId?, pageDeduplicateId?',
    },
    amazon: {
      search: 'platform, query, page=1, sort?',
      category: 'platform, categoryId, page=1',
    },
    lazada: {
      search: 'platform, query, country, page=1, sort?',
      category: 'platform, categoryId, country, page=1, sort?',
    },
    shopee: {
      search: 'platform, query, country, page=1, filters?',
      category: 'platform, categoryId, country, categoryLevel=2, page=1',
    },
    temu: {
      search: 'platform, query, page=1, sort?',
      category: 'platform, categoryId, page=1, sort?',
    },
    tiktok: {
      search: 'platform, query, country, page=1, sort?',
      category: 'platform, categoryId, country, page=1',
    },
  };
  return parameters[marketplaceKey];
}

function renderApiPage(page, locale, copy) {
  const marketplace = MARKETPLACES[page.marketplaceKey];
  const regionKey = page.regionKey ?? marketplace.apiRegions[0];
  const variables = pageVariables(page, copy);
  const query = getApiQuery(page);
  const responseExample = getApiResponseExample(page.marketplaceKey, regionKey);
  const parameterSummary = getApiParameterSummary(page.marketplaceKey);
  const command = `curl --get 'https://api.ecomblade.com/api/v1/products/search?${query}' \\\n  --header 'Authorization: Bearer $ECOMBLADE_API_KEY'`;
  const regionCards = marketplace.apiRegions
    .map((regionKey) =>
      renderCard(
        {
          path: `/api/${marketplace.slug}/${regionKey}/`,
          title: copy.regionNames[regionKey],
          description: format(copy.api.regionDescription, {
            marketplace: copy.marketplaceNames[page.marketplaceKey],
            region: copy.regionNames[regionKey],
            code: REGIONS[regionKey].code,
          }),
        },
        locale,
        copy,
      ),
    )
    .join('');
  const regionFaqAnswer = marketplace.regionParameter
    ? copy.api.regionFaqA
    : copy.api.implicitRegionFaqA;
  return `<section class="section"><div class="container api-grid"><div><span class="eyebrow">${escapeHtml(copy.common.authentication)}</span><h2>${escapeHtml(copy.common.apiAccess)}</h2><p>${escapeHtml(format(copy.api.authText, variables))}</p><div class="endpoint-list"><div><span>GET</span><code>/api/v1/products/search</code><small>${escapeHtml(copy.common.search)} · ${escapeHtml(parameterSummary.search)}</small></div><div><span>GET</span><code>/api/v1/products/category</code><small>${escapeHtml(copy.common.categoryEndpoint)} · ${escapeHtml(parameterSummary.category)}</small></div></div></div><div class="code-panel"><div>${escapeHtml(copy.common.codeExample)}</div><pre><code>${escapeHtml(command)}</code></pre></div></div></section>
  <section class="section response-example"><div class="container"><span class="eyebrow">${escapeHtml(copy.common.apiResponses)}</span><h2>${escapeHtml(copy.common.responseExample)}</h2><p>${escapeHtml(format(copy.api.responseText, variables))}</p><div class="code-panel"><div>JSON</div><pre><code>${escapeHtml(responseExample)}</code></pre></div></div></section>
  <section class="section tinted"><div class="container two-column"><div><h2>${escapeHtml(copy.common.metrics)}</h2><p>${escapeHtml(format(copy.api.responseText, variables))}</p></div><div><h2>${escapeHtml(copy.common.errors)}</h2><p>${escapeHtml(format(copy.api.errorsText, variables))}</p></div></div></section>
  ${page.kind === 'api-marketplace' ? `<section class="section"><div class="container"><span class="eyebrow">${escapeHtml(copy.common.availableRegions)}</span><div class="card-grid compact">${regionCards}</div></div></section>` : ''}
  <section class="section"><div class="container narrow"><span class="eyebrow">${escapeHtml(copy.common.faq)}</span><div class="faq-list"><details open><summary>${escapeHtml(format(copy.api.faqQ, variables))}</summary><p>${escapeHtml(format(copy.api.faqA, variables))}</p></details>${page.kind === 'api-region' ? `<details><summary>${escapeHtml(format(copy.api.regionFaqQ, variables))}</summary><p>${escapeHtml(format(regionFaqAnswer, variables))}</p></details>` : ''}</div></div></section>`;
}

function renderPricingPage(locale, copy) {
  const landing = (key) => LANDING_TRANSLATIONS[key][locale.key];
  const planFeature = (label, status = 'included') =>
    `<li class="pricing-feature ${status}">${escapeHtml(label)}</li>`;

  return `<section id="plans" class="section tinted"><div class="container"><div class="pricing-grid">
    <article class="pricing-card"><h2>${escapeHtml(landing('free'))}</h2><div class="pricing-price"><strong>$0</strong><span>${escapeHtml(landing('forever'))}</span></div><ul>${[
      planFeature(landing('marketplaces_countries')),
      planFeature(landing('searches_5'), 'limited'),
      planFeature(landing('results_20'), 'limited'),
      planFeature(landing('limited_ai'), 'limited'),
      planFeature(landing('exports_not'), 'excluded'),
      planFeature(landing('api_platform_not'), 'excluded'),
    ].join('')}</ul><a class="button secondary large" href="https://app.ecomblade.com/register?language=${locale.appLanguage}">${escapeHtml(copy.nav.start)}</a></article>
    <article class="pricing-card featured"><span class="pricing-tag">${escapeHtml(landing('popular'))}</span><h2>Pro</h2><div class="pricing-price"><strong>$19</strong><span>${escapeHtml(landing('month'))}</span></div><ul>${[
      planFeature(landing('marketplaces_countries')),
      planFeature(landing('unlimited_searches')),
      planFeature(landing('full_results')),
      planFeature(landing('full_ai')),
      planFeature(landing('exports_included')),
      planFeature(landing('api_platform_access')),
    ].join('')}</ul><a class="button primary large" href="https://app.ecomblade.com/register?language=${locale.appLanguage}">${escapeHtml(copy.nav.start)}</a></article>
  </div></div></section>
  <section class="section"><div class="container narrow"><span class="eyebrow">${escapeHtml(copy.common.faq)}</span><div class="faq-list"><details open><summary>${escapeHtml(landing('faq_q4'))}</summary><p>${escapeHtml(landing('faq_a4'))}</p></details><details><summary>${escapeHtml(landing('faq_q6'))}</summary><p>${escapeHtml(landing('faq_a6'))}</p></details></div></div></section>`;
}

function relatedPages(page) {
  if (page.kind.startsWith('marketplace')) {
    return ENTRY_PAGES.filter(
      (candidate) => candidate.kind === 'marketplace' && candidate.path !== page.path,
    ).slice(0, 3);
  }
  if (page.kind === 'feature') {
    return ENTRY_PAGES.filter(
      (candidate) => candidate.kind === 'feature' && candidate.path !== page.path,
    ).slice(0, 3);
  }
  if (page.kind.startsWith('api')) {
    return ENTRY_PAGES.filter(
      (candidate) => candidate.kind === 'api-marketplace' && candidate.path !== page.path,
    ).slice(0, 3);
  }
  return [];
}

function getRelatedTitle(candidate, copy) {
  if (candidate.kind === 'marketplace') return copy.marketplaceNames[candidate.marketplaceKey];
  if (candidate.kind === 'feature') return copy.featureNames[candidate.featureKey];
  if (candidate.kind === 'api-marketplace') {
    return format(copy.api.title, { marketplace: copy.marketplaceNames[candidate.marketplaceKey] });
  }
  return copy.nav[candidate.section];
}

function renderRelated(page, locale, copy) {
  const candidates = relatedPages(page);
  if (!candidates.length) return '';
  return `<section class="section related-section"><div class="container"><span class="eyebrow">${escapeHtml(copy.common.related)}</span><div class="related-links">${candidates.map((candidate) => `<a href="${getLocalizedPath(candidate.path, locale)}"><span>${escapeHtml(getRelatedTitle(candidate, copy))}</span><b aria-hidden="true">→</b></a>`).join('')}</div></div></section>`;
}

function renderCta(page, locale, copy) {
  const isApi = page.kind.startsWith('api') || (page.kind === 'hub' && page.section === 'api');
  return `<section class="cta"><div class="container"><h2>${escapeHtml(isApi ? copy.common.apiAccess : copy.common.getStarted)}</h2><p>${escapeHtml(isApi ? copy.common.apiStartDescription : copy.common.startDescription)}</p><a class="button primary large" href="https://app.ecomblade.com/register?language=${locale.appLanguage}">${escapeHtml(isApi ? copy.common.apiAccess : copy.nav.start)}</a><small>${escapeHtml(copy.common.noCreditCard)}</small></div></section>`;
}

function renderFooter(locale, copy) {
  return `<footer><div class="container footer-grid"><div><img src="/assets/white-EB-logo-nav.svg" alt="Ecomblade" width="120" height="30" /><p>${escapeHtml(copy.common.footerTagline)}</p></div><div><h2>${escapeHtml(copy.nav.marketplaces)}</h2><a href="${getLocalizedPath('/marketplaces/', locale)}">${escapeHtml(copy.common.viewAll)}</a><a href="${getLocalizedPath('/features/', locale)}">${escapeHtml(copy.nav.features)}</a><a href="${getLocalizedPath('/api/', locale)}">${escapeHtml(copy.nav.api)}</a><a href="${getLocalizedPath('/pricing/', locale)}">${escapeHtml(copy.nav.pricing)}</a></div><div><h2>${escapeHtml(copy.common.company)}</h2><a href="/about/">${escapeHtml(copy.common.about)}</a><a href="/contact/">${escapeHtml(copy.common.contact)}</a></div><div><h2>${escapeHtml(copy.common.legal)}</h2><a href="/terms-and-conditions/">${escapeHtml(copy.common.terms)}</a><a href="/refund-policy/">${escapeHtml(copy.common.refund)}</a><a href="/privacy/">${escapeHtml(copy.common.privacy)}</a></div></div><div class="container copyright">${escapeHtml(copy.common.rights)}</div></footer>`;
}

function structuredData(page, locale, meta, copy) {
  const url = getCanonicalUrl(page.path, locale);
  const crumbs = getBreadcrumbs(page, copy);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'Ecomblade',
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/assets/EB-logo-nav.png`,
        email: 'support@ecomblade.com',
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: 'Ecomblade',
        publisher: { '@id': `${SITE_URL}/#organization` },
        inLanguage: locale.htmlLanguage,
      },
      {
        '@type': page.kind === 'hub' ? 'CollectionPage' : 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: meta.title,
        description: meta.description,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${SITE_URL}/#organization` },
        inLanguage: locale.htmlLanguage,
        breadcrumb: { '@id': `${url}#breadcrumb` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: crumbs.map((crumb, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: crumb.label,
          item: getCanonicalUrl(crumb.path, locale),
        })),
      },
    ],
  };
}

function renderBody(page, locale, copy) {
  if (page.kind === 'hub') return renderHub(page, locale, copy);
  if (page.kind === 'pricing') return renderPricingPage(locale, copy);
  if (page.kind.startsWith('marketplace')) return renderMarketplacePage(page, locale, copy);
  if (page.kind === 'feature') return renderFeaturePage(page, locale, copy);
  return renderApiPage(page, locale, copy);
}

export function renderEntryPage(page, locale, analyticsPath = '/src/analytics.js') {
  const copy = getEntryTranslations(locale.key);
  const meta = getPageMeta(page, copy, locale);
  const canonical = getCanonicalUrl(page.path, locale);
  const eyebrow = page.kind === 'feature'
    ? copy.feature.eyebrow
    : page.kind.startsWith('api') || (page.kind === 'hub' && page.section === 'api')
      ? copy.api.eyebrow
      : page.kind.startsWith('marketplace')
        ? copy.marketplace.eyebrow
        : page.kind === 'pricing'
          ? copy.nav.pricing
          : copy.common.overview;
  const jsonLd = JSON.stringify(structuredData(page, locale, meta, copy)).replaceAll('<', '\\u003c');

  return `<!doctype html>
<html lang="${locale.htmlLanguage}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(meta.title)}</title>
  <meta name="description" content="${escapeHtml(meta.description)}" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <link rel="canonical" href="${canonical}" />
  ${renderLanguageAlternates(page)}
  <link rel="icon" href="/favicon.ico" sizes="any" />
  <meta name="theme-color" content="#07110f" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Ecomblade" />
  <meta property="og:title" content="${escapeHtml(meta.title)}" />
  <meta property="og:description" content="${escapeHtml(meta.description)}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${SITE_URL}/assets/og-ecomblade.webp" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="Ecomblade marketplace product research" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(meta.title)}" />
  <meta name="twitter:description" content="${escapeHtml(meta.description)}" />
  <meta name="twitter:image" content="${SITE_URL}/assets/og-ecomblade.webp" />
  <script type="application/ld+json">${jsonLd}</script>
  <script type="module" src="${analyticsPath}"></script>
  <link rel="preload" href="/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin />
  <style>${ENTRY_PAGE_STYLES}</style>
</head>
<body>
  ${renderNavigation(page, locale, copy)}
  <main>
    <header class="hero"><div class="container">${renderBreadcrumbs(page, locale, copy)}<span class="eyebrow">${escapeHtml(eyebrow)}</span><h1>${escapeHtml(meta.h1)}</h1><p>${escapeHtml(meta.intro)}</p><div class="hero-actions"><a class="button primary large" href="https://app.ecomblade.com/register?language=${locale.appLanguage}">${escapeHtml(copy.nav.start)}</a><a class="button secondary large" href="${page.kind === 'pricing' ? '#plans' : getLocalizedPath(page.kind.startsWith('api') ? '/api/' : page.kind.startsWith('marketplace') ? '/marketplaces/' : '/features/', locale)}">${escapeHtml(copy.common.overview)}</a></div></div></header>
    ${renderBody(page, locale, copy)}
    ${renderRelated(page, locale, copy)}
    ${renderCta(page, locale, copy)}
  </main>
  ${renderFooter(locale, copy)}
</body>
</html>`;
}

const ENTRY_PAGE_STYLES = `
@font-face{font-family:Inter;font-style:normal;font-weight:300 700;font-display:swap;src:url('/fonts/inter-latin.woff2') format('woff2')}
:root{--accent:#00a088;--accent-dark:#007f70;--accent-bg:rgba(0,160,136,.1);--ink:#07110f;--muted:#5a7570;--surface:#f5faf9;--border:rgba(7,17,15,.1);--dark:#07110f;--font:Inter,system-ui,-apple-system,sans-serif}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;color:var(--ink);background:#fff;font-family:var(--font);font-size:16px;line-height:1.65}a{color:inherit}.container{width:min(1120px,calc(100% - 40px));margin-inline:auto}.narrow{width:min(760px,100%)}.site-nav{position:sticky;top:0;z-index:20;background:rgba(255,255,255,.94);border-bottom:1px solid var(--border);backdrop-filter:blur(14px)}.nav-inner{height:72px;display:flex;align-items:center;gap:36px}.logo{display:flex}.logo img{display:block}.nav-links{display:flex;align-items:center;gap:26px;margin-right:auto}.nav-links a{text-decoration:none;color:#36504b;font-size:14px;font-weight:550}.nav-links a:hover{color:var(--accent-dark)}.nav-actions{display:flex;align-items:center;gap:10px}.button{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 18px;border-radius:9px;border:1px solid transparent;text-decoration:none;font-weight:650;font-size:14px;transition:.18s ease}.button.primary{color:#fff;background:var(--accent)}.button.primary:hover{background:var(--accent-dark);transform:translateY(-1px)}.button.secondary{background:#fff;border-color:rgba(7,17,15,.18)}.button.large{min-height:50px;padding:0 24px;font-size:15px}.language-menu{position:relative}.language-menu summary{display:flex;gap:7px;align-items:center;cursor:pointer;list-style:none;padding:8px;border-radius:8px;font-size:13px}.language-menu summary::-webkit-details-marker{display:none}.language-options{position:absolute;right:0;top:44px;width:220px;padding:8px;background:#fff;border:1px solid var(--border);border-radius:12px;box-shadow:0 18px 50px rgba(7,17,15,.15)}.language-options a{display:block;padding:8px 10px;text-decoration:none;border-radius:7px;font-size:13px}.language-options a:hover,.language-options a[aria-current=page]{background:var(--surface);color:var(--accent-dark)}.mobile-menu{display:none;position:relative}.mobile-menu summary{display:grid;width:36px;height:36px;place-items:center;border:1px solid var(--border);border-radius:8px;background:#fff;cursor:pointer;list-style:none}.mobile-menu summary::-webkit-details-marker{display:none}.mobile-menu summary:focus-visible{outline:2px solid var(--accent);outline-offset:2px}.mobile-menu-panel{position:absolute;right:0;top:44px;display:grid;width:min(260px,calc(100vw - 32px));padding:8px;border:1px solid var(--border);border-radius:12px;background:#fff;box-shadow:0 18px 50px rgba(7,17,15,.15)}.mobile-menu-panel a{padding:10px 12px;border-radius:7px;text-decoration:none;color:#36504b;font-size:14px;font-weight:600}.mobile-menu-panel a:hover,.mobile-menu-panel a:focus-visible{background:var(--surface);color:var(--accent-dark)}.hero{padding:72px 0 84px;background:radial-gradient(circle at 80% 10%,rgba(0,160,136,.13),transparent 34%),linear-gradient(180deg,#fff,#f8fcfb)}.breadcrumbs{margin-bottom:52px}.breadcrumbs ol{display:flex;flex-wrap:wrap;gap:7px;list-style:none;margin:0;padding:0;color:var(--muted);font-size:13px}.breadcrumbs li+li:before{content:'/';margin-right:7px;opacity:.5}.breadcrumbs a{text-decoration:none}.eyebrow{display:block;margin-bottom:12px;color:var(--accent-dark);font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}.hero h1{max-width:840px;margin:0;font-size:clamp(42px,6vw,72px);line-height:1.04;letter-spacing:-.045em}.hero>div>p{max-width:720px;margin:24px 0 0;color:var(--muted);font-size:clamp(18px,2vw,21px);line-height:1.6}.hero-actions{display:flex;gap:12px;margin-top:34px}.section{padding:86px 0}.section.tinted{background:var(--surface)}.section h2{margin:0 0 18px;font-size:clamp(27px,3vw,40px);line-height:1.15;letter-spacing:-.03em}.section p{color:var(--muted);margin:0 0 18px}.card-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}.card-grid.compact{margin-top:28px}.card{overflow:hidden;background:#fff;border:1px solid var(--border);border-radius:15px;box-shadow:0 5px 24px rgba(7,17,15,.04)}.card-image{aspect-ratio:16/7;background:linear-gradient(135deg,#edf8f6,#f8fbfa);overflow:hidden}.card-image:empty{display:none}.card-image img{width:100%;height:100%;object-fit:cover}.card-body{padding:24px}.card h2{font-size:20px;margin-bottom:10px}.card p{font-size:14px;min-height:68px}.text-link{color:var(--accent-dark);font-weight:700;text-decoration:none;font-size:14px}.split,.api-grid,.two-column{display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:70px}.two-column{align-items:start}.visual-panel{overflow:hidden;border:1px solid var(--border);border-radius:16px;background:var(--surface);box-shadow:0 24px 60px rgba(7,17,15,.09)}.visual-panel img{display:block;width:100%;height:auto}.check-list{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:26px 0 0;padding:0;list-style:none}.check-list li{padding:12px 14px;border-radius:9px;background:var(--surface);font-weight:600}.check-list li:before{content:'✓';color:var(--accent);margin-right:9px}.availability{display:flex;flex-direction:column;gap:4px;margin-top:28px;padding:18px;border:1px solid var(--border);border-radius:12px;background:#fff}.availability span{color:var(--muted)}.pricing-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px;max-width:820px;margin:auto}.pricing-card{position:relative;display:flex;flex-direction:column;padding:34px;border:1px solid var(--border);border-radius:16px;background:#fff;box-shadow:0 8px 30px rgba(7,17,15,.05)}.pricing-card.featured{border-color:rgba(0,160,136,.45);box-shadow:0 18px 50px rgba(0,160,136,.12)}.pricing-tag{position:absolute;top:0;left:50%;transform:translate(-50%,-50%);padding:4px 12px;border:1px solid rgba(0,160,136,.3);border-radius:999px;background:#e9f8f5;color:var(--accent-dark);font-size:11px;font-weight:750;text-transform:uppercase;letter-spacing:.08em}.pricing-card h2{font-size:24px}.pricing-price{display:flex;align-items:baseline;gap:6px;margin:4px 0 28px}.pricing-price strong{font-size:48px;line-height:1;letter-spacing:-.05em}.pricing-price span{color:var(--muted)}.pricing-card ul{display:grid;gap:12px;margin:0 0 30px;padding:0;list-style:none;flex:1}.pricing-feature{display:flex;gap:10px;align-items:flex-start;color:var(--ink);font-size:14px}.pricing-feature:before{content:"✓";color:var(--accent-dark);font-weight:800}.pricing-feature.limited:before{content:"!";color:#b86d00}.pricing-feature.excluded{color:var(--muted)}.pricing-feature.excluded:before{content:"×";color:#b34545}.faq-list{display:grid;gap:12px;margin-top:26px}.faq-list details{border:1px solid var(--border);border-radius:12px;padding:20px 22px;background:#fff}.faq-list summary{cursor:pointer;font-weight:700}.faq-list details p{margin:12px 0 0}.endpoint-list{display:grid;gap:10px;margin-top:26px}.endpoint-list div{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;padding:14px;border:1px solid var(--border);border-radius:10px}.endpoint-list span{grid-row:1/3;color:var(--accent-dark);font-weight:800;font-size:12px}.endpoint-list code{font-size:13px}.endpoint-list small{color:var(--muted)}.code-panel{overflow:hidden;color:#d9f4ef;background:#07110f;border-radius:15px;box-shadow:0 24px 60px rgba(7,17,15,.15)}.code-panel>div{padding:14px 18px;border-bottom:1px solid rgba(255,255,255,.1);color:#80dccc;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em}.code-panel pre{overflow:auto;margin:0;padding:24px;font-size:13px;line-height:1.7}.response-example .code-panel{margin-top:28px}.response-example .code-panel pre{max-height:560px}.related-section{border-top:1px solid var(--border)}.related-links{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.related-links a{display:flex;justify-content:space-between;align-items:center;padding:20px;border:1px solid var(--border);border-radius:12px;text-decoration:none;font-weight:650}.related-links a:hover{border-color:rgba(0,160,136,.45);color:var(--accent-dark)}.cta{padding:92px 0;text-align:center;background:linear-gradient(135deg,#e9f8f5,#f7fbfa)}.cta h2{margin:0;font-size:clamp(32px,4vw,50px);letter-spacing:-.04em}.cta p{max-width:620px;margin:18px auto 26px}.cta small{display:block;margin-top:12px;color:var(--muted)}footer{padding:68px 0 24px;color:#c5d4d1;background:var(--dark)}.footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:40px}.footer-grid p{max-width:340px;color:#879c98}.footer-grid h2{margin:0 0 14px;color:#fff;font-size:13px;text-transform:uppercase;letter-spacing:.08em}.footer-grid a{display:block;margin:8px 0;color:#a9bbb7;text-decoration:none;font-size:14px}.copyright{margin-top:50px;padding-top:20px;border-top:1px solid rgba(255,255,255,.1);font-size:12px;color:#718682}
@media(max-width:900px){.nav-links{display:none}.nav-inner{gap:12px}.nav-actions{margin-left:auto}.desktop-action{display:none}.mobile-menu{display:block}.card-grid{grid-template-columns:repeat(2,1fr)}.split,.api-grid{grid-template-columns:1fr;gap:40px}.footer-grid{grid-template-columns:2fr 1fr 1fr}.footer-grid>div:last-child{grid-column:2}.hero{padding-top:48px}.breadcrumbs{margin-bottom:36px}}
@media(max-width:620px){.container{width:min(100% - 28px,1120px)}.nav-inner{height:60px;gap:7px}.nav-actions{gap:5px}.site-nav .button{min-height:34px;padding:0 10px;font-size:12px}.language-menu summary{padding:5px;min-height:34px;width:34px;justify-content:center}.language-menu summary span:last-child{display:none}.pricing-grid{grid-template-columns:1fr}.pricing-card{padding:28px 22px}.hero{padding:38px 0 60px}.hero h1{font-size:39px}.hero-actions{align-items:stretch;flex-direction:column}.card-grid,.two-column,.related-links,.footer-grid{grid-template-columns:1fr}.footer-grid>div:last-child{grid-column:auto}.section{padding:62px 0}.check-list{grid-template-columns:1fr}.card p{min-height:0}.api-grid{gap:32px}.code-panel pre{font-size:11px}.nav-actions{gap:4px}}
`;
