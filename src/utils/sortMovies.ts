import type { TmdbMovie } from '../types/movie';

export type MovieSortOrder =
  | 'popularity.desc'
  | 'vote_average.desc'
  | 'primary_release_date.desc';

// TMDBの検索結果全体を指定された順序に並び替える
export function sortMovies(movies: TmdbMovie[], sort: MovieSortOrder): TmdbMovie[] {
  return [...movies].sort((a, b) => {
    switch (sort) {
      case 'popularity.desc':
        return (b.popularity ?? 0) - (a.popularity ?? 0);

      case 'vote_average.desc':
        return (b.vote_average ?? 0) - (a.vote_average ?? 0);

      case 'primary_release_date.desc':
        return (b.release_date ?? '').localeCompare(a.release_date ?? '');

      default:
        return 0;
    }
  });
}
