import { UserState } from './schemas/user-state.enum';
import {
  computeEffectiveUserState,
  INACTIVE_AFTER_DAYS,
} from './user-state.util';

const NOW = new Date('2026-07-22T12:00:00.000Z');

function daysBefore(reference: Date, days: number): Date {
  const result = new Date(reference);
  result.setDate(result.getDate() - days);
  return result;
}

describe('computeEffectiveUserState', () => {
  it('always reports BLOCKED when the persisted state is BLOCKED, regardless of lastSignedIn', () => {
    const recentSignIn = daysBefore(NOW, 1);
    expect(
      computeEffectiveUserState(UserState.BLOCKED, recentSignIn, NOW),
    ).toBe(UserState.BLOCKED);

    const veryOldSignIn = daysBefore(NOW, 400);
    expect(
      computeEffectiveUserState(UserState.BLOCKED, veryOldSignIn, NOW),
    ).toBe(UserState.BLOCKED);
  });

  it('reports ACTIVE when lastSignedIn is within the last 30 days', () => {
    const recentSignIn = daysBefore(NOW, INACTIVE_AFTER_DAYS - 1);
    expect(
      computeEffectiveUserState(UserState.ACTIVE, recentSignIn, NOW),
    ).toBe(UserState.ACTIVE);
  });

  it('reports INACTIVE when lastSignedIn is older than 30 days', () => {
    const oldSignIn = daysBefore(NOW, INACTIVE_AFTER_DAYS + 1);
    expect(computeEffectiveUserState(UserState.ACTIVE, oldSignIn, NOW)).toBe(
      UserState.INACTIVE,
    );
  });

  it('reports INACTIVE at exactly the 30-day boundary (strictly older than "now - 30d")', () => {
    const exactlyOnThreshold = daysBefore(NOW, INACTIVE_AFTER_DAYS);
    // Same instant as the threshold -> not strictly older -> still ACTIVE.
    expect(
      computeEffectiveUserState(UserState.ACTIVE, exactlyOnThreshold, NOW),
    ).toBe(UserState.ACTIVE);

    const oneMillisecondOlder = new Date(exactlyOnThreshold.getTime() - 1);
    expect(
      computeEffectiveUserState(UserState.ACTIVE, oneMillisecondOlder, NOW),
    ).toBe(UserState.INACTIVE);
  });

  it('never persists/mutates the state passed in — the enum itself is unaffected', () => {
    // Calling this repeatedly with the same inputs must stay pure/deterministic.
    const oldSignIn = daysBefore(NOW, 100);
    const first = computeEffectiveUserState(UserState.ACTIVE, oldSignIn, NOW);
    const second = computeEffectiveUserState(UserState.ACTIVE, oldSignIn, NOW);
    expect(first).toBe(second);
    expect(first).toBe(UserState.INACTIVE);
  });
});
