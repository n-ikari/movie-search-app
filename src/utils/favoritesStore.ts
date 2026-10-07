import type { Movie } from '../types/movie';

const FAVORITES_KEY = 'favorites';

// localStorageからお気に入りを読み込む
export function loadFavorites(): Movie[] {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
  } catch {
    return [];
  }
}

// お気に入りをlocalStorageに保存する
export function saveFavorites(favorites: Movie[]) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}
