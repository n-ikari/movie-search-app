// 状態管理（データ管理）

import { API_KEY } from './config.js';
import { getFavorites, toggleFavorite } from './favoritesStore.js';
import { openModal } from './modal.js';
import { applyFadeIn, crossFade, smoothScrollTop } from './animation.js';
import { showSkeleton } from './loading.js';
import { formatMovie } from './format.js';

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

// 複数の変数をオブジェクト化
const state = {
  query: '', //検索用に状態を追加
  genre: '', //ジャンル用
  nowPlaying: false, //現在公開中要
  page: 1, //ページ管理用
  totalPages: 1,
  totalResults: 0,
  sort: 'popularity.desc',
  loading: false,
  error: null,
  movies: [],
  movieMap: new Map(), // ⭐追加
};

function setState(newState, options = {}) {
  const { fetch = true } = options;

  Object.assign(state, newState);

  // ⭐ movies更新時だけMap作る
  if (newState.movies) {
    state.movieMap = new Map();
    newState.movies.forEach(m => {
      state.movieMap.set(m.id, m);
    });
  }

  updateStateView();

  const container = document.getElementById('movieList');

  crossFade(container, () => {
    renderMovies();
  });

  updatePageInfo();
  updateButtons();

  if (fetch) {
    fetchMovies();
  }
}

function buildGenreOptions() {
  const select = document.getElementById('genreFilter');
  select.innerHTML = '<option value="">すべて</option>'; // ←追加

  Object.entries(genreMap).forEach(([id, name]) => {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = name;
    select.appendChild(option);
  });
}

