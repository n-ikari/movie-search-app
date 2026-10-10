function AppFooter() {
  return (
    <footer className="appFooter">
      <div className="appFooterInner">
        <div className="appFooterCredit">
          <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer">
            <img src="/images/tmdb-logo.svg" alt="TMDB - The Movie Database" />
          </a>
          <span>映画情報・画像の提供元</span>
        </div>

        <p className="appFooterNotice">
          This product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
        <small className="appFooterCopyright">© 2026 CinemaPick. Developed by n-ikari.</small>
      </div>
    </footer>
  );
}

export default AppFooter;
