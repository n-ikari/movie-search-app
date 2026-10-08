import { useState } from 'react';
import MovieCard from './MovieCard';
import type { Movie } from '../types/movie';

type FavoritesPageProps = {
  favorites: Movie[];
  onToggleFavorite: (movie: Movie) => void;
  onBack: () => void;
};

const PER_PAGE = 6;

function FavoritesPage({ favorites, onToggleFavorite, onBack }: FavoritesPageProps) {
  const [page, setPage] = useState(1);

  // お気に入りの総ページ数
  const totalPages = Math.ceil(favorites.length / PER_PAGE);

  // 削除によって最終ページが空になった場合も対応する
  const currentPage = Math.max(1, Math.min(page, totalPages));

  // 現在のページに表示する映画を取得する
  const start = (currentPage - 1) * PER_PAGE;
  const pagedMovies = favorites.slice(start, start + PER_PAGE);

  function changePage(newPage: number) {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <>
      <h1>お気に入り映画</h1>

      <button type="button" className="pageLink" onClick={onBack}>
        ← 検索に戻る
      </button>

      <div className="grid">
        {pagedMovies.length === 0 ? (
          <p>お気に入りがありません</p>
        ) : (
          pagedMovies.map(movie => (
            <MovieCard key={movie.id} movie={movie} isFavorite={true} onToggleFavorite={onToggleFavorite} />
          ))
        )}
      </div>

      <div className="pageNav">
        <button type="button" disabled={currentPage === 1} onClick={() => changePage(currentPage - 1)}>
          前へ
        </button>

        <button type="button" disabled={currentPage >= totalPages} onClick={() => changePage(currentPage + 1)}>
          次へ
        </button>

        <span>
          {favorites.length === 0
            ? '0件 / 0件（1 / 0ページ）'
            : `${start + 1}-${Math.min(currentPage * PER_PAGE, favorites.length)}件 / ${favorites.length}件（${currentPage} / ${totalPages}ページ）`}
        </span>
      </div>

      <button
        type="button"
        className="backToSearchFixed"
        onClick={onBack}
        aria-label="検索画面に戻る"
        title="検索画面に戻る">
        ← 検索に戻る
      </button>
    </>
  );
}

export default FavoritesPage;
