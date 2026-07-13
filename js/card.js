function renderMovieCard(movie, options = {}) {
  const { isFavorite = false } = options;

  return `
    <div class="card" data-id="${movie.id}">

      <span class="favBtn ${isFavorite ? 'active' : ''}" data-id="${movie.id}">
        ❤
      </span>

      <div class="cardInner">
        ${movie.img ? `<img src="${movie.img}" alt="${movie.title}">` : `<p>画像なし</p>`}
      </div>

      <div class="cardInner">
        <h3 class="movieTitle">${movie.title}</h3>
        <p>🌎全世界公開日 ${movie.date}</p>
        <p class="score">評価⭐ <span class="${movie.scoreClass}">${movie.score}</span></p>
        <div class="overview"><p class="inner">${movie.overview || '概要なし'}</p></div>
      </div>
    </div>
  `;
}
