
type StickySearchProps = {
  onClick: () => void;
};

function StickySearch({ onClick }: StickySearchProps) {
  return (
    <button
      type="button"
      className="stickySearchButton"
      aria-label="検索メニューを開く"
      onClick={onClick}
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
