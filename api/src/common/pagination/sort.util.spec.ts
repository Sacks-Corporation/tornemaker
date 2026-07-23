import { SortDirection } from './sort-direction.enum';
import { resolveSortStage, SortDefault, SortWhitelist } from './sort.util';

describe('resolveSortStage', () => {
  const whitelist: SortWhitelist = {
    name: ['firstName', 'lastName'],
    email: 'email',
  };
  const defaultSort: SortDefault = {
    field: 'createdAt',
    direction: SortDirection.DESC,
  };

  it('maps a single-field whitelist entry to a $sort object, ascending', () => {
    const stage = resolveSortStage(
      'email',
      SortDirection.ASC,
      whitelist,
      defaultSort,
    );
    expect(stage).toEqual({ email: 1 });
  });

  it('maps a single-field whitelist entry to a $sort object, descending', () => {
    const stage = resolveSortStage(
      'email',
      SortDirection.DESC,
      whitelist,
      defaultSort,
    );
    expect(stage).toEqual({ email: -1 });
  });

  it('defaults to ascending when sortField is whitelisted but sortDirection is omitted', () => {
    const stage = resolveSortStage('email', undefined, whitelist, defaultSort);
    expect(stage).toEqual({ email: 1 });
  });

  it('applies the SAME direction to every DB field of a multi-field (secondary tie-breaker) entry', () => {
    const stage = resolveSortStage(
      'name',
      SortDirection.DESC,
      whitelist,
      defaultSort,
    );
    expect(stage).toEqual({ firstName: -1, lastName: -1 });
  });

  it('falls back to the default when sortField is undefined', () => {
    const stage = resolveSortStage(
      undefined,
      SortDirection.ASC,
      whitelist,
      defaultSort,
    );
    expect(stage).toEqual({ createdAt: -1 });
  });

  it('falls back to the default when sortField is not a whitelist key (never 400s)', () => {
    const stage = resolveSortStage(
      'somethingNotWhitelisted',
      SortDirection.ASC,
      whitelist,
      defaultSort,
    );
    expect(stage).toEqual({ createdAt: -1 });
  });

  it('resolves the default with ascending direction when configured that way', () => {
    const stage = resolveSortStage(undefined, undefined, whitelist, {
      field: 'createdAt',
      direction: SortDirection.ASC,
    });
    expect(stage).toEqual({ createdAt: 1 });
  });

  it('never forwards the raw sortField as a DB field name when it is not whitelisted', () => {
    const stage = resolveSortStage(
      'somePotentiallyDangerousRawField',
      SortDirection.ASC,
      whitelist,
      defaultSort,
    );
    expect(stage).toEqual({ createdAt: -1 });
    expect(Object.keys(stage)).toEqual(['createdAt']);
  });
});
