import { Model, Types } from 'mongoose';
import { PaginationQueryDto, SortDirection } from '../common/pagination';
import { UtilsService } from '../utils/utils.service';
import { DrawService } from './draw/draw.service';
import { MatchProgressionService } from './progression/match-progression.service';
import { TournamentFormat } from './schemas/common/tournament-format.enum';
import { TournamentState } from './schemas/common/tournament-state.enum';
import {
  Tournament,
  TournamentDocument,
  TournamentStatus,
} from './schemas/tournament.schema';
import { TournamentListAggregationRow } from './tournament-list-item';
import { TournamentsService } from './tournaments.service';

/** Minimal fake of the chainable `aggregate(...).exec()` surface
 *  `findAllPaginatedForBackoffice` uses. */
function makeAggregateChain(result: TournamentListAggregationRow[]) {
  return { exec: jest.fn().mockResolvedValue(result) };
}

function makeModel(rows: TournamentListAggregationRow[], total: number) {
  const aggregateChain = makeAggregateChain(rows);
  const aggregate = jest.fn().mockReturnValue(aggregateChain);
  const countExec = jest.fn().mockResolvedValue(total);
  const countDocuments = jest.fn().mockReturnValue({ exec: countExec });
  const model = {
    aggregate,
    countDocuments,
  } as unknown as Model<TournamentDocument>;
  return { model, aggregate, countDocuments, aggregateChain };
}

function makeService(rows: TournamentListAggregationRow[], total: number) {
  const { model, aggregate, countDocuments } = makeModel(rows, total);
  const service = new TournamentsService(
    model,
    new DrawService(),
    new MatchProgressionService(),
    {} as UtilsService,
  );
  return { service, aggregate, countDocuments };
}

function fakeRow(
  overrides: Partial<TournamentListAggregationRow> = {},
): TournamentListAggregationRow {
  return {
    _id: new Types.ObjectId(),
    name: 'Copa Test',
    format: TournamentFormat.SINGLE_ELIMINATION,
    status: TournamentStatus.EN_PROGRESO,
    state: TournamentState.KNOCKOUTS,
    createdAt: new Date('2026-07-20T00:00:00.000Z'),
    updatedAt: new Date('2026-07-21T00:00:00.000Z'),
    teamCount: 8,
    consoleCount: 3,
    ...overrides,
  };
}

