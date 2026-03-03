/**
 * Centralized API configuration.
 *
 * All components should import API_BASE_URL from here
 * instead of defining it locally.
 *
 * BFF Pattern: All API calls go through Next.js API routes (/api/v1/...)
 * which proxy to the backend. This hides the backend URL from browsers.
 */

// Empty string = relative URLs, calls go to /api/v1/... on same origin
export const API_BASE_URL = ''

/**
 * Headers for mutating requests (POST/PUT/PATCH/DELETE).
 *
 * X-Requested-With: XMLHttpRequest — CSRF protection.
 * HTML forms cannot set custom headers, so this proves the request
 * came from JavaScript. The backend rejects requests without it.
 */
export const MUTATION_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'X-Requested-With': 'XMLHttpRequest',
}
