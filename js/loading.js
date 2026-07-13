export function showSkeleton(container, count = 6) {
  let html = '';

  for (let i = 0; i < count; i++) {
    html += `<div class="skeleton skeleton-card"></div>`;
  }

  container.innerHTML = html;
}
