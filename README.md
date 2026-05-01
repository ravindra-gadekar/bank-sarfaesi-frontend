# Bank SARFAESI — Frontend

React 19 + Vite SPA for the Bank SARFAESI notice management system.

## Tech Stack

- React 19
- Vite (TypeScript)
- Zustand for state management (auth + notice form/chat)
- React Router with lazy-loaded routes
- Axios with auto-refresh 401 interceptor
- Vitest (jsdom) for testing

## Quick Start

```bash
# Install dependencies
npm install

# Run dev server
npm run dev
```

Dev server runs on `http://localhost:3000` and proxies `/api` to `http://localhost:5000`.

## Scripts

| Command         | Description                            |
| --------------- | -------------------------------------- |
| `npm run dev`   | Vite dev server on port 3000           |
| `npm run build` | `tsc` then `vite build`                |
| `npm test`      | Vitest (jsdom env)                     |
| `npm run lint`  | ESLint over `src/`                     |

## Architecture Notes

- **Single API client**: `lib/apiClient.ts` is the only HTTP entry point — uses `withCredentials: true` and a 401 refresh interceptor with request queueing.
- **Two-stage auth**: `authStore` tracks `isAuthenticated` (after OTP/SSO) and `hasBranch` (after branch selection). `ProtectedRoute` gates accordingly.
- **Shared form↔chat state**: `noticeFieldsStore` is the single source of truth for both the form panel and the chat assistant — never maintain parallel state.
- **Chat-flow engine**: rule-based, driven by `chatFlowConfigs` documents from the backend (no LLM in v1.0).
