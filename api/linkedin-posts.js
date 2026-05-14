const API_VERSION = process.env.LINKEDIN_API_VERSION || '202602';

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.end(JSON.stringify(payload));
}

function normalizeText(post) {
  const commentary = post.commentary || post.text || post?.specificContent?.['com.linkedin.ugc.ShareContent']?.shareCommentary;
  if (typeof commentary === 'string') return commentary;
  if (commentary && typeof commentary.text === 'string') return commentary.text;
  return '';
}

function normalizeDate(value) {
  if (!value) return '';
  const timestamp = typeof value === 'number' ? value : Date.parse(value);
  if (!Number.isFinite(timestamp)) return '';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(timestamp));
}

function linkedinUrl(id) {
  if (!id || typeof id !== 'string') return '';
  return `https://www.linkedin.com/feed/update/${encodeURIComponent(id)}/`;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { configured: false, posts: [] });
  }

  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  const author = process.env.LINKEDIN_AUTHOR_URN;

  if (!token || !author) {
    return sendJson(res, 200, {
      configured: false,
      posts: [],
      message: 'Set LINKEDIN_ACCESS_TOKEN and LINKEDIN_AUTHOR_URN in Vercel to enable LinkedIn post sync.'
    });
  }

  const url = new URL('https://api.linkedin.com/rest/posts');
  url.searchParams.set('q', 'author');
  url.searchParams.set('author', author);
  url.searchParams.set('count', '6');
  url.searchParams.set('sortBy', 'LAST_MODIFIED');

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'LinkedIn-Version': API_VERSION,
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });

    if (!response.ok) {
      return sendJson(res, response.status, {
        configured: true,
        posts: [],
        error: `LinkedIn API returned ${response.status}`
      });
    }

    const data = await response.json();
    const elements = Array.isArray(data.elements) ? data.elements : [];
    const posts = elements
      .map((post) => ({
        id: post.id || '',
        text: normalizeText(post).replace(/\s+/g, ' ').trim(),
        publishedAt: normalizeDate(post.publishedAt || post.createdAt || post.lastModifiedAt),
        url: linkedinUrl(post.id)
      }))
      .filter((post) => post.text)
      .slice(0, 6);

    return sendJson(res, 200, { configured: true, posts });
  } catch (error) {
    return sendJson(res, 500, {
      configured: true,
      posts: [],
      error: 'Unable to sync LinkedIn posts.'
    });
  }
};
