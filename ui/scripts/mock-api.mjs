// Tiny mock of the RustXNG JSON API, for UI smoke-testing ONLY.
// Serves the exact response shape of GET /search?format=json, plus
// /autocompleter and /healthz, on the port RustXNG normally uses.
// Usage:  node scripts/mock-api.mjs [port]   (default 29483)
// Then run `npm run preview` (or `npm run dev`) in another terminal —
// Vite proxies /api/* to this mock — and open http://127.0.0.1:4173/
//
// This is NOT a real RustXNG server: results are canned, image URLs point
// at picsum.photos (one thumbnail is a /image_proxy?... URL, as RustXNG
// returns), and there is no real search, ranking, or engine fan-out.

import http from 'node:http'

const port = Number(process.argv[2] || process.env.PORT || 29483)

const TEXT_RESULTS = [
  {
    url: 'https://en.wikipedia.org/wiki/Cat',
    title: 'Cat - Wikipedia',
    content: 'The cat is a domestic species of small carnivorous mammal. It is the only domesticated species of the family Felidae.',
    engine: 'wikipedia',
    engines: ['wikipedia', 'duckduckgo'],
    category: 'general',
    score: 1.0,
    publishedDate: '2026-11-01',
    template: 'default.html',
  },
  {
    url: 'https://example.com/cats-guide',
    title: 'A Guide to Cats — Example',
    content: 'Everything you need to know about caring for a cat, from feeding to play.',
    engine: 'duckduckgo',
    engines: ['duckduckgo'],
    category: 'general',
    score: 0.8,
    publishedDate: '2026-10-20',
    template: 'default.html',
  },
  {
    url: 'https://example.org/cat-photos',
    title: 'Cat photos and facts',
    content: 'Browse photos of cats and learn fun facts about different breeds.',
    engine: 'brave',
    engines: ['brave'],
    category: 'general',
    score: 0.6,
    template: 'default.html',
  },
]

const IMAGE_RESULTS = [
  {
    url: 'https://example.com/cat-1',
    title: 'Orange tabby cat sitting in the sun',
    content: 'An orange tabby cat sitting in the sun.',
    img_src: 'https://picsum.photos/seed/cat1/800/600',
    thumbnail: '/image_proxy?url=https%3A%2F%2Fpicsum.photos%2Fseed%2Fcat1%2F400%2F300',
    engine: 'duckduckgo',
    engines: ['duckduckgo'],
    category: 'images',
    score: 1.0,
    template: 'images.html',
  },
  {
    url: 'https://example.org/cat-2',
    title: 'Kitten looking at the camera',
    content: 'A small kitten looking directly at the camera.',
    img_src: 'https://picsum.photos/seed/cat2/800/600',
    thumbnail: 'https://picsum.photos/seed/cat2/400/300',
    engine: 'brave',
    engines: ['brave'],
    category: 'images',
    score: 0.9,
    template: 'images.html',
  },
  {
    url: 'https://example.net/cat-3',
    title: 'Two cats sleeping together',
    content: 'Two cats curled up asleep on a blanket.',
    img_src: 'https://picsum.photos/seed/cat3/800/600',
    thumbnail: 'https://picsum.photos/seed/cat3/400/300',
    engine: 'qwant',
    engines: ['qwant'],
    category: 'images',
    score: 0.7,
    template: 'images.html',
  },
]

const SUGGESTIONS = ['cats', 'cat breeds', 'cat care', 'cat photos', 'kittens', 'cat food']

function json(res, obj, status = 200) {
  const body = JSON.stringify(obj)
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) })
  res.end(body)
}

const server = http.createServer((req, res) => {
  const u = new URL(req.url || '/', `http://127.0.0.1:${port}`)
  if (u.pathname === '/healthz') return json(res, { status: 'ok' })
  if (u.pathname === '/autocompleter') {
    const q = (u.searchParams.get('q') || '').toLowerCase()
    return json(res, SUGGESTIONS.filter((s) => s.includes(q)).slice(0, 5))
  }
  if (u.pathname === '/search') {
    const q = u.searchParams.get('q') || ''
    const categories = u.searchParams.get('categories') || 'general'
    const isImages = categories === 'images'
    return json(res, {
      query: q,
      number_of_results: 3,
      results: isImages ? IMAGE_RESULTS : TEXT_RESULTS,
      answers: [],
      corrections: q === 'cts' ? ['cats'] : [],
      suggestions: isImages ? [] : ['cats', 'cat breeds'],
      infoboxes: [],
      unresponsive_engines: isImages ? [] : [['bing']],
    })
  }
  if (u.pathname === '/image_proxy' || u.pathname === '/favicon_proxy') {
    // The UI only needs these URLs to exist; redirect to the real target
    // (or 204 for favicons) so a browser test does not 404.
    const target = u.searchParams.get('url')
    if (target) {
      res.writeHead(302, { Location: target })
      return res.end()
    }
    return json(res, {}, 204)
  }
  return json(res, { error: 'not found (mock api)' }, 404)
})

server.listen(port, '127.0.0.1', () => {
  console.log(`mock RustXNG API listening on http://127.0.0.1:${port}`)
  console.log('routes: /search?format=json  /autocompleter?q=  /healthz  /image_proxy  /favicon_proxy')
})
