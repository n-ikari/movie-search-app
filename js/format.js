// export function formatMovie(movie) {
//   return {
//     id: movie.id,
//     title: movie.title || 'タイトルなし',
//     date: movie.release_date || movie.date || '不明',
//     score:
//       typeof movie.vote_average === 'number'
//         ? movie.vote_average.toFixed(1)
//         : typeof movie.score === 'number'
//           ? movie.score.toFixed(1)
//           : !isNaN(Number(movie.score))
//             ? Number(movie.score).toFixed(1)
//             : 'なし',
//     overview: movie.overview?.trim() || '概要なし',
//     img: movie.poster_path ? 'https://image.tmdb.org/t/p/w500' + movie.poster_path : movie.img || null,
//     genre_ids: movie.genre_ids || [],
//     poster_path: movie.poster_path,
//     release_date: movie.release_date,
//     vote_average: movie.vote_average,
//   };
// }
// // 評価の色変え
// function getScoreClass(score) {
//   const num = Number(score);

//   if (isNaN(num)) return '';

//   if (num >= 7) return 'high';
//   if (num >= 5) return 'medium';
//   return 'low';
// }

export function formatMovie(movie) {
  const score =
    typeof movie.vote_average === 'number'
      ? movie.vote_average.toFixed(1)
      : typeof movie.score === 'number'
        ? movie.score.toFixed(1)
        : !isNaN(Number(movie.score))
          ? Number(movie.score).toFixed(1)
          : 'なし';

  return {
    id: movie.id,
    title: movie.title || 'タイトルなし',
    date: movie.release_date || movie.date || '不明',
    score: score,
    scoreClass: getScoreClass(score), // ⭐これ追加
    overview: movie.overview?.trim() || '概要なし',
    img: movie.poster_path ? 'https://image.tmdb.org/t/p/w500' + movie.poster_path : movie.img || null,
    genre_ids: movie.genre_ids || [],
    poster_path: movie.poster_path,
    release_date: movie.release_date,
    vote_average: movie.vote_average,
  };
}

// ⭐外から使わないならexportしなくてOK
function getScoreClass(score) {
  const num = Number(score);

  if (isNaN(num)) return '';
  if (num >= 7) return 'high';
  if (num >= 5) return 'medium';
  return 'low';
}
