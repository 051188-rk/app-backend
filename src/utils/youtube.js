const axios = require('axios');

const YT_ENDPOINT = 'https://www.googleapis.com/youtube/v3/search';

function mapVideo(item) {
  const videoId = item?.id?.videoId;
  const sn = item?.snippet || {};
  return {
    videoId,
    title: sn.title,
    description: sn.description,
    channelTitle: sn.channelTitle,
    publishedAt: sn.publishedAt,
    url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : null,
    thumbnail: sn?.thumbnails?.high?.url || sn?.thumbnails?.default?.url || null
  };
}

async function searchYouTube({ q, maxResults = 4, regionCode = 'IN', relevanceLanguage = 'en' }) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error('Missing YOUTUBE_API_KEY');
  const params = {
    key,
    q,
    part: 'snippet',
    type: 'video',
    maxResults,
    order: 'relevance',
    safeSearch: 'moderate',
    videoEmbeddable: 'true',
    regionCode,
    relevanceLanguage
  };
  const { data } = await axios.get(YT_ENDPOINT, { params });
  const items = Array.isArray(data?.items) ? data.items : [];
  return items.map(mapVideo);
}

module.exports = { searchYouTube };
