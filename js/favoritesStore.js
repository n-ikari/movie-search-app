// favoritesStore.js　👉 localStorageを直接触るのはここだけ
import { showToast } from './toast.js';
const FAVORITES_KEY = 'favorites';

let favorites = loadFavorites();

function loadFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
  } catch {
    return [];
  }
}

function saveFavorites() {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

// ⭐ 外から取得
export function getFavorites() {
  return favorites;
}

// ⭐ トグル
export function toggleFavorite(movie) {
  const exists = favorites.find(f => f.id === movie.id);

  if (exists) {
    favorites = favorites.filter(f => f.id !== movie.id);
    showToast('お気に入りから削除しました', 'remove');
  } else {
    favorites.push(movie);
    showToast('お気に入りに追加しました', 'add');
  }

  saveFavorites();

  document.dispatchEvent(
    new CustomEvent('favoritesUpdated', {
      detail: { movieId: movie.id }
    })
  );
}
