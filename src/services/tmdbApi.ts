import type { TmdbMovie } from '../types/movie';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

type TmdbMovieResponse = {
  page: number;
  results: TmdbMovie[];
  total_pages: number;
  total_results: number;
};

// 映画一覧・検索結果の取得
export async function fetchMovies(
  query = '',
  genre = '',
  sort = 'popularity.desc',
  nowPlaying = false,
  page = 1
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
      `&page=${page}` +
      `&query=${encodeURIComponent(query)}`
    : `${BASE_URL}/discover/movie` +
      `?api_key=${API_KEY}` +
      `&language=ja-JP` +
      `&page=${page}` +
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

type TmdbMovieDetail = {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  runtime: number | null;
  genres: {
    id: number;
    name: string;
  }[];
};

// 映画IDをキーに、取得済みの詳細情報を保存する
const movieDetailCache = new Map<number, Promise<TmdbMovieDetail>>();

// 映画の詳細情報・ジャンル取得
export async function fetchMovieDetail(movieId: number): Promise<TmdbMovieDetail> {
  // ① キャッシュを確認
  const cached = movieDetailCache.get(movieId);

  if (cached) {
    return cached;
  }

  // ② API通信をPromiseとして作成
  const request = (async () => {
    const response = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=ja-JP`);

    if (!response.ok) {
      throw new Error(`映画詳細の取得に失敗しました: ${response.status}`);
    }

    const data: TmdbMovieDetail = await response.json();

    return data;
  })();

  // ③ 通信完了を待たずにPromiseを保存
  movieDetailCache.set(movieId, request);

  try {
    // ④ 通信結果を返す
    return await request;
  } catch (error) {
    // ⑤ 通信失敗時はキャッシュを削除
    movieDetailCache.delete(movieId);
    throw error;
  }
}

type TmdbReleaseDate = {
  release_date: string;
  type: number;
};

type TmdbReleaseDateResponse = {
  results: {
    iso_3166_1: string;
    release_dates: TmdbReleaseDate[];
  }[];
};

// 日本公開日の取得
// キャッシュ
const japanReleaseDateCache = new Map<number, Promise<string>>();

// 取得用関数
export async function fetchJapanReleaseDate(movieId: number): Promise<string> {
  const cached = japanReleaseDateCache.get(movieId);

  if (cached) {
    return cached;
  }

  const request = (async () => {
    const response = await fetch(`${BASE_URL}/movie/${movieId}/release_dates?api_key=${API_KEY}`);

    if (!response.ok) {
      throw new Error(`日本公開日の取得に失敗しました: ${response.status}`);
    }

    const data: TmdbReleaseDateResponse = await response.json();

    const japan = data.results.find(country => country.iso_3166_1 === 'JP');

    if (!japan) {
      return '日本未公開';
    }

    // type: 3 は劇場公開
    const theatrical = japan.release_dates.find(date => date.type === 3);

    const releaseDate = theatrical?.release_date || japan.release_dates[0]?.release_date;

    return releaseDate ? releaseDate.split('T')[0] : '不明';
  })();

  // 通信中のPromiseをキャッシュする
  japanReleaseDateCache.set(movieId, request);

  try {
    return await request;
  } catch (error) {
    japanReleaseDateCache.delete(movieId);
    throw error;
  }
}

//TMDB APIから予告編のYouTube動画IDを取得する関数
type TmdbVideo = {
  key: string;
  site: string;
  type: string;
  official: boolean;
};

type TmdbVideosResponse = {
  results: TmdbVideo[];
};

// 日本語・英語の予告編
// 予告編のキャッシュ
const movieTrailerCache = new Map<number, Promise<string | null>>();
// 日本語・英語の予告編取得
export async function fetchMovieTrailer(movieId: number): Promise<string | null> {
  const cached = movieTrailerCache.get(movieId);

  if (cached) {
    return cached;
  }

  const request = (async () => {
    // 指定した言語の予告編を取得する
    async function fetchTrailerByLanguage(language: string): Promise<string | null> {
      const response = await fetch(`${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}&language=${language}`);

      if (!response.ok) {
        throw new Error(`予告編の取得に失敗しました: ${response.status}`);
      }

      const data: TmdbVideosResponse = await response.json();

      // YouTubeの公式予告編を優先
      const trailer =
        data.results.find(video => video.site === 'YouTube' && video.type === 'Trailer' && video.official) ??
        data.results.find(video => video.site === 'YouTube' && video.type === 'Trailer');

      return trailer?.key ?? null;
    }

    // 日本語の予告編を優先
    const japaneseTrailer = await fetchTrailerByLanguage('ja-JP');

    if (japaneseTrailer) {
      return japaneseTrailer;
    }

    // 日本語がなければ英語版を取得
    return fetchTrailerByLanguage('en-US');
  })();

  // 通信完了前にPromiseを保存
  movieTrailerCache.set(movieId, request);

  try {
    return await request;
  } catch (error) {
    // 失敗時はキャッシュを削除して再取得可能にする
    movieTrailerCache.delete(movieId);
    throw error;
  }
}