async function fetchMovies() {
  setState({ loading: true }, { fetch: false });

  let url = '';

  // 🔹 検索モード
  if (state.query) {
    url = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&language=ja-JP&page=${state.page}&query=${encodeURIComponent(state.query)}`;
  } else {
    // 🔹 通常モード（discover）
    url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=ja-JP&page=${state.page}&sort_by=${state.sort}`;

    // ジャンル
    if (state.genre) {
      url += `&with_genres=${state.genre}`;
    }

    // 現在公開中（擬似）
    if (state.nowPlaying) {
      const today = new Date();
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(today.getMonth() - 1);

      const todayStr = today.toISOString().split('T')[0];
      const oneMonthAgoStr = oneMonthAgo.toISOString().split('T')[0];

      url += `&primary_release_date.gte=${oneMonthAgoStr}&primary_release_date.lte=${todayStr}`;
    }
  }

  try {
    console.log(url);

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTPエラー: ${res.status}`);

    const data = await res.json();

    setState(
      {
        movies: data.results,
        totalPages: data.total_pages,
        totalResults: data.total_results,
        loading: false,
        error: null,
      },
      { fetch: false }
    );
  } catch (err) {
    setState(
      {
        loading: false,
        error: 'データの取得に失敗しました',
      },
      { fetch: false }
    );
    console.error(err);
  }
}

// ガード処理
// function formatMovie(movie) {
//   return {
//     id: movie.id,
//     title: movie.title || 'タイトルなし',
//     date: movie.release_date || '不明',
//     score: typeof movie.vote_average === 'number' ? movie.vote_average.toFixed(1) : 'なし',
//     overview: movie.overview && movie.overview.trim() !== '' ? movie.overview : '概要なし',
//     img: movie.poster_path ? 'https://image.tmdb.org/t/p/w500' + movie.poster_path : null,

//     // ⭐ ここが追加（超重要）
//     genre_ids: movie.genre_ids || [],
//     poster_path: movie.poster_path,
//     release_date: movie.release_date,
//     vote_average: movie.vote_average,
//   };
// }
//検索ボタン処理
document.getElementById('searchBtn').addEventListener('click', () => {
  const input = document.getElementById('searchInput').value;

  setState({
    query: input,
    page: 1,
    genre: '',
    nowPlaying: false,
  });
});
//Enterキーでも検索
document.getElementById('searchInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    setState({
      query: e.target.value,
      page: 1,
      genre: '',
      nowPlaying: false,
    });
  }
});

// 現在公開中
document.getElementById('nowPlayingCheck').addEventListener('change', e => {
  setState({
    page: 1,
    nowPlaying: e.target.checked,
  });
});

// ページネーション
document.getElementById('prevBtn').addEventListener('click', () => {
  if (state.page > 1) {
    setState({
      page: state.page - 1,
    });
  }
});

document.getElementById('nextBtn').addEventListener('click', () => {
  if (state.page < state.totalPages) {
    setState({
      page: state.page + 1,
    });

    setTimeout(() => {
      smoothScrollTop();
    }, 50);
  }
});
// ページ表示
function updatePageInfo() {
  const start = (state.page - 1) * 20 + 1;
  const end = Math.min(state.page * 20, state.totalResults);

  document.getElementById('pageInfo').textContent = `${start}-${end}件 / ${state.totalResults}件`;
}
// ページネーションボタン制御
function updateButtons() {
  document.getElementById('prevBtn').disabled = state.page === 1;
  document.getElementById('nextBtn').disabled = state.page >= state.totalPages;
}

// 一覧をhtmlに表示
function renderMovies() {
  const container = document.getElementById('movieList');
  const movies = state.movies;

  if (state.loading) {
    // container.innerHTML = '<p>読み込み中...</p>';
    showSkeleton(container); // ⭐スケルトン
    return;
  }
  if (state.error) {
    container.innerHTML = `<p>${state.error}</p>`;
    return;
  }
  // 空データのときの処理
  if (!movies || movies.length === 0) {
    container.innerHTML = '<p>データがありません</p>';
    return;
  }

  let html = '';

  const favs = getFavorites();

  movies.forEach(rawMovie => {
    const movie = formatMovie(rawMovie);
    const isFav = favs.find(f => f.id === movie.id);

    html += renderMovieCard(movie, {
      isFavorite: isFav,
      // index: index,
      id: movie.id, // ⭐追加
    });
  });

  container.innerHTML = html;
  // ⭐ 全カードにfadeIn付与
  applyFadeIn(container);

  // document.querySelectorAll('.card').forEach(card => {
  //   card.addEventListener('click', () => {
  //     const index = Number(card.dataset.index);
  //     openModal(movies[index]);
  //   });
  // });
}
// お気に入りボタンクリックイベント
document.getElementById('movieList').addEventListener('click', e => {
  const card = e.target.closest('.card');
  if (!card) return;

  const id = Number(card.dataset.id);
  const rawMovie = state.movieMap.get(id);
  if (!rawMovie) return;

  // 分岐↓❤クリックでなければモーダルオープン
  // ⭐ favBtnクリック
  const favBtn = e.target.closest('.favBtn');
  if (favBtn) {
    e.stopPropagation();

    const movie = formatMovie(rawMovie);

    // ⭐アニメーション用
    favBtn.classList.add('pop');

    setTimeout(() => {
      favBtn.classList.remove('pop');
    }, 200);

    toggleFavorite(movie);
    return;
  }

  // ⭐ cardクリック
  openModal(rawMovie);
});

document.getElementById('genreFilter').addEventListener('change', e => {
  setState({
    genre: e.target.value,
    page: 1,
    query: '',
  });
});

document.getElementById('sortSelect').addEventListener('change', e => {
  setState({
    sort: e.target.value,
    page: 1,
  });
});

// 検索ステータス表示
function updateStateView() {
  let text = '';

  if (state.query) {
    text += `検索: ${state.query} `;
  }

  if (state.genre) {
    text += `ジャンル: ${genreMap[state.genre] || 'その他'} `;
  }

  if (state.nowPlaying) {
    text += '現在公開中 ';
  }

  if (!state.query) {
    const sortMap = {
      'popularity.desc': '人気順',
      'vote_average.desc': '評価順',
      'primary_release_date.desc': '公開日順',
    };
    text += `並び: ${sortMap[state.sort]}`;
  }

  document.getElementById('currentState').textContent = text || 'すべての映画';
}

// お気に入り機能　favoritesStore.jsに移動
// function getFavorites() {
//   return JSON.parse(localStorage.getItem('favorites') || '[]');
// }

// function saveFavorites(favs) {
//   localStorage.setItem('favorites', JSON.stringify(favs));
// }

// お気に入り❤ボタン　トグルイベント　favoritesStore.jsに移動
// function toggleFavorite(movie) {
//   let favs = getFavorites();

//   const exists = favs.find(f => f.id === movie.id);

//   if (exists) {
//     favs = favs.filter(f => f.id !== movie.id);
//     showToast('お気に入りから削除しました', 'remove');
//   } else {
//     favs.push(movie);
//     showToast('お気に入りに追加しました', 'add');
//   }

//   saveFavorites(favs);

//   // ⭐ これ追加（超重要）
//   // 👉 「お気に入りが更新されたぞ！」って全体に通知（script.js側で同期favoritesUpdated）
//   document.dispatchEvent(
//     new CustomEvent('favoritesUpdated', {
//       detail: { movieId: movie.id },
//     })
//   );
// }

document.addEventListener('favoritesUpdated', e => {
  const movieId = e.detail.movieId;

  const card = document.querySelector(`.card[data-id="${movieId}"]`);
  if (!card) return;

  const favBtn = card.querySelector('.favBtn');
  if (!favBtn) return;

  const isFav = getFavorites().some(f => f.id === movieId);

  favBtn.classList.toggle('active', isFav);
});

buildGenreOptions();
fetchMovies();
