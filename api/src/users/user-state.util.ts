import { UserState } from './schemas/user-state.enum';

/**
 * Number of days of inactivity (no sign-in) after which an otherwise-ACTIVE
 * user is reported as `INACTIVE`. Named constant so the threshold isn't a
 * magic number sprinkled across the codebase — see `computeEffectiveUserState`.
 */
export const INACTIVE_AFTER_DAYS = 30;

/**
 * Computes a user's EFFECTIVE state for display purposes — see the
 * "derived, not persisted" contract documented on `UserState.INACTIVE` in
 * `user-state.enum.ts`. This runs fresh on every call (e.g. every `GET
 * /users` request); the result is NEVER written back to `User.state`.
 *
 * Precedence:
 * 1. A persisted `BLOCKED` state always wins, regardless of `lastSignedIn`.
 * 2. Otherwise, if `lastSignedIn` is older than `INACTIVE_AFTER_DAYS` days
 *    (relative to `now`), the effective state is `INACTIVE`.
 * 3. Otherwise, `ACTIVE`.
 *
 * `now` defaults to the current time and is only overridden by tests, so
 * production callers should never pass it explicitly.
 */
export function computeEffectiveUserState(
  persistedState: UserState,
  lastSignedIn: Date,
  now: Date = new Date(),
): UserState {
  if (persistedState === UserState.BLOCKED) {
    return UserState.BLOCKED;
  }

  const inactivityThreshold = new Date(now);
  inactivityThreshold.setDate(
    inactivityThreshold.getDate() - INACTIVE_AFTER_DAYS,
  );

  if (lastSignedIn.getTime() < inactivityThreshold.getTime()) {
    return UserState.INACTIVE;
  }

  return UserState.ACTIVE;
}
