/**
 * Coarse-grained account state, persisted on `User.state`.
 *
 * - `ACTIVE`   — default state for every user, set at creation time. Also
 *                the state a backoffice admin restores via
 *                `PATCH /users/:id/enable` (`UsersService.enableUser`).
 * - `INACTIVE` — NOT persisted. Derived at read time from `lastSignedIn`
 *                (e.g. "no sign-in in the last N days") rather than stored,
 *                so it never goes stale — see `computeEffectiveUserState`.
 * - `BLOCKED`  — persisted by a backoffice admin moderation action:
 *                `PATCH /users/:id/disable` (`UsersService.disableUser`)
 *                sets it, alongside `enabled: false`. Always wins over
 *                `lastSignedIn`-derived `INACTIVE`/`ACTIVE` when computing
 *                the effective state — see `computeEffectiveUserState`.
 */
export enum UserState {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
}
