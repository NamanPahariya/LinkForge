import { useId, useState } from 'react';

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
  const [copied, setCopied] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setResult(null);
    setCopied(false);

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
    } catch (requestError) {
      setError(requestError.message === 'Failed to fetch'
        ? 'The shortening service is unavailable. Please try again shortly.'
        : requestError.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function copyShortUrl() {
    if (!result?.shortUrl) return;
    try {
      await navigator.clipboard.writeText(result.shortUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setError('Copying was blocked. Select the short link and copy it manually.');
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
                  <button className="copy-button" type="button" onClick={copyShortUrl}>
                    {copied ? 'Copied!' : 'Copy link'}
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
      </main>

      <footer>
        <p>Built for links that matter.</p>
        <p>© {new Date().getFullYear()} LinkForge</p>
      </footer>
    </div>
  );
}
