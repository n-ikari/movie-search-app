document.getElementById('searchBtn').addEventListener('click', async () => {
  const API_KEY = '1acc3e32f5ebe1618e3b8b3b0ff9c172';
  const keyword = document.getElementById('keyword').value;

  document.getElementById('result').innerHTML = '読み込み中...';

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${keyword}&language=ja-JP`
    );

    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      document.getElementById('result').innerHTML = '見つかりません';
      return;
    }

    // 1件表示
    const movie = data.results[0];

    const imgUrl = movie.poster_path
      ? 'https://image.tmdb.org/t/p/w500' + movie.poster_path
      : '';

    document.getElementById('result').innerHTML = `
      <h2>${movie.title}</h2>
      ${imgUrl ? `<img src="${imgUrl}" width="100">` : `<p>画像なし</p>`}
      <p>${movie.overview}</p>
      <p>公開日: ${movie.release_date}</p>
    `;

    // 一覧表示
    let listHtml = '';

    data.results.forEach(movie => {
      listHtml += `<li>${movie.title}</li>`;
    });

    document.getElementById('titleList').innerHTML = listHtml;

  } catch (error) {
    document.getElementById('result').innerHTML = 'エラー発生';
  }
});
