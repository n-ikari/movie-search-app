// お気に入り一覧の表示を管理（UI）
import { getFavorites, toggleFavorite } from './favoritesStore.js';
import { openModal } from './modal.js';
import { smoothScrollTop, applyFadeIn } from './animation.js';

//state
let currentPage = 1;
const perPage = 6;

// ページネーション表示用
function getPagedMovies(movies) {
  const start = (currentPage - 1) * perPage;
  const end = start + perPage;

  return movies.slice(start, end);
}
// ページ情報表示
function updatePageInfo(total) {
  const start = (currentPage - 1) * perPage + 1;
  const end = Math.min(currentPage * perPage, total);

  const totalPages = Math.ceil(total / perPage);

  document.getElementById('pageInfo').textContent =
    `${start}-${end}件 / ${total}件（${currentPage} / ${totalPages}ページ）`;
}

//ページ遷移共通
function changePage(newPage) {
  currentPage = newPage;

  renderFavorites();

  setTimeout(() => {
    smoothScrollTop();
  }, 50);
}

// ページネーションボタン動作
document.getElementById('prevBtn').addEventListener('click', () => {
  if (currentPage === 1) return;

  changePage(currentPage - 1);
});

document.getElementById('nextBtn').addEventListener('click', () => {
  const total = getFavorites().length;
  const totalPages = Math.ceil(total / perPage);

  if (currentPage === totalPages) return;

  changePage(currentPage + 1);
});

//
function updateButtons(total) {
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  const totalPages = Math.ceil(total / perPage);

  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage === totalPages;
}

//
function renderFavorites() {
  const favs = getFavorites();

  const totalPages = Math.ceil(favs.length / perPage);

  if (currentPage > totalPages) {
    currentPage = totalPages || 1;
  }

  const paged = getPagedMovies(favs);

  renderMovies(paged);
  updatePageInfo(favs.length);
  updateButtons(favs.length);
}

// HTML描画
function renderMovies(movies) {
  const container = document.getElementById('movieList');

  if (!movies || movies.length === 0) {
    container.innerHTML = '<p>お気に入りがありません</p>';
    return;
  }

  let html = '';

  movies.forEach(movie => {
    html += renderMovieCard(movie, {
      isFavorite: true,
    });
  });

  container.innerHTML = html;

  // ⭐ 全カードにfadeIn付与
  applyFadeIn(container);
}

// クリックイベント
document.getElementById('movieList').addEventListener('click', e => {
  const favBtn = e.target.closest('.favBtn');
  if (favBtn) {
    const card = e.target.closest('.card');
    if (!card) return;

    const id = Number(card.dataset.id);

    // ⭐ これが必要
    const movie = getFavorites().find(f => f.id === id);

    card.classList.add('fadeOut');

    setTimeout(() => {
      toggleFavorite(movie); // ⭐ここで削除される
      // renderMovies(getFavorites());//renderMoviesはイベントでやるべきなので削除
    }, 300);

    return; // ←これ重要（ここで終了）
  }

  // ⭐ カードクリックではtoggleしない
  // カードクリック → モーダルだけ
  const card = e.target.closest('.card');
  if (!card) return;

  const id = Number(card.dataset.id);
  const movie = getFavorites().find(f => f.id === id);

  openModal(movie);
});

//差分更新
document.addEventListener('favoritesUpdated', () => {
  renderFavorites();
});

// 初期表示
document.addEventListener('DOMContentLoaded', () => {
  renderFavorites();
});