describe('TournamentsService.findAllPaginatedForBackoffice', () => {
  it('returns the exact { data, total, page, pageSize } contract', async () => {
    const rows = [fakeRow(), fakeRow()];
    const { service } = makeService(rows, 42);

    const query = {
      page: 2,
      pageSize: 7,
      sortField: 'createdAt',
      sortDirection: SortDirection.DESC,
    } as PaginationQueryDto;
    const result = await service.findAllPaginatedForBackoffice(query);

    expect(result.total).toBe(42);
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(7);
    expect(result.data).toHaveLength(2);
  });

  it('maps id/teamCount/consoleCount and the rest of the fields correctly', async () => {
    const row = fakeRow({ teamCount: 16, consoleCount: 4 });
    const { service } = makeService([row], 1);

    const result = await service.findAllPaginatedForBackoffice({
      page: 1,
      pageSize: 20,
    } as PaginationQueryDto);

    expect(result.data[0]).toEqual({
      id: row._id.toString(),
      name: row.name,
      format: row.format,
      teamCount: 16,
      consoleCount: 4,
      status: row.status,
      state: row.state,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  });

  it('includes DELETED tournaments in both the aggregation data and the count', async () => {
    const deletedRow = fakeRow({ state: TournamentState.DELETED });
    const { service, aggregate, countDocuments } = makeService(
      [deletedRow],
      1,
    );

    const result = await service.findAllPaginatedForBackoffice({
      page: 1,
      pageSize: 20,
    } as PaginationQueryDto);

    expect(countDocuments).toHaveBeenCalledWith({});
    const pipeline = aggregate.mock.calls[0][0] as Array<
      Record<string, unknown>
    >;
    expect(pipeline[0]).toEqual({ $match: {} });

    expect(result.total).toBe(1);
    expect(result.data[0].state).toBe(TournamentState.DELETED);
  });

  it('defaults to createdAt desc and applies skip/limit for the requested page/pageSize (page 2, pageSize 7 -> skip 7, limit 7)', async () => {
    const { service, aggregate } = makeService([], 0);

    await service.findAllPaginatedForBackoffice({
      page: 2,
      pageSize: 7,
    } as PaginationQueryDto);

    const pipeline = aggregate.mock.calls[0][0] as Array<
      Record<string, unknown>
    >;
    expect(pipeline[2]).toEqual({ $sort: { createdAt: -1 } });
    expect(pipeline[3]).toEqual({ $skip: 7 });
    expect(pipeline[4]).toEqual({ $limit: 7 });
  });

  it('projects teamCount/consoleCount via $size instead of the raw arrays, and never the internal tournament structure', async () => {
    const { service, aggregate } = makeService([], 0);

    await service.findAllPaginatedForBackoffice({
      page: 1,
      pageSize: 20,
    } as PaginationQueryDto);

    const pipeline = aggregate.mock.calls[0][0] as Array<
      Record<string, unknown>
    >;
    const project = (pipeline[1] as { $project: Record<string, unknown> })
      .$project;
    expect(project.teamCount).toEqual({ $size: '$teams' });
    expect(project.consoleCount).toEqual({ $size: '$consoleUnits' });
    expect(project).not.toHaveProperty('teams');
    expect(project).not.toHaveProperty('consoleUnits');
    expect(project).not.toHaveProperty('leagueStage');
    expect(project).not.toHaveProperty('knockoutStage');
    expect(project).not.toHaveProperty('groupStage');
    expect(project).not.toHaveProperty('swissStage');
  });

  it('places $sort AFTER $project (so computed fields like teamCount/consoleCount exist) and $skip/$limit AFTER $sort', async () => {
    const { service, aggregate } = makeService([], 0);

    await service.findAllPaginatedForBackoffice({
      page: 1,
      pageSize: 20,
    } as PaginationQueryDto);

    const pipeline = aggregate.mock.calls[0][0] as Array<
      Record<string, unknown>
    >;
    expect(Object.keys(pipeline[0])[0]).toBe('$match');
    expect(Object.keys(pipeline[1])[0]).toBe('$project');
    expect(Object.keys(pipeline[2])[0]).toBe('$sort');
    expect(Object.keys(pipeline[3])[0]).toBe('$skip');
    expect(Object.keys(pipeline[4])[0]).toBe('$limit');
  });

  it('runs the aggregation and the count in parallel against the same filter', async () => {
    const { service, aggregate, countDocuments } = makeService([], 0);

    await service.findAllPaginatedForBackoffice({
      page: 1,
      pageSize: 20,
    } as PaginationQueryDto);

    expect(aggregate).toHaveBeenCalledTimes(1);
    expect(countDocuments).toHaveBeenCalledTimes(1);
  });

  describe('sorting', () => {
    const cases: Array<{
      sortField: string;
      dbField: string;
    }> = [
      { sortField: 'name', dbField: 'name' },
      { sortField: 'format', dbField: 'format' },
      { sortField: 'state', dbField: 'state' },
      { sortField: 'updatedAt', dbField: 'updatedAt' },
      { sortField: 'createdAt', dbField: 'createdAt' },
      { sortField: 'teamCount', dbField: 'teamCount' },
      { sortField: 'consoleCount', dbField: 'consoleCount' },
    ];

    it.each(cases)(
      'sorts by $sortField (asc) -> $sort: { $dbField: 1 }',
      async ({ sortField, dbField }) => {
        const { service, aggregate } = makeService([], 0);

        await service.findAllPaginatedForBackoffice({
          page: 1,
          pageSize: 20,
          sortField,
          sortDirection: SortDirection.ASC,
        } as PaginationQueryDto);

        const pipeline = aggregate.mock.calls[0][0] as Array<
          Record<string, unknown>
        >;
        expect(pipeline[2]).toEqual({ $sort: { [dbField]: 1 } });
      },
    );

    it.each(cases)(
      'sorts by $sortField (desc) -> $sort: { $dbField: -1 }',
      async ({ sortField, dbField }) => {
        const { service, aggregate } = makeService([], 0);

        await service.findAllPaginatedForBackoffice({
          page: 1,
          pageSize: 20,
          sortField,
          sortDirection: SortDirection.DESC,
        } as PaginationQueryDto);

        const pipeline = aggregate.mock.calls[0][0] as Array<
          Record<string, unknown>
        >;
        expect(pipeline[2]).toEqual({ $sort: { [dbField]: -1 } });
      },
    );

    it('falls back to createdAt desc when sortField is not in the whitelist', async () => {
      const { service, aggregate } = makeService([], 0);

      await service.findAllPaginatedForBackoffice({
        page: 1,
        pageSize: 20,
        sortField: 'inexistente',
      } as PaginationQueryDto);

      const pipeline = aggregate.mock.calls[0][0] as Array<
        Record<string, unknown>
      >;
      expect(pipeline[2]).toEqual({ $sort: { createdAt: -1 } });
    });

    it('falls back to createdAt desc when sortField is absent', async () => {
      const { service, aggregate } = makeService([], 0);

      await service.findAllPaginatedForBackoffice({
        page: 1,
        pageSize: 20,
      } as PaginationQueryDto);

      const pipeline = aggregate.mock.calls[0][0] as Array<
        Record<string, unknown>
      >;
      expect(pipeline[2]).toEqual({ $sort: { createdAt: -1 } });
    });

    it('sorts by the computed teamCount field descending (more teams first)', async () => {
      const { service, aggregate } = makeService([], 0);

      await service.findAllPaginatedForBackoffice({
        page: 1,
        pageSize: 20,
        sortField: 'teamCount',
        sortDirection: SortDirection.DESC,
      } as PaginationQueryDto);

      const pipeline = aggregate.mock.calls[0][0] as Array<
        Record<string, unknown>
      >;
      expect(pipeline[2]).toEqual({ $sort: { teamCount: -1 } });
      // $sort (computed field) must run after $project computes it.
      expect(Object.keys(pipeline[1])[0]).toBe('$project');
    });
  });
});
