if (!self.define) {
  let e,
    s = {}
  const n = (n, i) => (
    (n = new URL(n + '.js', i).href),
    s[n] ||
      new Promise((s) => {
        if ('document' in self) {
          const e = document.createElement('script')
          ;((e.src = n), (e.onload = s), document.head.appendChild(e))
        } else ((e = n), importScripts(n), s())
      }).then(() => {
        let e = s[n]
        if (!e) throw new Error(`Module ${n} didn’t register its module`)
        return e
      })
  )
  self.define = (i, t) => {
    const o = e || ('document' in self ? document.currentScript.src : '') || location.href
    if (s[o]) return
    let c = {}
    const r = (e) => n(e, o),
      l = { module: { uri: o }, exports: c, require: r }
    s[o] = Promise.all(i.map((e) => l[e] || r(e))).then((e) => (t(...e), c))
  }
}
define(['./workbox-28240d0c'], function (e) {
  'use strict'
  ;(self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        { url: 'assets/app-icon-CxkK-GLC.svg', revision: null },
        { url: 'assets/apple-touch-icon-B9ql5UXy.png', revision: null },
        { url: 'assets/main-CMT3No2m.css', revision: null },
        { url: 'assets/main-P1cdieos.js', revision: null },
        { url: 'assets/manifest-CQzL2OBB.json', revision: null },
        { url: 'index.html', revision: 'e25d9458eb7ba0fad04f6c126b3cbee2' },
        { url: 'registerSW.js', revision: '1872c500de691dce40960bb85481de07' },
        { url: 'manifest.webmanifest', revision: 'b565746b411342dfe93efd435cb2a078' },
      ],
      {}
    ),
    e.cleanupOutdatedCaches(),
    e.registerRoute(new e.NavigationRoute(e.createHandlerBoundToURL('index.html'))),
    e.registerRoute(
      /^https:\/\/world\.openfoodfacts\.org\/api/,
      new e.NetworkFirst({
        cacheName: 'api-cache',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 604800 }),
          new e.CacheableResponsePlugin({ statuses: [0, 200] }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /^https:\/\/unpkg\.com/,
      new e.CacheFirst({
        cacheName: 'unpkg-cache',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 2592e3 }),
          new e.CacheableResponsePlugin({ statuses: [0, 200] }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /^https:\/\/cdn\.tailwindcss\.com/,
      new e.CacheFirst({
        cacheName: 'tailwind-cache',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 2592e3 }),
          new e.CacheableResponsePlugin({ statuses: [0, 200] }),
        ],
      }),
      'GET'
    ))
})
