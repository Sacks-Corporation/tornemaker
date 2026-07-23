import { Types } from 'mongoose';
import { TournamentFormat } from './schemas/common/tournament-format.enum';
import { TournamentState } from './schemas/common/tournament-state.enum';
import { TournamentStatus } from './schemas/tournament.schema';

/**
 * Row shape returned by `GET /tournaments/backoffice` (paginated admin
 * listing across EVERY user, see `TournamentsService.findAllPaginatedForBackoffice`)
 * — deliberately its OWN type, not `SerializedTournamentSummary`
 * (owner-scoped dashboard shape, see `progression/serialize.ts`): different
 * consumer, different fields. Never includes the tournament's internal
 * structure (teams/matches/standings/bracket) — only lightweight counts.
 */
export interface TournamentListItem {
  id: string;
  name: string;
  format: TournamentFormat;
  /** `teams.length` — computed in the aggregation pipeline via `$size`, the
   *  full `teams` array is never fetched. */
  teamCount: number;
  /** `consoleUnits.length` — physical console units (duplicates allowed),
   *  NOT `allowedConsoles` (deduplicated types). Computed via `$size`. */
  consoleCount: number;
  status: TournamentStatus;
  state: TournamentState;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Shape of each row as it comes back from the `$project` stage of the
 * aggregation pipeline in `findAllPaginatedForBackoffice` — plain object
 * (not a Mongoose document, aggregation results never are), `_id` still an
 * `ObjectId` until `toTournamentListItem` stringifies it.
 */
export interface TournamentListAggregationRow {
  _id: Types.ObjectId;
  name: string;
  format: TournamentFormat;
  status: TournamentStatus;
  state: TournamentState;
  createdAt: Date;
  updatedAt: Date;
  teamCount: number;
  consoleCount: number;
}

/** Maps an aggregation row to the public `TournamentListItem` shape. */
export function toTournamentListItem(
  row: TournamentListAggregationRow,
): TournamentListItem {
  return {
    id: row._id.toString(),
    name: row.name,
    format: row.format,
    teamCount: row.teamCount,
    consoleCount: row.consoleCount,
    status: row.status,
    state: row.state,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
