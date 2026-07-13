const API_KEY = '1acc3e32f5ebe1618e3b8b3b0ff9c172';
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

let currentModalId = null;
const movieCache = {};

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
};

function setState(newState, options = {}) {
  const { fetch = true } = options;

  Object.assign(state, newState);

  updateStateView();
  renderMovies();
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
function formatMovie(movie) {
  return {
    id: movie.id,
    title: movie.title || 'タイトルなし',
    date: movie.release_date || '不明',
    score: typeof movie.vote_average === 'number' ? movie.vote_average.toFixed(1) : 'なし',
    overview: movie.overview && movie.overview.trim() !== '' ? movie.overview : '概要なし',
    img: movie.poster_path ? 'https://image.tmdb.org/t/p/w500' + movie.poster_path : null,
  };
}
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
    container.innerHTML = '<p>読み込み中...</p>';
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

  movies.forEach((rawMovie, index) => {
    const movie = formatMovie(rawMovie);

    html += `
      <div class="card" data-index="${index}">
        <div class="cardInner">
          ${movie.img ? `<img src="${movie.img}" alt="${movie.title}">` : `<p>画像なし</p>`}
        </div>
        <div class="cardInner">
          <h3 class="movieTitle">${movie.title}</h3>
          <p>${movie.date}</p>
          <p>⭐ ${movie.score}</p>
          <p class="overview">${movie.overview}</p>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => {
      const index = Number(card.dataset.index);
      openModal(movies[index]);
    });
  });
}

function getGenres(ids) {
  if (!ids || ids.length === 0) return 'その他';

  const names = ids.map(id => genreMap[id]).filter(Boolean);

  return names.length > 0 ? names.join(', ') : 'その他';
}

// 日本公開日
async function fetchJapanReleaseDate(movieId) {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/release_dates?api_key=${API_KEY}`);
    const data = await res.json();

    const jp = data.results.find(r => r.iso_3166_1 === 'JP');

    if (!jp) return '日本未公開';

    const date = jp.release_dates[0]?.release_date;

    return date ? date.split('T')[0] : '不明';
  } catch (e) {
    console.error(e);
    return '取得失敗';
  }
}

// 概要取得関数（モーダル内のみ）
async function fetchMovieDetail(movieId) {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&language=ja-JP`);
    const data = await res.json();
    return data;
  } catch (e) {
    console.error(e);
    return null;
  }
}

// 動画取得API
async function fetchMovieVideos(movieId) {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${API_KEY}&language=ja-JP`);
    const data = await res.json();
    return data.results;
  } catch (e) {
    console.error(e);
    return [];
  }
}

// モーダルを開く
async function openModal(rawMovie) {
  const movie = formatMovie(rawMovie);
  currentModalId = movie.id;

  // ① 先にモーダル開く
  document.getElementById('modal').classList.remove('hidden');

  // ② ローディング表示
  document.getElementById('modalLoading').style.display = 'block';

  // ③ 既存要素一旦空 or 仮表示
  document.getElementById('modalImg').src = movie.img || '';
  document.getElementById('modalTitle').textContent = movie.title;
  document.getElementById('modalDate').textContent = movie.date;
  document.getElementById('modalScore').textContent = `⭐ ${movie.score}`;
  document.getElementById('modalOverview').textContent = movie.overview;

  let detail, jpDate, videos;

  if (movieCache[movie.id]) {
    ({ detail, jpDate, videos } = movieCache[movie.id]);
  } else {
    [detail, jpDate, videos] = await Promise.all([
      fetchMovieDetail(movie.id),
      fetchJapanReleaseDate(movie.id),
      fetchMovieVideos(movie.id),
    ]);

    movieCache[movie.id] = { detail, jpDate, videos };
  }

  if (currentModalId !== movie.id) return;

  let overview = detail?.overview;

  if (!overview || overview.trim() === '') {
    const res = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=${API_KEY}&language=en-US`);
    const enData = await res.json();
    overview = enData.overview || '概要なし';
  }

  document.getElementById('modalOverview').textContent = overview;

  document.getElementById('modalCountry').textContent = `🇯🇵 日本公開日: ${jpDate}`;
  document.getElementById('modalGenres').textContent = `ジャンル: ${getGenres(rawMovie.genre_ids)}`;

  // 動画
  const trailer = videos.find(v => v.site === 'YouTube' && v.type === 'Trailer');
  const videoContainer = document.getElementById('modalVideo');

  if (trailer) {
    const thumbnail = `https://img.youtube.com/vi/${trailer.key}/hqdefault.jpg`;
    // YouTubeトレーラー抽出
    videoContainer.innerHTML = `
  <div class="videoThumb" data-key="${trailer.key}">
    <img src="${thumbnail}" alt="trailer">
    <button class="playBtn">▶</button>
  </div>
`;

    videoContainer.onclick = null;
    videoContainer.onclick = () => {
      videoContainer.innerHTML = `
    <iframe width="100%" height="300"
      src="https://www.youtube.com/embed/${trailer.key}?autoplay=1"
      frameborder="0"
      allowfullscreen>
    </iframe>
  `;
    };
  } else {
    videoContainer.innerHTML = '<p>動画なし</p>';
  }

  // ⑤ ローディング消す
  document.getElementById('modalLoading').style.display = 'none';
}

// モーダルを閉じる
document.getElementById('modalClose').addEventListener('click', () => {
  document.getElementById('modal').classList.add('hidden');
  resetModal();
});

// 背景クリックでも閉じる
document.getElementById('modal').addEventListener('click', e => {
  if (e.target === document.getElementById('modal')) {
    document.getElementById('modal').classList.add('hidden');
    resetModal();
  }
});

// モーダルを閉じたら読み込み停止
function resetModal() {
  document.getElementById('modalLoading').style.display = 'none';

  document.getElementById('modalImg').src = '';
  document.getElementById('modalTitle').textContent = '';
  document.getElementById('modalDate').textContent = '';
  document.getElementById('modalScore').textContent = '';
  document.getElementById('modalOverview').textContent = '';

  document.getElementById('modalGenres').textContent = '';
  document.getElementById('modalCountry').textContent = '';
  document.getElementById('modalVideo').innerHTML = '';
}

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

buildGenreOptions();
fetchMovies();
