import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import MovieCard from './components/MovieCard';
import { fetchMovies } from './services/tmdbApi';
import { formatMovie } from './utils/formatMovie';
import type { Movie } from './types/movie';
import './App.css';

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
  // moviesという状態を作る。中身はMovie型の配列。初期値は空配列。更新するときはsetMoviesを使う
  // 「映画一覧 movies をReactに管理してもらう。変更するときは setMovies()」
  const [movies, setMovies] = useState<Movie[]>([]);
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

  useEffect(() => {
    async function loadMovies() {
      try {
        setLoading(true);
        setError(''); // 前回のエラーを消す

        const data = await fetchMovies(searchQuery, genre, sort, nowPlaying, page);
        const formattedMovies = data.results.map(formatMovie);

        setMovies(formattedMovies);
        // ページネーション
        setTotalPages(data.total_pages);
        setTotalResults(data.total_results);
      } catch (error) {
        console.error(error);
        setMovies([]);
        setError('映画データの取得に失敗しました。');
      } finally {
        // loading を false に戻す処理
        // finallyで成功・失敗に関係なく通信が終わったら解除する
        setLoading(false);
      }
    }

    loadMovies();
    // 初回表示時 ＋ searchQuery、genre、sort、nowPlaying 、pageが変わる → useEffectが動く → fetchMovies()実行
  }, [searchQuery, genre, sort, nowPlaying, page]);
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

  return (
    <main className="container">
      <h1>映画検索</h1>

      <div className="l-serchWrap">
        <div className="l-sortArea">
          <select id="genreFilter" value={genre} onChange={handleGenreChange}>
            <option value="">すべて</option>

            {Object.entries(genreMap).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>

          <select
            id="sortSelect"
            value={sort}
            onChange={e => {
              setSort(e.target.value);
              setPage(1);
            }}>
            <option value="popularity.desc">人気順</option>
            <option value="vote_average.desc">評価順</option>
            <option value="primary_release_date.desc">公開日順</option>
          </select>

          <label>
            <input
              type="checkbox"
              id="nowPlayingCheck"
              checked={nowPlaying}
              onChange={e => {
                setNowPlaying(e.target.checked);
                setPage(1);
              }}
            />
            最近1ヶ月
          </label>
        </div>

        <form className="l-serchArea" onSubmit={handleSearch}>
          <input
            type="text"
            id="searchInput"
            placeholder="映画名で検索"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button type="submit" id="searchBtn">
            検索
          </button>
        </form>
      </div>

      <div id="currentState">{currentStateText || 'すべての映画'}</div>

      <a className="pageLink" href="#">
        ❤&nbsp;お気に入り一覧
      </a>

      {error && <p className="error-message">{error}</p>}
      <div id="movieList" className="grid">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => <div key={index} className="skeleton skeleton-card"></div>)
          : movies.map(movie => <MovieCard key={movie.id} movie={movie} />)}
      </div>

      <div className="pageNav">
        <button type="button" id="prevBtn" disabled={page === 1} onClick={() => setPage(page - 1)}>
          前へ
        </button>

        <button type="button" id="nextBtn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
          次へ
        </button>

        <span id="pageInfo">
          {(page - 1) * 20 + 1}-{Math.min(page * 20, totalResults)}件 / {totalResults}件
        </span>
      </div>
    </main>
  );
}

export default App;
