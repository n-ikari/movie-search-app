import type { TmdbMovie } from '../types/movie';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

type TmdbMovieResponse = {
  page: number;
  results: TmdbMovie[];
  total_pages: number;
  total_results: number;
};

export async function fetchMovies(query = '', genre = ''): Promise<TmdbMovieResponse> {
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
      `&sort_by=popularity.desc` +
      // ジャンル指定がある場合のみ絞り込み条件を追加
      (genre ? `&with_genres=${genre}` : '');

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`映画データの取得に失敗しました: ${response.status}`);
  }

  const data: TmdbMovieResponse = await response.json();

  return data;
}
