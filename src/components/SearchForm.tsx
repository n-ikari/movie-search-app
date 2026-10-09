
import type { ChangeEvent, FormEvent } from 'react';

type SearchFormProps = {
  query: string;
  genre: string;
  sort: string;
  nowPlaying: boolean;
  genreOptions: Record<number, string>;
  onQueryChange: (value: string) => void;
  onGenreChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  onSortChange: (value: string) => void;
  onNowPlayingChange: (checked: boolean) => void;
  onSearch: (event: FormEvent<HTMLFormElement>) => void;
};

function SearchForm({
  query,
  genre,
  sort,
  nowPlaying,
  genreOptions,
  onQueryChange,
  onGenreChange,
  onSortChange,
  onNowPlayingChange,
  onSearch,
}: SearchFormProps) {
  return (
    <div className="l-serchWrap">
      <div className="l-sortArea">
        <select
          id="genreFilter"
          aria-label="ジャンル"
          value={genre}
          onChange={onGenreChange}>
          <option value="">すべて</option>

          {Object.entries(genreOptions).map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>

        <select
          id="sortSelect"
          aria-label="並び順"
          value={sort}
          onChange={event => onSortChange(event.target.value)}>
          <option value="popularity.desc">人気順</option>
          <option value="vote_average.desc">評価順</option>
          <option value="primary_release_date.desc">公開日順</option>
        </select>

        <label>
          <input
            type="checkbox"
            id="nowPlayingCheck"
            checked={nowPlaying}
            onChange={event => onNowPlayingChange(event.target.checked)}
          />
          最近1ヶ月
        </label>
      </div>

      <form className="l-serchArea" onSubmit={onSearch}>
        <input
          type="text"
          id="searchInput"
          aria-label="映画名"
          placeholder="映画名で検索"
          value={query}
          onChange={event => onQueryChange(event.target.value)}
        />

        <button type="submit" id="searchBtn">
          検索
        </button>
      </form>
    </div>
  );
}

export default SearchForm;
