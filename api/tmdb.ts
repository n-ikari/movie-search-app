import type { IncomingMessage, ServerResponse } from 'node:http';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const ALLOWED_PATHS = new Set(['/search/movie', '/discover/movie']);

function isAllowedPath(path: string): boolean {
  if (ALLOWED_PATHS.has(path)) {
    return true;
  }
  // アクセス先を制限
  return /^\/movie\/[1-9]\d*(\/(?:release_dates|videos))?$/.test(path);
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'GET') {
    res.writeHead(405, { Allow: 'GET' });
    res.end('Method Not Allowed');
    return;
  }
  // APIキーはサーバー側だけで使用
  // import.meta.env.VITE_... ではなく、Node.jsの process.env から取得する。
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    res.writeHead(500);
    res.end('Server configuration error');
    return;
  }

  const requestUrl = new URL(req.url ?? '/', 'http://localhost');
  const path = requestUrl.searchParams.get('path');

  if (!path || !isAllowedPath(path)) {
    res.writeHead(400);
    res.end('Invalid API path');
    return;
  }

  const tmdbUrl = new URL(`${TMDB_BASE_URL}${path}`);

  // APIごとに受け付けるパラメータを制限
  const allowedParams =
    path === '/search/movie'
      ? ['language', 'page', 'query']
      : path === '/discover/movie'
        ? [
            'language',
            'page',
            'sort_by',
            'with_genres',
            'primary_release_date.gte',
            'primary_release_date.lte',
          ]
        : path.endsWith('/release_dates')
          ? []
          : ['language'];

  // 想定外のパラメータは拒否
  for (const key of requestUrl.searchParams.keys()) {
    if (key !== 'path' && !allowedParams.includes(key)) {
      res.writeHead(400);
      res.end('Invalid query parameter');
      return;
    }
  }

  // パラメータの値を検証
  for (const key of allowedParams) {
    const value = requestUrl.searchParams.get(key);

    if (value === null) {
      continue;
    }

    const isValid =
      key === 'language'
        ? /^(ja-JP|en-US)$/.test(value)
        : key === 'page'
          ? /^[1-9]\d{0,2}$/.test(value) && Number(value) <= 500
          : key === 'query'
            ? value.trim().length > 0 && value.length <= 200
            : key === 'sort_by'
              ? [
                  'popularity.desc',
                  'popularity.asc',
                  'release_date.desc',
                  'release_date.asc',
                  'primary_release_date.desc',
                  'vote_average.desc',
                  'vote_average.asc',
                ].includes(value)
              : key === 'with_genres'
                ? /^\d{1,6}$/.test(value)
                : /^(19|20)\d{2}-\d{2}-\d{2}$/.test(value);

    if (!isValid) {
      res.writeHead(400);
      res.end('Invalid parameter value');
      return;
    }

    tmdbUrl.searchParams.set(key, value);
  }

  tmdbUrl.searchParams.set('api_key', apiKey);

  try {
    const response = await fetch(tmdbUrl);

    const data = await response.text();

    res.writeHead(response.status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    });

    res.end(data);
  } catch {
    res.writeHead(502);
    res.end('TMDB API request failed');
  }
}
