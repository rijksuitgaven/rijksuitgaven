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
