import { PrimaryNavigation } from "@/app/_components/primary-navigation";

export function PublicShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <header className="site-header">
        <div className="site-header__inner">
          <p className="site-header__title">Hello, World!</p>
        </div>
      </header>

      <div className="site-navigation-bar">
        <div className="site-navigation-bar__inner">
          <PrimaryNavigation />
        </div>
      </div>

      <main className="site-main" id="main-content" tabIndex={-1}>
        <aside className="preview-notice" aria-label="Sample content notice">
          Local portfolio preview. Project stories, writing, skill examples, and
          contact destinations use sample data.
        </aside>
        {children}
      </main>

      <footer className="site-footer">
        <div className="site-footer__inner">
          <p className="site-footer__title">ChanQ Developer Portfolio</p>
          <p className="site-footer__note">
            Practical experience, clear decisions, and honest reflection.
          </p>
        </div>
      </footer>
    </div>
  );
}
