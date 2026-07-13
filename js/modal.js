import { API_KEY } from './config.js';
import { getFavorites, toggleFavorite } from './favoritesStore.js';
import { formatMovie } from './format.js';

let currentModalId = null;
let currentModalMovie = null; //お気に入り用（モーダルで開いてる映画データを保持するため）
const movieCache = {};

function isFavoriteMovie(movieId) {
  return getFavorites().some(movie => movie.id === movieId);
}

function updateModalFavoriteButton(movie) {
  const favBtn = document.getElementById('modalFavBtn');
  if (!favBtn) return;

  const isFav = isFavoriteMovie(movie.id);

  favBtn.classList.toggle('active', isFav);
  favBtn.dataset.id = movie.id;
  favBtn.setAttribute('aria-pressed', isFav ? 'true' : 'false');
  favBtn.title = isFav ? 'お気に入りから削除' : 'お気に入りに追加';
}

// ジャンル変換
function getGenres(ids) {
  const genreMap = {
    28: 'アクション',
    12: 'アドベンチャー',
    16: 'アニメ',
    35: 'コメディ',
    80: '犯罪',
    18: 'ドラマ',
    10749: '恋愛',
    878: 'SF',
  };

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

    // ⭐ 正式公開を優先
    const theatrical = jp.release_dates.find(d => d.type === 3);

    // fallback
    const date = theatrical?.release_date || jp.release_dates[0]?.release_date;

    return date ? date.split('T')[0] : '不明';
  } catch (e) {
    console.error(e);
    return '取得失敗';
  }
}

// 詳細
async function fetchMovieDetail(movieId) {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&language=ja-JP`);
    return await res.json();
  } catch (e) {
    console.error(e);
    return null;
  }
}

// 動画
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

// ⭐ モーダル本体
export async function openModal(rawMovie) {
  const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

  document.body.style.overflow = 'hidden';
  document.body.style.paddingRight = scrollBarWidth + 'px';

  // const movie = {
  //   id: rawMovie.id,
  //   title: rawMovie.title,
  //   date: rawMovie.release_date || rawMovie.date,
  //   score: rawMovie.vote_average || rawMovie.score,
  //   img: rawMovie.poster_path ? 'https://image.tmdb.org/t/p/w500' + rawMovie.poster_path : rawMovie.img,
  //   overview: rawMovie.overview,
  //   genre_ids: rawMovie.genre_ids || [],
  // };
  const movie = formatMovie(rawMovie);

  currentModalId = movie.id;
  currentModalMovie = movie; //モーダルで開いている映画を保持

  // 表示
  // document.getElementById('modal').classList.remove('hidden');
  const modal = document.getElementById('modal');
  // ⭐ 念のため初期化
  modal.classList.remove('show');

  modal.classList.remove('hidden');

  requestAnimationFrame(() => {
    modal.classList.add('show');
  });

  // ⭐ ローディング表示
  document.getElementById('modalLoading').style.display = 'block';

  // 初期表示
  document.getElementById('modalImg').src = movie.img || '';
  document.getElementById('modalTitle').textContent = movie.title;
  document.getElementById('modalDate').textContent = `公開日${movie.date}`;
  document.getElementById('modalScore').innerHTML = `評価⭐ <span class="${movie.scoreClass}">${movie.score}</span>`;
  document.getElementById('modalOverview').textContent = '読み込み中...';

  updateModalFavoriteButton(movie); //モーダル内お気に入り初期化

  let detail, jpDate, videos;

  // ⭐ キャッシュ
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

  // ⭐ 古いリクエスト防止
  if (currentModalId !== movie.id) return;

  // 概要 fallback（英語）
  let overview = detail?.overview;

  // fallback
  if (!overview || overview.trim() === '') {
    overview = movie.overview; // ← まずformat済み使う
  }

  if (!overview || overview.trim() === '') {
    // それでもなければ英語
    try {
      const res = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=${API_KEY}&language=en-US`);
      const enData = await res.json();
      overview = enData.overview || '概要なし';
    } catch {
      overview = '概要なし';
    }
  }

  document.getElementById('modalOverview').textContent = overview;
  // ⭐世界公開日
  document.getElementById('modalDate').textContent = `🌍 全世界公開日: ${movie.date}`;
  // ⭐ 日本公開日
  document.getElementById('modalCountry').textContent = `🗾 日本公開日: ${jpDate}`;

  // ⭐ ジャンル
  document.getElementById('modalGenres').textContent = `ジャンル: ${getGenres(movie.genre_ids)}`;

  // ⭐ トレーラー
  const trailer = videos.find(v => v.site === 'YouTube' && v.type === 'Trailer');

  const videoContainer = document.getElementById('modalVideo');

  if (trailer) {
    const thumbnail = `https://img.youtube.com/vi/${trailer.key}/hqdefault.jpg`;

    videoContainer.innerHTML = `
  <div class="videoThumb">
    <img src="${thumbnail}">
    <button class="playBtn">▶</button>
  </div>
`;

    const btn = videoContainer.querySelector('.playBtn');

    btn.addEventListener('click', () => {
      videoContainer.innerHTML = `
  <iframe width="100%" height="300"
    src="https://www.youtube.com/embed/${trailer.key}?mute=1&controls=1&rel=0"
    frameborder="0"
    allow="encrypted-media"
    allowfullscreen>
  </iframe>
`;
    });
  } else {
    videoContainer.innerHTML = '<p>動画なし</p>';
  }

  // ⭐ ローディング終了
  document.getElementById('modalLoading').style.display = 'none';
}

// ⭐ リセット
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
  // お気に入りも前回の状態を残さない処理
  const favBtn = document.getElementById('modalFavBtn');
  if (favBtn) {
    favBtn.classList.remove('active');
    favBtn.removeAttribute('data-id');
    favBtn.setAttribute('aria-pressed', 'false');
    favBtn.title = '';
  }

  currentModalId = null;
  currentModalMovie = null;
}

// ⭐ 閉じる処理
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('modalClose').addEventListener('click', () => {
    closeModal();
  });
  // 背景クリック
  document.getElementById('modal').addEventListener('click', e => {
    if (e.target.id === 'modal') {
      closeModal();
    }
  });
  //モーダル内❤クリック処理
  document.getElementById('modalFavBtn').addEventListener('click', e => {
    e.stopPropagation();
    if (!currentModalMovie) return;

    const favBtn = e.currentTarget;
    // ❤アニメーション
    favBtn.classList.add('pop');

    setTimeout(() => {
      favBtn.classList.remove('pop');
    }, 200);

    toggleFavorite(currentModalMovie);
  });
});
// モーダル閉じる処理
function closeModal() {
  const modal = document.getElementById('modal');

  // ⭐ 先にアニメーション開始
  modal.classList.remove('show');

  // ⭐ 終わってから消す
  setTimeout(() => {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    document.body.style.paddingRight = ''; // ⭐ここに移動
    resetModal();
  }, 300); // CSSと同じ時間
}

// お気に入り同期
document.addEventListener('favoritesUpdated', e => {
  if (!currentModalMovie) return;

  // 今開いてる映画と同じなら更新
  if (e.detail.movieId === currentModalMovie.id) {
    updateModalFavoriteButton(currentModalMovie);
  }
});
