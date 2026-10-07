import type { TmdbMovie } from '../types/movie';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

type TmdbMovieResponse = {
  page: number;
  results: TmdbMovie[];
  total_pages: number;
  total_results: number;
};

export async function fetchMovies(
  query = '',
  genre = '',
  sort = 'popularity.desc',
  nowPlaying = false
): Promise<TmdbMovieResponse> {
  let releaseDateParams = '';

  if (nowPlaying) {
    const today = new Date();
    const oneMonthAgo = new Date();

    oneMonthAgo.setMonth(today.getMonth() - 1);

    const todayStr = today.toISOString().split('T')[0];
    const oneMonthAgoStr = oneMonthAgo.toISOString().split('T')[0];

    releaseDateParams = `&primary_release_date.gte=${oneMonthAgoStr}` + `&primary_release_date.lte=${todayStr}`;
  }

  const url = query
    ? `${BASE_URL}/search/movie` +
      `?api_key=${API_KEY}` +
      `&language=ja-JP` +
      `&page=1` +
      `&query=${encodeURIComponent(query)}`
    : `${BASE_URL}/discover/movie` +
      `?api_key=${API_KEY}` +
      `&language=ja-JP` +
      `&page=1` +
      `&sort_by=${sort}` +
      // ジャンル指定がある場合のみ絞り込み条件を追加
      // /discover/movie に日付条件を追加
      (genre ? `&with_genres=${genre}` : '') +
      releaseDateParams;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`映画データの取得に失敗しました: ${response.status}`);
  }

  const data: TmdbMovieResponse = await response.json();

  return data;
}
