import { useEffect, useRef, useState } from 'react';
import { fetchMovieDetail, fetchJapanReleaseDate, fetchMovieTrailer, fetchEnglishOverview } from '../services/tmdbApi';
import type { Movie } from '../types/movie';

type MovieModalProps = {
  movie: Movie;
  isFavorite: boolean;
  onToggleFavorite: (movie: Movie) => void;
  onClose: () => void;
};

function MovieModal({ movie, isFavorite, onToggleFavorite, onClose }: MovieModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  const [isClosing, setIsClosing] = useState(false);
  // ハートのアニメーション用
  const [isPopping, setIsPopping] = useState(false);
  // 詳細情報を管理するstateを追加
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof fetchMovieDetail>> | null>(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [detailError, setDetailError] = useState('');
  // 日本語の概要がない場合に使用する英語版の概要
  const [englishOverview, setEnglishOverview] = useState('');
  const [englishOverviewLoading, setEnglishOverviewLoading] = useState(false);
  const [japanReleaseDate, setJapanReleaseDate] = useState('読み込み中...');
  // YouTube動画
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [trailerLoading, setTrailerLoading] = useState(true);
  // モーダルを閉じる処理
  function handleClose() {
    if (isClosing) return;

    setIsClosing(true);
  }

  // モーダルを開いたら閉じるボタンにフォーカスし、閉じたら元に戻す

  // モーダルを開いたら閉じるボタンにフォーカスし、閉じたら元に戻す
  useEffect(() => {
    const previousActiveElement = document.activeElement;

    closeButtonRef.current?.focus();

    return () => {
      if (previousActiveElement instanceof HTMLElement && previousActiveElement.isConnected) {
        previousActiveElement.focus();
      }
    };
  }, []);

  // ① 背景スクロールの固定・復元
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';

    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, []);

  // ② Escキーで閉じる・Tabキーをモーダル内に制限する
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsClosing(true);
        return;
      }

      if (event.key !== 'Tab') return;

      const modalContent = modalContentRef.current;
      if (!modalContent) return;

      const focusableElements = Array.from(
        modalContent.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter(element => element.getClientRects().length > 0);

      if (focusableElements.length === 0) {
        event.preventDefault();
        modalContent.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab：最初の要素から最後の要素へ
        if (document.activeElement === firstElement || !modalContent.contains(document.activeElement)) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab：最後の要素から最初の要素へ
        if (document.activeElement === lastElement || !modalContent.contains(document.activeElement)) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // ③ フェードアウト完了後にモーダルを閉じる
  useEffect(() => {
    if (!isClosing) return;

    const timer = setTimeout(() => {
      onClose();
    }, 300);

    return () => clearTimeout(timer);
  }, [isClosing, onClose]);

  // API取得用のuseEffectを追加
  useEffect(() => {
    let cancelled = false;

    async function loadDetail() {
      try {
        setDetailLoading(true);
        setDetailError('');
        setDetail(null);

        const data = await fetchMovieDetail(movie.id);

        if (!cancelled) {
          setDetail(data);
        }
      } catch (error) {
        console.error(error);

        if (!cancelled) {
          setDetailError('映画の詳細情報を取得できませんでした。');
        }
      } finally {
        if (!cancelled) {
          setDetailLoading(false);
        }
      }
    }

    loadDetail();

    return () => {
      // 別の映画に切り替わったり、モーダルが閉じられたりした後に、古いAPIレスポンスでstateを更新しない
      cancelled = true;
    };
  }, [movie.id]);

  // 予告編取得用のuseEffectを追加
  useEffect(() => {
    let cancelled = false;

    async function loadTrailer() {
      try {
        const key = await fetchMovieTrailer(movie.id);

        if (!cancelled) {
          setTrailerKey(key);
        }
      } catch (error) {
        console.error('予告編の取得に失敗しました:', error);
      } finally {
        if (!cancelled) {
          setTrailerLoading(false);
        }
      }
    }

    loadTrailer();

    return () => {
      cancelled = true;
    };
  }, [movie.id]);

  // 日本公開日取得用のuseEffectを追加
  useEffect(() => {
    let cancelled = false;

    async function loadJapanReleaseDate() {
      try {
        const date = await fetchJapanReleaseDate(movie.id);

        if (!cancelled) {
          setJapanReleaseDate(date);
        }
      } catch (error) {
        console.error(error);

        if (!cancelled) {
          setJapanReleaseDate('取得失敗');
        }
      }
    }

    loadJapanReleaseDate();

    return () => {
      cancelled = true;
    };
  }, [movie.id]);

  // 英語版概要を取得する

  useEffect(() => {
    // 日本語の詳細取得が終わるまで待つ
    if (detailLoading || detailError) return;

    // 日本語の概要があれば英語版は取得しない
    if (detail?.overview?.trim()) return;

    // 一覧取得時の概要があれば英語版は取得しない
    if (movie.overview && movie.overview !== '概要なし') return;

    let cancelled = false;

    async function loadEnglishOverview() {
      try {
        setEnglishOverviewLoading(true);

        const overview = await fetchEnglishOverview(movie.id);

        if (!cancelled) {
          setEnglishOverview(overview);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('英語版概要の取得に失敗しました:', error);
        }
      } finally {
        if (!cancelled) {
          setEnglishOverviewLoading(false);
        }
      }
    }

    loadEnglishOverview();

    return () => {
      cancelled = true;
    };
  }, [movie.id, movie.overview, detail?.overview, detailLoading, detailError]);

  return (
    // ここから下は既存のJSXをそのまま使用
    <div
      className={`modal ${isClosing ? 'closing' : 'show'}`}
      onClick={event => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}>
      <div
        ref={modalContentRef}
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-label={movie.title}
        tabIndex={-1}>
        <div className="modalActions">
          <button
            type="button"
            className={`favBtn ${isFavorite ? 'active' : ''} ${isPopping ? 'pop' : ''}`}
            aria-label={isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'}
            aria-pressed={isFavorite}
            onClick={() => {
              setIsPopping(true);
              onToggleFavorite(movie);
            }}
            onAnimationEnd={() => {
              setIsPopping(false);
            }}>
            ❤
          </button>

          <button ref={closeButtonRef} type="button" id="modalClose" aria-label="閉じる" onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className="modalInner">
          <div className="modalGridLeft">{movie.img ? <img src={movie.img} alt={movie.title} /> : <p>画像なし</p>}</div>

          <div className="modalGridRight">
            <div className="modalTitleRow">
              <h2>{movie.title}</h2>
            </div>

            <p>🌍 全世界公開日: {movie.date}</p>
            <p>🗾 日本公開日: {japanReleaseDate}</p>

            <p className="score">
              評価⭐ <span className={movie.scoreClass}>{movie.score}</span>
            </p>
            {detail && detail.genres.length > 0 && (
              <div className="modalGenres">
                <strong>ジャンル：</strong>
                <span>{detail.genres.map(genre => genre.name).join(' / ')}</span>
              </div>
            )}
            {/* あらすじの表示 */}
            {detailLoading ? (
              <p>詳細情報を読み込み中...</p>
            ) : detailError ? (
              <>
                <p>{detailError}</p>
                <p>{movie.overview}</p>
              </>
            ) : (
              <p>
                {detail?.overview?.trim() ||
                  (movie.overview !== '概要なし' ? movie.overview : '') ||
                  englishOverview ||
                  (englishOverviewLoading ? '英語版の概要を読み込み中...' : '概要なし')}
              </p>
            )}
          </div>
        </div>
        <div className="modalVideo">
          <h3>予告編</h3>

          {trailerLoading ? (
            <p>予告編を読み込み中...</p>
          ) : trailerKey ? (
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}`}
              title={`${movie.title}の予告編`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
            />
          ) : (
            <p>予告編はありません。</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default MovieModal;
