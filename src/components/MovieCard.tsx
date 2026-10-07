import type { Movie } from '../types/movie';

type MovieCardProps = {
  movie: Movie;
  isFavorite?: boolean;

  // MovieCardには movie を必ず渡してください。
  // その movie は Movie 型でなければいけません。
  // isFavorite は省略可能ですが、渡すならbooleanです。
};

function MovieCard({ movie, isFavorite = false }: MovieCardProps) {
  return (
    <div className="card fadeIn" data-id={movie.id}>
      <button type="button" className={`favBtn ${isFavorite ? 'active' : ''}`} aria-label="お気に入り">
        ❤
      </button>

      <div className="cardInner">{movie.img ? <img src={movie.img} alt={movie.title} /> : <p>画像なし</p>}</div>

      <div className="cardInner">
        <h3 className="movieTitle">{movie.title}</h3>

        <p>🌎全世界公開日 {movie.date}</p>

        <p className="score">
          評価⭐ <span className={movie.scoreClass}>{movie.score}</span>
        </p>

        <div className="overview">
          <p className="inner">{movie.overview}</p>
        </div>
      </div>
    </div>
  );
}

export default MovieCard;
