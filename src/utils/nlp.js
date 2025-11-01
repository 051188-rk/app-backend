// Very light NLP: normalize, remove stopwords, generate expansions
const STOP = new Set([
  'the','a','an','and','or','to','of','for','in','on','with','about','what','is','are','how','i','you'
]);

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function keywords(text) {
  const norm = normalize(text);
  const parts = norm.split(' ').filter(t => t && !STOP.has(t));
  return parts.slice(0, 8);
}

function expansions(q) {
  const base = keywords(q).join(' ');
  const variants = [
    base,
    `${base} tutorial`,
    `${base} explained`,
    `${base} basics`,
    `${base} for beginners`
  ].filter(Boolean);
  // De-duplicate
  return Array.from(new Set(variants)).filter(Boolean);
}

module.exports = { keywords, expansions };
