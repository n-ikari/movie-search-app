import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import MovieCard from './components/MovieCard';
import { fetchMovies } from './services/tmdbApi';
import { formatMovie } from './utils/formatMovie';
import type { Movie } from './types/movie';
import './App.css';

function App() {
  // moviesという状態を作る。中身はMovie型の配列。初期値は空配列。更新するときはsetMoviesを使う
  // 「映画一覧 movies をReactに管理してもらう。変更するときは setMovies()」
  const [movies, setMovies] = useState<Movie[]>([]);
  const [query, setQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadMovies() {
      try {
        const data = await fetchMovies(searchQuery);
        const formattedMovies = data.results.map(formatMovie);

        setMovies(formattedMovies);
      } catch (error) {
        console.error(error);
      }
    }

    loadMovies();
    // 初回表示時 ＋ searchQuery が変わったときに実行
  }, [searchQuery]);
  // Enterで検索できるように
  function handleSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSearchQuery(query);
  }

  return (
    <main className="container">
      <h1>映画検索</h1>

      <div className="l-serchWrap">
        <div className="l-sortArea">
          <select id="genreFilter">
            <option value="">すべて</option>
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
