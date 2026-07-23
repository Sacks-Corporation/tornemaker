/**
 * Coarse-grained account state, persisted on `User.state`.
 *
 * - `ACTIVE`   — default state for every user, set at creation time. The
 *                only state currently written by the application.
 * - `INACTIVE` — NOT persisted (yet). Intended to be derived at read time
 *                from `lastSignedIn` (e.g. "no sign-in in the last N days")
 *                rather than stored, so it never goes stale. Implement that
 *                derivation when the corresponding read endpoint is built.
 * - `BLOCKED`  — reserved for a future moderation feature (manually
 *                disabling an account). Not implemented yet — no code path
 *                sets this today.
 */
export enum UserState {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
}
