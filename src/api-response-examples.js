const REGION_EXAMPLES = {
  indonesia: {
    code: 'id',
    currency: 'IDR',
    domain: 'co.id',
    lazadaRegion: 'lazada.co.id',
    location: 'Jakarta',
    price: 475000,
    originalPrice: 625000,
  },
  malaysia: {
    code: 'my',
    currency: 'MYR',
    domain: 'com.my',
    lazadaRegion: 'lazada.com.my',
    location: 'Kuala Lumpur',
    price: 129.9,
    originalPrice: 169.9,
  },
  philippines: {
    code: 'ph',
    currency: 'PHP',
    domain: 'ph',
    lazadaRegion: 'lazada.com.ph',
    location: 'Manila',
    price: 1699,
    originalPrice: 2299,
  },
  singapore: {
    code: 'sg',
    currency: 'SGD',
    domain: 'sg',
    lazadaRegion: 'lazada.sg',
    location: 'Singapore',
    price: 39.9,
    originalPrice: 52.9,
  },
  thailand: {
    code: 'th',
    currency: 'THB',
    domain: 'co.th',
    lazadaRegion: 'lazada.co.th',
    location: 'Bangkok',
    price: 999,
    originalPrice: 1299,
  },
  vietnam: {
    code: 'vn',
    currency: 'VND',
    domain: 'vn',
    lazadaRegion: 'lazada.vn',
    location: 'Ho Chi Minh City',
    price: 749000,
    originalPrice: 999000,
  },
  'united-states': {
    code: 'us',
    currency: 'USD',
    domain: 'com',
    lazadaRegion: null,
    location: 'United States',
    price: 29.99,
    originalPrice: 39.99,
  },
};

function monetaryTotal(price, quantity) {
  return Number((price * quantity).toFixed(2));
}

function commonProductExample(region) {
  return {
    itemId: 'prod-10001',
    name: 'Wireless Noise-Cancelling Earbuds',
    slug: 'wireless-noise-cancelling-earbuds',
    url: 'https://marketplace.example/products/prod-10001',
    brand: 'Example Audio',
    image: 'https://cdn.example.com/products/prod-10001.jpg',
    shopId: 'shop-501',
    shopName: 'Example Audio Official',
    price: region.price,
    originalPrice: region.originalPrice,
    discount: 25,
    currency: region.currency,
    sold: 1280,
    monthlySold: 340,
    totalSold: 4620,
    revenue: monetaryTotal(region.price, 1280),
    monthlyRevenue: monetaryTotal(region.price, 340),
    totalRevenue: monetaryTotal(region.price, 4620),
    listingDate: '2026-01-15T00:00:00.000Z',
    reviews: 894,
  };
}

export function getApiResponseExample(marketplaceKey, regionKey) {
  const region = REGION_EXAMPLES[regionKey];
  const product = commonProductExample(region);
  let data;

  if (marketplaceKey === 'alibaba') {
    data = {
      items: [{
        ...product,
        marketplaceData: {
          alibaba: {
            minPrice: 8.5,
            maxPrice: 12.75,
            supplierId: 'supplier-8801',
            supplierName: 'Example Electronics Co., Ltd.',
            supplierUrl: 'https://supplier.example.com/example-electronics',
            supplierYears: 7,
            supplierRating: 4.8,
            isGoldSupplier: true,
            isTradeAssurance: true,
            sellPoints: ['Bluetooth 5.4', 'Active noise cancellation'],
            productScore: 92.4,
            displayStarLevel: 4.8,
            tradeCount: 3210,
            reviewScore: 4.7,
            moq: '10 pieces',
            location: 'Shenzhen, China',
            minOrderValue: 85,
            maxOrderValue: 127.5,
          },
        },
      }],
      hasFullAccess: true,
      isLimited: false,
    };
  } else if (marketplaceKey === 'amazon') {
    data = {
      summary: { query: 'wireless earbuds', page: 1 },
      items: [{
        ...product,
        marketplaceData: {
          amazon: {
            rating: 4.6,
            isBestSeller: true,
            isAmazonChoice: false,
            location: region.location,
          },
        },
      }],
      hasFullAccess: true,
      isLimited: false,
    };
  } else if (marketplaceKey === 'lazada') {
    data = {
      region: region.lazadaRegion,
      items: [{
        ...product,
        marketplaceData: {
          lazada: {
            rating: 4.8,
            like: 920,
            comment: 415,
            stock: 680,
            stockValue: monetaryTotal(region.price, 680),
            location: region.location,
          },
        },
      }],
      hasFullAccess: true,
      isLimited: false,
    };
  } else if (marketplaceKey === 'shopee') {
    data = {
      status: 200,
      items: [{
        ...product,
        itemId: '10001234567',
        shopId: '500123456',
        slug: 'wireless-noise-cancelling-earbuds-i.500123456.10001234567',
        url: `https://shopee.${region.domain}/wireless-noise-cancelling-earbuds-i.500123456.10001234567`,
        image: 'https://cf.example.com/file/example-earbuds',
        discount: 24,
        marketplaceData: {
          shopee: {
            rating: 4.8,
            like: 1200,
            comment: 415,
            stock: 680,
            stockValue: monetaryTotal(region.price, 680),
            location: region.location,
          },
        },
      }],
      hasFullAccess: true,
      isLimited: false,
    };
  } else if (marketplaceKey === 'temu') {
    data = {
      items: [{
        ...product,
        marketplaceData: { temu: { rating: 4.7 } },
      }],
      hasFullAccess: true,
      isLimited: false,
    };
  } else {
    data = {
      region: region.code,
      items: [{
        ...product,
        marketplaceData: {
          tiktok: {
            rating: 4.8,
            like: 920,
            comment: 415,
            stock: 680,
            stockValue: monetaryTotal(region.price, 680),
            location: region.location,
          },
        },
      }],
      hasFullAccess: true,
      isLimited: false,
    };
  }

  return JSON.stringify({ success: true, data }, null, 2);
}
