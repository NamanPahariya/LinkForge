import { useEffect, useId, useState } from 'react';

const apiBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10.6 13.4a2 2 0 0 0 2.8 0l3-3a2 2 0 1 0-2.8-2.8l-1 1" />
      <path d="M13.4 10.6a2 2 0 0 0-2.8 0l-3 3a2 2 0 1 0 2.8 2.8l1-1" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14M14 7l5 5-5 5" />
    </svg>
  );
}

export default function App() {
  const inputId = useId();
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recentUrls, setRecentUrls] = useState([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);
  const [recentError, setRecentError] = useState('');
  const [copiedCode, setCopiedCode] = useState('');
  const [deletingCode, setDeletingCode] = useState('');

  useEffect(() => {
    let isCurrent = true;

    async function loadRecentUrls() {
      try {
        const response = await fetch(`${apiBase}/urls`);
        const payload = await response.json().catch(() => ({}));

        if (!response.ok || !Array.isArray(payload.data)) {
          throw new Error('Recent links could not be loaded.');
        }

        if (isCurrent) setRecentUrls(payload.data);
      } catch {
        if (isCurrent) setRecentError('Recent links are temporarily unavailable.');
      } finally {
        if (isCurrent) setIsLoadingRecent(false);
      }
    }

    loadRecentUrls();
    return () => { isCurrent = false; };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setResult(null);
    setCopiedCode('');

    let parsedUrl;
    try {
      parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error();
    } catch {
      setError('Enter a complete web address beginning with http:// or https://.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${apiBase}/urls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: parsedUrl.href }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.data?.shortUrl) {
        throw new Error(payload.error?.message || payload.error || 'We could not shorten that link.');
      }

      setResult(payload.data);
      setRecentUrls((current) => [
        payload.data,
        ...current.filter((item) => item.shortCode !== payload.data.shortCode),
      ].slice(0, 10));
      setRecentError('');
    } catch (requestError) {
      setError(requestError.message === 'Failed to fetch'
        ? 'The shortening service is unavailable. Please try again shortly.'
        : requestError.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function copyShortUrl(item) {
    if (!item?.shortUrl) return;
    try {
      await navigator.clipboard.writeText(item.shortUrl);
      setCopiedCode(item.shortCode);
      window.setTimeout(() => setCopiedCode(''), 2200);
    } catch {
      setError('Copying was blocked. Select the short link and copy it manually.');
    }
  }

  async function deleteShortUrl(item) {
    if (!window.confirm(`Delete ${item.shortUrl}? This link will stop working.`)) return;

    setDeletingCode(item.shortCode);
    setRecentError('');

    try {
      const response = await fetch(`${apiBase}/urls/${encodeURIComponent(item.shortCode)}`, {
        method: 'DELETE',
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error?.message || payload.error || 'The link could not be deleted.');
      }

      setRecentUrls((current) => current.filter(({ shortCode }) => shortCode !== item.shortCode));
      if (result?.shortCode === item.shortCode) setResult(null);
      if (copiedCode === item.shortCode) setCopiedCode('');
    } catch (requestError) {
      setRecentError(requestError.message === 'Failed to fetch'
        ? 'The deletion service is unavailable. Please try again shortly.'
        : requestError.message);
    } finally {
      setDeletingCode('');
    }
  }

  return (
    <div className="page-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="LinkForge home">
          <span className="brand-mark"><LinkIcon /></span>
          Link<span>Forge</span>
        </a>
        <p>Fast. Simple. Reliable.</p>
      </header>

      <main>
        <section className="hero" aria-labelledby="page-title">
          <div className="eyebrow"><span /> Links that go further</div>
          <h1 id="page-title">Make every link<br /><em>worth sharing.</em></h1>
          <p className="intro">Turn unwieldy URLs into concise, memorable links in a single click. No account, no clutter.</p>

          <div className="shortener-card">
            <form onSubmit={handleSubmit} noValidate>
              <label htmlFor={inputId}>Paste your long URL</label>
              <div className="input-row">
                <div className="input-wrap">
                  <LinkIcon />
                  <input
                    id={inputId}
                    type="url"
                    inputMode="url"
                    autoComplete="url"
                    placeholder="https://example.com/a/very/long/link"
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    aria-describedby={error ? 'form-message' : undefined}
                    aria-invalid={Boolean(error)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <button className="primary-button" type="submit" disabled={isLoading || !url.trim()}>
                  {isLoading ? <span className="spinner" aria-hidden="true" /> : <ArrowIcon />}
                  {isLoading ? 'Forging…' : 'Shorten link'}
                </button>
              </div>
            </form>

            <div id="form-message" className="message-region" aria-live="polite">
              {error && <p className="error-message">{error}</p>}
              {result && (
                <div className="result-card">
                  <div className="result-copy">
                    <span>Your short link is ready</span>
                    <a href={result.shortUrl} target="_blank" rel="noreferrer">{result.shortUrl}</a>
                  </div>
                  <button className="copy-button" type="button" onClick={() => copyShortUrl(result)}>
                    {copiedCode === result.shortCode ? 'Copied!' : 'Copy link'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <ul className="trust-list" aria-label="Service benefits">
            <li><span>✓</span> Free to use</li>
            <li><span>✓</span> Instant results</li>
            <li><span>✓</span> No sign-up required</li>
          </ul>
        </section>

        <section className="recent-section" aria-labelledby="recent-title">
          <div className="recent-heading">
            <div>
              <span>History</span>
              <h2 id="recent-title">Recently shortened</h2>
            </div>
            <p>Your 10 newest links from this session</p>
          </div>

          {isLoadingRecent && <p className="recent-status">Loading recent links…</p>}
          {!isLoadingRecent && recentError && (
            <p className="recent-status error-message" role="alert">{recentError}</p>
          )}
          {!isLoadingRecent && !recentError && recentUrls.length === 0 && (
            <p className="recent-status">Your shortened links will appear here.</p>
          )}
          {recentUrls.length > 0 && (
            <ul className="recent-list">
              {recentUrls.map((item) => (
                <li key={item.shortCode}>
                  <span className="recent-icon"><LinkIcon /></span>
                  <div className="recent-link-copy">
                    <a href={item.shortUrl} target="_blank" rel="noreferrer">{item.shortUrl}</a>
                    <span title={item.originalUrl}>{item.originalUrl}</span>
                  </div>
                  <time dateTime={item.createdAt}>
                    {new Intl.DateTimeFormat(undefined, {
                      hour: 'numeric',
                      minute: '2-digit',
                    }).format(new Date(item.createdAt))}
                  </time>
                  <div className="recent-actions">
                    <button className="copy-button" type="button" onClick={() => copyShortUrl(item)}>
                      {copiedCode === item.shortCode ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      className="delete-button"
                      type="button"
                      onClick={() => deleteShortUrl(item)}
                      disabled={deletingCode === item.shortCode}
                      aria-label={`Delete short link ${item.shortUrl}`}
                    >
                      {deletingCode === item.shortCode ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer>
        <p>Built for links that matter.</p>
        <p>© {new Date().getFullYear()} LinkForge</p>
      </footer>
    </div>
  );
}
