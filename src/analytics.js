const FACEBOOK_PIXEL_ID = "1647266143173474";
const GOOGLE_ANALYTICS_ID = "G-D3V9KWW4E5";
const POSTHOG_API_KEY = "phc_yiBBMJPczJbKvPR7KWj7sT294Rh3Rj5GpzbVZ3efHcBw";
const TIKTOK_PIXEL_ID = "D88L833C77UEB8QVUR50";

function loadGoogleAnalytics() {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };

  window.gtag("js", new Date());
  window.gtag("config", GOOGLE_ANALYTICS_ID);

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`;
  document.head.appendChild(script);
}

function loadFacebookPixel() {
  if (!window.fbq) {
    const fbq = function fbq() {
      if (fbq.callMethod) {
        fbq.callMethod.apply(fbq, arguments);
        return;
      }

      fbq.queue.push(arguments);
    };

    window._fbq = fbq;
    window.fbq = fbq;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);
  }

  window.fbq("init", FACEBOOK_PIXEL_ID);
  window.fbq("track", "PageView");
}

function loadTikTokPixel() {
  window.TiktokAnalyticsObject = "ttq";
  const ttq = (window.ttq = window.ttq || []);
  const methods = [
    "page",
    "track",
    "identify",
    "instances",
    "debug",
    "on",
    "off",
    "once",
    "ready",
    "alias",
    "group",
    "enableCookie",
    "disableCookie",
  ];

  function setAndDefer(target, method) {
    target[method] = function deferredMethod() {
      target.push([method].concat(Array.from(arguments)));
    };
  }

  methods.forEach((method) => setAndDefer(ttq, method));

  ttq.instance = function instance(pixelId) {
    const instanceQueue = ttq._i[pixelId] || [];
    methods.forEach((method) => setAndDefer(instanceQueue, method));
    return instanceQueue;
  };

  ttq.load = function load(pixelId, options) {
    const source = "https://analytics.tiktok.com/i18n/pixel/events.js";
    ttq._i = ttq._i || {};
    ttq._i[pixelId] = [];
    ttq._i[pixelId]._u = source;
    ttq._t = ttq._t || {};
    ttq._t[pixelId] = Date.now();
    ttq._o = ttq._o || {};
    ttq._o[pixelId] = options || {};

    const script = document.createElement("script");
    script.async = true;
    script.src = `${source}?sdkid=${pixelId}&lib=ttq`;
    document.head.appendChild(script);
  };

  ttq.load(TIKTOK_PIXEL_ID);
  ttq.page();
}

async function loadPostHog() {
  const { default: posthog } = await import("posthog-js");

  posthog.init(POSTHOG_API_KEY, {
    api_host: "https://us.i.posthog.com",
    defaults: "2026-05-30",
    disable_product_tours: true,
    disable_surveys: true,
    disable_web_experiments: true,
  });
}

let hasStarted = false;

function startAnalytics() {
  if (hasStarted) return;
  hasStarted = true;

  loadGoogleAnalytics();
  loadFacebookPixel();
  loadTikTokPixel();
  loadPostHog();
}

const interactionEvents = ["keydown", "pointerdown", "scroll", "touchstart"];
interactionEvents.forEach((eventName) => {
  window.addEventListener(eventName, startAnalytics, {
    once: true,
    passive: true,
  });
});

window.setTimeout(startAnalytics, 12_000);
