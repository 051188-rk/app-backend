const axios = require('axios');

const PY_HOST = process.env.PY_HOST || '127.0.0.1';
const PY_PORT = process.env.PY_PORT || '5001';
const BASE = `http://${PY_HOST}:${PY_PORT}`;

async function analyze(q) {
  const { data } = await axios.post(`${BASE}/nlp/analyze`, { q }, { timeout: 20000 });
  return data; // { expansions: [] }
}

async function score(q, items) {
  const { data } = await axios.post(`${BASE}/nlp/score`, { q, items }, { timeout: 30000 });
  return data; // { scores: [] }
}

module.exports = { analyze, score };
