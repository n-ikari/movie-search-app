export function showToast(message, type = 'remove') {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;

  // ⭐ 一旦リセット
  toast.classList.remove('add', 'remove');

  // ⭐ タイプ付与
  toast.classList.add(type);

  // 表示
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 2000);
}
