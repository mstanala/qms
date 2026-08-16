import { environment } from '../../environments/environment';

/**
 * The base URL baked into every service as a literal
 * (`const API_BASE_URL = 'http://localhost:8082/api/v1'`). Requests are written
 * against it and rewritten at runtime by `apiUrlInterceptor`.
 */
export const DEV_API_BASE = 'http://localhost:8082';

/** Where those requests actually go: localhost in dev, the tunnel in prod. */
export const API_BASE = environment.apiBaseUrl.replace(/\/+$/, '');

/**
 * True when a request targets our backend, whether or not `apiUrlInterceptor`
 * has already rewritten the host.
 *
 * This has to accept both forms. Interceptors run in the order they are
 * registered -- `[apiUrlInterceptor, authInterceptor]` -- so by the time the
 * auth interceptor sees a request in a production build, the URL has already
 * become https://qms.mechatronlabs.com/... and no longer starts with the
 * localhost literal. Testing only the literal silently dropped the
 * Authorization header on every deployed API call while working perfectly in
 * dev, where the rewrite is a no-op (localhost -> localhost).
 */
export function isBackendApiUrl(url: string): boolean {
  return url.startsWith(`${DEV_API_BASE}/api/`) || url.startsWith(`${API_BASE}/api/`);
}
