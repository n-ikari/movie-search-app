import { useState } from 'react';
import type { AnimationEvent } from 'react';

type StickySearchProps = {
  onClick: () => void;
  visible: boolean;
};

function StickySearch({ onClick, visible }: StickySearchProps) {
  const [isMounted, setIsMounted] = useState(visible);

  if (visible && !isMounted) {
    setIsMounted(true);
  }

  function handleAnimationEnd(event: AnimationEvent<HTMLButtonElement>) {
    if (event.target !== event.currentTarget) return;

    if (!visible && event.animationName === 'stickySearchDisappear') {
      setIsMounted(false);
    }
  }

  if (!isMounted) return null;

  return (
    <button
      type="button"
      className={`stickySearchButton ${visible ? 'is-visible' : 'is-hidden'}`}
      aria-label="検索メニューを開く"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      disabled={!visible}
      onClick={onClick}
      onAnimationEnd={handleAnimationEnd}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </svg>
    </button>
  );
}

export default StickySearch;
