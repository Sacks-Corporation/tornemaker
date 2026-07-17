import {
  computeEliminationAiFillTeamCount,
  computeGroupDistribution,
  computeGroupStageAiFillTeamCount,
  nextPowerOfTwo,
} from './format-rules';

describe('computeGroupDistribution', () => {
  it('balances 10 teams capped at 4 per group into [4, 3, 3] (never [4, 4, 2])', () => {
    const result = computeGroupDistribution(10, 4);
    expect(result).toEqual({
      valid: true,
      groupCount: 3,
      groupSizes: [4, 3, 3],
    });
  });

  it('balances 7 teams capped at 4 per group into [4, 3]', () => {
    const result = computeGroupDistribution(7, 4);
    expect(result).toEqual({ valid: true, groupCount: 2, groupSizes: [4, 3] });
  });

  it('rejects 10 teams capped at 3 per group (would need a group of < 3)', () => {
    const result = computeGroupDistribution(10, 3);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toMatch(/10/);
      expect(result.reason).toMatch(/3/);
    }
  });

  it('rejects a distribution that would only produce a single group', () => {
    // groupCount = ceil(4 / 10) = 1 < 2.
    const result = computeGroupDistribution(4, 10);
    expect(result.valid).toBe(false);
  });

  it('produces perfectly even groups when teamCount is an exact multiple of groupCap', () => {
    const result = computeGroupDistribution(12, 4);
    expect(result).toEqual({
      valid: true,
      groupCount: 3,
      groupSizes: [4, 4, 4],
    });
  });

  it('every group size is within 1 of every other, and none exceeds groupCap', () => {
    for (let teamCount = 6; teamCount <= 64; teamCount++) {
      for (let groupCap = 3; groupCap <= 10; groupCap++) {
        const result = computeGroupDistribution(teamCount, groupCap);
        if (!result.valid) continue;
        const { groupSizes } = result;
        expect(groupSizes.reduce((a, b) => a + b, 0)).toBe(teamCount);
        expect(
          Math.max(...groupSizes) - Math.min(...groupSizes),
        ).toBeLessThanOrEqual(1);
        for (const size of groupSizes) {
          expect(size).toBeLessThanOrEqual(groupCap);
          expect(size).toBeGreaterThanOrEqual(3);
        }
      }
    }
  });
});

describe('nextPowerOfTwo', () => {
  it('returns the smallest power of two >= n', () => {
    expect(nextPowerOfTwo(1)).toBe(1);
    expect(nextPowerOfTwo(7)).toBe(8);
    expect(nextPowerOfTwo(8)).toBe(8);
    expect(nextPowerOfTwo(15)).toBe(16);
    expect(nextPowerOfTwo(64)).toBe(64);
  });
});

describe('computeEliminationAiFillTeamCount', () => {
  it('pads 7 real teams up to 8 (next power of two)', () => {
    expect(computeEliminationAiFillTeamCount(7)).toBe(8);
  });

  it('pads 15 real teams up to 16', () => {
    expect(computeEliminationAiFillTeamCount(15)).toBe(16);
  });

  it('leaves an already-power-of-two count untouched', () => {
    expect(computeEliminationAiFillTeamCount(16)).toBe(16);
  });
});

describe('computeGroupStageAiFillTeamCount', () => {
  it('pads 10 real teams (groupCap=4) up to 12 (3 clean groups of 4)', () => {
    expect(computeGroupStageAiFillTeamCount(10, 4)).toBe(12);
  });

  it('leaves an already-clean multiple untouched', () => {
    expect(computeGroupStageAiFillTeamCount(12, 4)).toBe(12);
  });

  it('caps the fill target at 64 even if the next multiple would exceed it', () => {
    // 63 real teams, groupCap=10 -> next multiple of 10 is 70, capped to 64.
    expect(computeGroupStageAiFillTeamCount(63, 10)).toBe(64);
  });
});
