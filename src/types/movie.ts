export type TmdbMovie = {
  id: number
  title?: string
  release_date?: string
  vote_average?: number
  popularity?: number
  overview?: string
  poster_path?: string | null
  genre_ids?: number[]
}

export type Movie = {
  id: number
  title: string
  date: string
  score: string
  scoreClass: string
  overview: string
  img: string | null
  genreIds: number[]
}
