import type { Movie, TmdbMovie } from '../types/movie'

export function formatMovie(movie: TmdbMovie): Movie {
  const score =
    typeof movie.vote_average === 'number'
      ? movie.vote_average.toFixed(1)
      : 'なし'

  return {
    id: movie.id,
    title: movie.title || 'タイトルなし',
    date: movie.release_date || '不明',
    score,
    scoreClass: getScoreClass(score),
    overview: movie.overview?.trim() || '概要なし',
    img: movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : null,
    genreIds: movie.genre_ids || [],
  }
}

function getScoreClass(score: string): string {
  const num = Number(score)

  if (Number.isNaN(num)) return ''
  if (num >= 7) return 'high'
  if (num >= 5) return 'medium'

  return 'low'
}
