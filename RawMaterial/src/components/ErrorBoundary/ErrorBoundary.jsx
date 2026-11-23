import { Component } from "react";

// Catches render errors in a page so one broken screen doesn't blank the whole app.
// Reset it by changing its `key` (Layout keys it by route, so navigating away recovers).
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Page crashed:", error, info?.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    // A failed lazy-chunk load usually means a new version was deployed
    const isChunkError = /Loading chunk|dynamically imported module|Importing a module script failed/i.test(
      error?.message || ""
    );

    return (
      <div className="page">
        <div className="card card-body max-w-md mx-auto mt-16 text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-2xl">
            ⚠️
          </div>
          <h2 className="text-lg font-bold text-ink-950">
            {isChunkError ? "A new version is available" : "Something went wrong on this page"}
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            {isChunkError
              ? "Please reload to get the latest version of the app."
              : "The rest of the app still works. Try reloading, or go to another page from the menu."}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 inline-flex items-center justify-center rounded-lg bg-ink-950 px-4 py-2 text-sm font-semibold text-brand-400 hover:bg-ink-800"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
