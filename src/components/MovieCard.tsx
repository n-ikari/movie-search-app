import { useState } from 'react';
import type { Movie } from '../types/movie';
import { Heart, Star } from 'lucide-react';

type MovieCardProps = {
  movie: Movie;
  isFavorite?: boolean;
  isRemoving?: boolean;
  onToggleFavorite: (movie: Movie) => void;
  onOpenModal?: (movie: Movie) => void;

  // MovieCardには movie を必ず渡してください。
  // その movie は Movie 型でなければいけません。
  // isFavorite は省略可能ですが、渡すならbooleanです。
};

function MovieCard({
  movie,
  isFavorite = false,
  isRemoving = false,
  onToggleFavorite,
  onOpenModal,
}: MovieCardProps) {
  const [isPopping, setIsPopping] = useState(false);
  return (
    <div
      className={`card ${isRemoving ? 'fadeOut' : 'fadeIn'}`}
      data-id={movie.id}
      role="button"
      tabIndex={isRemoving || !onOpenModal ? -1 : 0}
      aria-label={`${movie.title}の詳細を表示`}
      aria-disabled={isRemoving}
      onClick={() => {
        if (!isRemoving) {
          onOpenModal?.(movie);
        }
      }}
      onKeyDown={event => {
        if (event.target !== event.currentTarget) return;
        if (isRemoving || !onOpenModal) return;

        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpenModal(movie);
        }
      }}>
      <button
        type="button"
        className={`favBtn ${isFavorite ? 'active' : ''} ${isPopping ? 'pop' : ''}`}
        aria-label="お気に入り"
        onClick={event => {
          event.stopPropagation();
          setIsPopping(true);
          onToggleFavorite(movie);
        }}
        onAnimationEnd={() => {
          setIsPopping(false);
        }}>
        <Heart size={20} strokeWidth={2} aria-hidden="true" />
      </button>

      <div className="cardPoster">
        {movie.img ? <img src={movie.img} alt={movie.title} loading="lazy" /> : <p>画像なし</p>}
      </div>

      <div className="cardInfo">
        <h3 className="movieTitle">{movie.title}</h3>

        <p className="score">
          <Star size={17} strokeWidth={2} aria-hidden="true" />
          <span className={movie.scoreClass}>{movie.score}</span>
        </p>
      </div>
    </div>
  );
}

export default MovieCard;
