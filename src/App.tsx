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

function App() {
  // moviesという状態を作る。中身はMovie型の配列。初期値は空配列。更新するときはsetMoviesを使う
  // 「映画一覧 movies をReactに管理してもらう。変更するときは setMovies()」
  const [movies, setMovies] = useState<Movie[]>([]);
  const [query, setQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  // 選択したジャンルをReactに管理させる
  const [genre, setGenre] = useState('');

  useEffect(() => {
    async function loadMovies() {
      try {
        const data = await fetchMovies(searchQuery, genre);
        const formattedMovies = data.results.map(formatMovie);

        setMovies(formattedMovies);
      } catch (error) {
        console.error(error);
      }
    }

    loadMovies();
    // 初回表示時 ＋ searchQuery または genre が変わる→ useEffectが動く→ fetchMovies(searchQuery, genre)実行
  }, [searchQuery, genre]);
  // Enterで検索できるように
  // 映画名検索 → ジャンルを解除
  // ジャンル選択 → 映画名検索を解除＋検索欄も空にする
  function handleSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSearchQuery(query);
    setGenre('');
  }

  function handleGenreChange(e: ChangeEvent<HTMLSelectElement>) {
    setGenre(e.target.value);
    setSearchQuery('');
    setQuery('');
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

          <select id="sortSelect">
            <option value="popularity.desc">人気順</option>
            <option value="vote_average.desc">評価順</option>
            <option value="primary_release_date.desc">公開日順</option>
          </select>

          <label>
            <input type="checkbox" id="nowPlayingCheck" />
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

      <div id="currentState"></div>

      <a className="pageLink" href="#">
        ❤&nbsp;お気に入り一覧
      </a>

      <div id="movieList" className="grid">
        {movies.map(movie => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>

      <div className="pageNav">
        <button type="button" id="prevBtn">
          前へ
        </button>

        <button type="button" id="nextBtn">
          次へ
        </button>

        <span id="pageInfo"></span>
      </div>
    </main>
  );
}

export default App;
