import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import MovieCard from './components/MovieCard';
import { fetchMovies } from './services/tmdbApi';
import { formatMovie } from './utils/formatMovie';
import type { Movie } from './types/movie';
import { loadFavorites, saveFavorites } from './utils/favoritesStore';
import FavoritesPage from './components/FavoritesPage';
import MovieModal from './components/MovieModal';
import SearchForm from './components/SearchForm';
import StickySearch from './components/StickySearch';

// 選択肢（ジャンル）をReactで表示する。固定データ。
const genreMap = {
  28: 'アクション',
  12: 'アドベンチャー',
  16: 'アニメ',
  35: 'コメディ',
  80: '犯罪',
  99: 'ドキュメンタリー',
  18: 'ドラマ',
  10751: 'ファミリー',
  14: 'ファンタジー',
  36: '歴史',
  27: 'ホラー',
  10402: '音楽',
  9648: 'ミステリー',
  10749: '恋愛',
  878: 'SF',
  10770: 'TV映画',
  53: 'スリラー',
  10752: '戦争',
  37: '西部劇',
};

const sortMap = {
  'popularity.desc': '人気順',
  'vote_average.desc': '評価順',
  'primary_release_date.desc': '公開日順',
};

function App() {
  // モーダルで表示する映画を管理する
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  // 現在表示している画面を管理する
  const [currentView, setCurrentView] = useState<'search' | 'favorites'>('search');
  // moviesという状態を作る。中身はMovie型の配列。初期値は空配列。更新するときはsetMoviesを使う
  // 「映画一覧 movies をReactに管理してもらう。変更するときは setMovies()」
  const [movies, setMovies] = useState<Movie[]>([]);
  // お気に入りをlocalStorageから読み込んで管理する
  const [favorites, setFavorites] = useState<Movie[]>(loadFavorites);
  const favoritesRef = useRef(favorites);

  // favorites の変更を localStorage に自動保存する
  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);

  // お気に入り一覧で削除アニメーション中の映画ID
  const [removingFavoriteIds, setRemovingFavoriteIds] = useState<number[]>([]);
  // トースト用
  const [toast, setToast] = useState<{
    message: string;
    type: 'add' | 'remove';
    isLeaving: boolean;
  } | null>(null);
  // タイマーを管理するRefを追加
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastRemoveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [query, setQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  // 選択したジャンルをReactに管理させる
  const [genre, setGenre] = useState('');
  // 選択した並び順をReactに管理させる
  const [sort, setSort] = useState('popularity.desc');
  // 「最近1ヶ月」のチェック状態をReactに管理させる
  const [nowPlaying, setNowPlaying] = useState(false);

  // 現在のページ番号をReactに管理させる
  const [page, setPage] = useState(1);
  // APIから返された総ページ数をReactに管理させる
  const [totalPages, setTotalPages] = useState(1);
  // APIから返された映画の総件数をReactに管理させる
  const [totalResults, setTotalResults] = useState(0);
  // APIから映画データを取得中かどうかをReactに管理させる
  const [loading, setLoading] = useState(false);
  // APIから映画データを取得できなかった場合のエラーメッセージを管理する
  const [error, setError] = useState('');

  const searchFormRef = useRef<HTMLDivElement>(null);
  const [showStickySearch, setShowStickySearch] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadMovies() {
      try {
        setLoading(true);
        setError('');

        const data = await fetchMovies(searchQuery, genre, sort, nowPlaying, page);

        // 古いリクエストの結果なら画面を更新しない
        if (cancelled) return;

        const formattedMovies = data.results.map(formatMovie);

        setMovies(formattedMovies);
        setTotalPages(data.total_pages);
        setTotalResults(data.total_results);
      } catch (error) {
        // 古いリクエストのエラーは表示しない
        if (cancelled) return;

        console.error(error);
        setMovies([]);
        setError('映画データの取得に失敗しました。');
      } finally {
        // 古いリクエストの終了で現在のローディングを解除しない
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadMovies();

    return () => {
      cancelled = true;
    };
  }, [searchQuery, genre, sort, nowPlaying, page]);

  // アンマウント時のタイマー解除
  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        clearTimeout(toastTimerRef.current);
      }

      if (toastRemoveTimerRef.current !== null) {
        clearTimeout(toastRemoveTimerRef.current);
      }
    };
  }, []);

  // 検索フォームが画面上部に隠れたら追従検索ボタンを表示
  useEffect(() => {
    if (currentView !== 'search') return;

    const element = searchFormRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickySearch(entry.boundingClientRect.bottom <= 0);
      },
      {
        threshold: 0,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [currentView]);

  // Enterで検索できるように
  // 映画名検索 → ジャンルを解除
  // ジャンル選択 → 映画名検索を解除＋検索欄も空にする
  function handleSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSearchQuery(query);
    setGenre('');
    setPage(1);
  }

  function handleGenreChange(e: ChangeEvent<HTMLSelectElement>) {
    setGenre(e.target.value);
    setSearchQuery('');
    setQuery('');
    setPage(1);
  }

  // 現在の状態
  let currentStateText = '';

  if (searchQuery) {
    currentStateText += `検索: ${searchQuery} `;
  }

  if (genre) {
    currentStateText += `ジャンル: ${genreMap[Number(genre) as keyof typeof genreMap]} `;
  }

  if (nowPlaying) {
    currentStateText += '現在公開中 ';
  }

  if (!searchQuery) {
    currentStateText += `並び: ${sortMap[sort as keyof typeof sortMap]}`;
  }

  // ページ切り替え時に画面上部へスクロールする
  function scrollTop() {
    window.scrollTo({
      top: 0,
    });
  }
  // お気に入り
  function toggleFavorite(movie: Movie) {
    const currentFavorites = favoritesRef.current;
    const exists = currentFavorites.some(favorite => favorite.id === movie.id);

    const newFavorites = exists
      ? currentFavorites.filter(favorite => favorite.id !== movie.id)
      : [movie, ...currentFavorites];

    favoritesRef.current = newFavorites;
    setFavorites(newFavorites);

    setToast({
      message: exists
        ? `「${movie.title}」をお気に入りから削除しました。`
        : `「${movie.title}」をお気に入りに追加しました。`,
      type: exists ? 'remove' : 'add',
      isLeaving: false,
    });

    // 前回のトースト用タイマーを解除
    if (toastTimerRef.current !== null) {
      clearTimeout(toastTimerRef.current);
    }

    if (toastRemoveTimerRef.current !== null) {
      clearTimeout(toastRemoveTimerRef.current);
    }

    // 2秒後にフェードアウト開始
    toastTimerRef.current = setTimeout(() => {
      setToast(prev => (prev ? { ...prev, isLeaving: true } : null));
    }, 2000);

    // 2.5秒後にトーストを削除
    toastRemoveTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 2500);
  }

  // お気に入りから削除する専用処理
  function removeFavorite(movie: Movie) {
    const currentFavorites = favoritesRef.current;

    // すでに削除済みなら何もしない
    if (!currentFavorites.some(favorite => favorite.id === movie.id)) {
      return;
    }

    const newFavorites = currentFavorites.filter(favorite => favorite.id !== movie.id);

    favoritesRef.current = newFavorites;
    setFavorites(newFavorites);

    setToast({
      message: `「${movie.title}」をお気に入りから削除しました。`,
      type: 'remove',
      isLeaving: false,
    });

    // 前回のトースト用タイマーを解除
    if (toastTimerRef.current !== null) {
      clearTimeout(toastTimerRef.current);
    }

    if (toastRemoveTimerRef.current !== null) {
      clearTimeout(toastRemoveTimerRef.current);
    }

    // 2秒後にフェードアウト開始
    toastTimerRef.current = setTimeout(() => {
      setToast(prev => (prev ? { ...prev, isLeaving: true } : null));
    }, 2000);

    // 2.5秒後にトーストを削除
    toastRemoveTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 2500);
  }

  // お気に入り一覧から削除するときのアニメーション処理
  function removeFavoriteWithAnimation(movie: Movie) {
    // 二重削除を防ぐ
    if (removingFavoriteIds.includes(movie.id)) return;

    // フェードアウトを開始
    setRemovingFavoriteIds(prev => [...prev, movie.id]);

    // 300ms後にお気に入りから削除
    setTimeout(() => {
      removeFavorite(movie);

      setRemovingFavoriteIds(prev => prev.filter(id => id !== movie.id));
    }, 300);
  }

  return (
    <main className={`container ${currentView === 'favorites' ? 'view-favorites' : 'view-search'}`}>
      {currentView === 'favorites' ? (
        <FavoritesPage
          favorites={favorites}
          removingIds={removingFavoriteIds}
          onRemoveFavorite={removeFavoriteWithAnimation}
          onOpenModal={setSelectedMovie}
          onBack={() => {
            setCurrentView('search');
            scrollTop();
          }}
        />
      ) : (
        <>
          <h1>映画検索</h1>

          <div ref={searchFormRef}>
            <SearchForm
              query={query}
              genre={genre}
              sort={sort}
              nowPlaying={nowPlaying}
              genreOptions={genreMap}
              onQueryChange={setQuery}
              onGenreChange={handleGenreChange}
              onSortChange={value => {
                setSort(value);
                setPage(1);
              }}
              onNowPlayingChange={checked => {
                setNowPlaying(checked);
                setPage(1);
              }}
              onSearch={handleSearch}
            />
          </div>
          {/* 表示条件 */}
          {currentView === 'search' && showStickySearch && !selectedMovie && <StickySearch onClick={() => {}} />}

          <div id="currentState">{currentStateText || 'すべての映画'}</div>

          <button
            type="button"
            className="pageLink"
            onClick={() => {
              setCurrentView('favorites');
              scrollTop();
            }}>
            ❤&nbsp;お気に入り一覧
          </button>

          <button
            type="button"
            className="backToSearchFixed"
            onClick={() => {
              setCurrentView('favorites');
              scrollTop();
            }}>
            ❤ 一覧へ
          </button>

          {error && <p className="error-message">{error}</p>}
          <div id="movieList" className="movieGrid">
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => <div key={index} className="skeleton skeleton-card"></div>)
            ) : !error && movies.length === 0 ? (
              <p>データがありません</p>
            ) : (
              movies.map(movie => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  isFavorite={favorites.some(favorite => favorite.id === movie.id)}
                  onToggleFavorite={toggleFavorite}
                  onOpenModal={setSelectedMovie}
                />
              ))
            )}
          </div>

          <div className="pageNav">
            <button
              type="button"
              id="prevBtn"
              disabled={page === 1}
              onClick={() => {
                setPage(page - 1);
                scrollTop();
              }}>
              前へ
            </button>

            <button
              type="button"
              id="nextBtn"
              disabled={page >= totalPages}
              onClick={() => {
                setPage(page + 1);
                scrollTop();
              }}>
              次へ
            </button>

            <span id="pageInfo">
              {totalResults === 0
                ? '0件 / 0件'
                : `${(page - 1) * 20 + 1}-${Math.min(page * 20, totalResults)}件 / ${totalResults}件`}
            </span>
          </div>
        </>
      )}
      {/* モーダル */}
      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          isFavorite={favorites.some(favorite => favorite.id === selectedMovie.id)}
          onToggleFavorite={movie => {
            if (currentView === 'favorites') {
              removeFavoriteWithAnimation(movie);
              setSelectedMovie(null);
            } else {
              toggleFavorite(movie);
            }
          }}
          onClose={() => setSelectedMovie(null)}
        />
      )}
      {/* トースト */}
      {toast && <div className={`toast ${toast.type} ${toast.isLeaving ? 'hide' : 'show'}`}>{toast.message}</div>}
    </main>
  );
}

export default App;
