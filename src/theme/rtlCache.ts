import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import createCache from '@emotion/cache';

// Create RTL cache for Arabic language support
// This cache uses the rtlPlugin to automatically transform CSS properties
// for right-to-left languages (e.g., margin-left becomes margin-right)
export const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

// Create LTR cache for English and other left-to-right languages
// This is the default cache without RTL transformations
export const cacheLtr = createCache({
  key: 'muiltr',
  stylisPlugins: [prefixer],
});
