const axios = require('axios');

// Main search endpoint documented on RapidAPI landing page
const BOOKS_HOST = 'project-gutenberg-books-api.p.rapidapi.com';
const BOOKS_BASE = `https://${BOOKS_HOST}`;

// Additional subjects endpoint on a separate RapidAPI host (as provided)
const SUBJECTS_HOST = 'project-gutenberg-free-books-api1.p.rapidapi.com';
const SUBJECTS_BASE = `https://${SUBJECTS_HOST}`;

function authHeaders() {
  const key = process.env.GUTENBERG_API_KEY;
  if (!key) throw new Error('Missing GUTENBERG_API_KEY');
  return {
    'x-rapidapi-host': BOOKS_HOST,
    'x-rapidapi-key': key
  };
}

async function searchBooks({ q, page_size = 10, page = 1 }) {
  const headers = authHeaders();
  const url = `${BOOKS_BASE}/api/books`;
  const { data } = await axios.get(url, {
    headers,
    params: { q, page_size, page }
  });
  return data;
}

async function listSubjects() {
  const key = process.env.GUTENBERG_API_KEY;
  if (!key) throw new Error('Missing GUTENBERG_API_KEY');
  const { data } = await axios.get(`${SUBJECTS_BASE}/subjects`, {
    headers: {
      'x-rapidapi-host': SUBJECTS_HOST,
      'x-rapidapi-key': key
    }
  });
  return data;
}

module.exports = { searchBooks, listSubjects };
