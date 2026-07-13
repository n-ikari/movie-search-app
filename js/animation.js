export function applyFadeIn(container) {
  const cards = container.querySelectorAll('.card');

  cards.forEach((card, index) => {
    card.classList.add('fadeIn');

    setTimeout(() => {
      card.classList.add('show');
    }, index * 80);
  });
}


// クロスフェード
export function crossFade(container, renderFn) {
  container.style.opacity = '0';

  setTimeout(() => {
    renderFn(); // ⭐ 描画処理

    container.style.opacity = '1';
  }, 150);
}

// トップへスクロール
export function smoothScrollTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}
