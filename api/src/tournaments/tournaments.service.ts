import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  buildPaginatedResult,
  getPaginationSkip,
  PaginatedResult,
  PaginationQueryDto,
  resolveSortStage,
  SortDefault,
  SortDirection,
  SortWhitelist,
} from '../common/pagination';
import { UtilsService } from '../utils/utils.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { RecordMatchResultDto } from './dto/record-match-result.dto';
import {
  computeEliminationAiFillTeamCount,
  computeGroupDistribution,
  computeGroupStageAiFillTeamCount,
  FORMATS_REQUIRING_ALL_TEAMS_ASSIGNED,
  GROUP_CAP_MIN,
  SWISS_TEAM_COUNTS,
  TEAM_RANGE_BY_FORMAT,
} from './dto/format-rules';
import { DrawService } from './draw/draw.service';
import { DrawTeamInput } from './draw/types';
import { MatchProgressionService } from './progression/match-progression.service';
import {
  computePlayableMatches,
  PlayableMatchItem,
} from './progression/playable-matches.util';
import {
  serializeTournament,
  serializeTournamentSummary,
  SerializedTournament,
  SerializedTournamentSummary,
} from './progression/serialize';
import { TournamentFormat } from './schemas/common/tournament-format.enum';
import { TournamentState } from './schemas/common/tournament-state.enum';
import {
  Tournament,
  TournamentDocument,
  TournamentStatus,
} from './schemas/tournament.schema';
import {
  toTournamentListItem,
  TournamentListAggregationRow,
  TournamentListItem,
} from './tournament-list-item';

/**
 * Whitelist for `GET /tournaments/backoffice`'s `sortField` query param
 * (fieldApi -> fieldDb, see `resolveSortStage`). `teamCount`/`consoleCount`
 * are COMPUTED via `$size` in the `$project` stage of the aggregation, not
 * stored fields — sorting by them requires the `$sort` stage to run AFTER
 * `$project` (see `findAllPaginatedForBackoffice`), which is why the same
 * name works here even though it isn't a raw document field.
 */
const TOURNAMENTS_BACKOFFICE_SORT_WHITELIST: SortWhitelist = {
  name: 'name',
  format: 'format',
  state: 'state',
  updatedAt: 'updatedAt',
  createdAt: 'createdAt',
  teamCount: 'teamCount',
  consoleCount: 'consoleCount',
};

/** Default order for `GET /tournaments/backoffice` when `sortField` is
 *  absent/invalid. */
const TOURNAMENTS_BACKOFFICE_SORT_DEFAULT: SortDefault = {
  field: 'createdAt',
  direction: SortDirection.DESC,
};

/** Initial `Tournament.state` derived from `format` — see tournament-state.enum.ts. */
const INITIAL_STATE_BY_FORMAT: Record<TournamentFormat, TournamentState> = {
  [TournamentFormat.LEAGUE]: TournamentState.LEAGUE,
  [TournamentFormat.GROUP_STAGE_PLUS_ELIMINATION]: TournamentState.GROUPS,
  [TournamentFormat.SWISS_PLUS_ELIMINATION]: TournamentState.SWISS,
  [TournamentFormat.SINGLE_ELIMINATION]: TournamentState.KNOCKOUTS,
};

@Injectable()
export class TournamentsService {
  constructor(
    @InjectModel(Tournament.name)
    private readonly tournamentModel: Model<TournamentDocument>,
    private readonly drawService: DrawService,
    private readonly progressionService: MatchProgressionService,
    private readonly utilsService: UtilsService,
  ) {}

  async create(
    ownerId: string,
    dto: CreateTournamentDto,
  ): Promise<TournamentDocument> {
    this.validateTeamCount(dto);
    this.validateGroupCap(dto);
    this.validateAiFill(dto);
    this.validateThirdPlaceMatch(dto);

    const perTeam = await this.validateConsolesAndMatchMode(dto);
    this.validatePlayersLength(dto, perTeam);
    const playersByTeamIndex = this.validateAssignments(dto, perTeam);

    const teamInputs: DrawTeamInput[] = dto.teams.map((name, index) => ({
      name,
      playerNames: playersByTeamIndex.get(index) ?? [],
    }));

    const aiFill = dto.aiFill ?? false;
    const totalTeamCount = this.computeTotalTeamCountForDraw(dto, aiFill);
    for (let i = dto.teamCount + 1; i <= totalTeamCount; i++) {
      teamInputs.push({
        name: `Equipo IA ${i - dto.teamCount}`,
        playerNames: [],
      });
    }

    if (dto.format === TournamentFormat.GROUP_STAGE_PLUS_ELIMINATION) {
      const distribution = computeGroupDistribution(
        totalTeamCount,
        dto.groupCap as number,
      );
      if (!distribution.valid) {
        throw new BadRequestException(distribution.reason);
      }
    }

    const drawResult = this.drawService.generate(teamInputs, {
      format: dto.format,
      twoLegged: dto.twoLegged,
      thirdPlaceMatch: dto.thirdPlaceMatch,
      groupCap: dto.groupCap,
    });

    const allowedConsoles = Array.from(new Set(dto.consoles));

    const created = new this.tournamentModel({
      ownerId: new Types.ObjectId(ownerId),
      name: dto.name,
      format: dto.format,
      state: INITIAL_STATE_BY_FORMAT[dto.format],
      matchMode: dto.matchMode,
      consoleUnits: dto.consoles,
      allowedConsoles,
      aiFill,
      teams: drawResult.teams,
      leagueStage: drawResult.leagueStage,
      knockoutStage: drawResult.knockoutStage,
      groupStage: drawResult.groupStage,
      swissStage: drawResult.swissStage,
      thirdPlaceMatch: drawResult.standaloneThirdPlaceMatch,
    });

    return created.save();
  }

  /**
   * Resolves the ACTUAL team count fed into the draw, applying `aiFill`
   * (see `CreateTournamentDto.aiFill` doc) on top of the organizer-submitted
   * `dto.teamCount`. Only SINGLE_ELIMINATION and GROUP_STAGE_PLUS_ELIMINATION
   * support `aiFill` (enforced by `validateAiFill`), so every other format
   * simply returns `dto.teamCount` unchanged.
   */
  private computeTotalTeamCountForDraw(
    dto: CreateTournamentDto,
    aiFill: boolean,
  ): number {
    if (!aiFill) {
      return dto.teamCount;
    }
    switch (dto.format) {
      case TournamentFormat.SINGLE_ELIMINATION:
        return computeEliminationAiFillTeamCount(dto.teamCount);
      case TournamentFormat.GROUP_STAGE_PLUS_ELIMINATION:
        return computeGroupStageAiFillTeamCount(
          dto.teamCount,
          dto.groupCap as number,
        );
      default:
        return dto.teamCount;
    }
  }

  /**
   * GET /tournaments — lightweight listing of every tournament owned by the
   * authenticated user, for a dashboard/cards screen. Only projects the
   * fields `serializeTournamentSummary` needs (no fixtures/matches/
   * standings), sorted by most recently created first — matches the
   * `{ ownerId: 1, createdAt: -1 }` index on the schema.
   */
  async findAllForOwner(
    ownerId: string,
  ): Promise<SerializedTournamentSummary[]> {
    const tournaments = await this.tournamentModel
      .find({
        ownerId: new Types.ObjectId(ownerId),
        state: { $ne: TournamentState.DELETED },
      })
      .select('name format status teams createdAt updatedAt')
      .sort({ createdAt: -1 })
      .exec();
    return tournaments.map(serializeTournamentSummary);
  }

  /**
   * GET /tournaments/backoffice — paginated listing of EVERY tournament
   * across ALL users (not scoped to an owner), for the backoffice admin
   * screen — see `.claude/skills/paginated-endpoint/SKILL.md` for the shared
   * `{ data, total, page, pageSize }` contract. Restricted to admins at the
   * controller level (`JwtAuthGuard` + `AdminGuard`), same pattern as
   * `GET /users`.
   *
   * Unlike every other listing/lookup in this service, soft-deleted
   * tournaments (`state = DELETED`) are INCLUDED here on purpose: the
   * backoffice needs full visibility over every tournament ever created,
   * deleted or not. Sorted by most recently created first.
   *
   * Uses an aggregation pipeline instead of `find()` because the Tournament
   * document embeds potentially large arrays (teams, matches, standings,
   * bracket) that must never be fetched just to list/count tournaments: the
   * `$project` stage only ever materializes the lightweight fields
   * `TournamentListItem` needs, computing `teamCount`/`consoleCount` via
   * `$size` instead of returning the `teams`/`consoleUnits` arrays
   * themselves. The data aggregation and the `countDocuments` (same filter)
   * run in parallel.
   *
   * `sortField`/`sortDirection` are resolved against
   * `TOURNAMENTS_BACKOFFICE_SORT_WHITELIST` via `resolveSortStage` (falls
   * back to `TOURNAMENTS_BACKOFFICE_SORT_DEFAULT` when absent/invalid) —
   * see `.claude/skills/paginated-endpoint/SKILL.md`. The `$sort` stage is
   * placed AFTER `$project` (not before) on purpose: `teamCount`/
   * `consoleCount` only exist once `$project` computes them via `$size`, so
   * sorting on those two fields would be impossible if `$sort` ran first.
   * `$skip`/`$limit` stay AFTER `$sort`, same as before.
   */
  async findAllPaginatedForBackoffice(
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<TournamentListItem>> {
    const { page, pageSize, sortField, sortDirection } = query;
    const sortStage = resolveSortStage(
      sortField,
      sortDirection,
      TOURNAMENTS_BACKOFFICE_SORT_WHITELIST,
      TOURNAMENTS_BACKOFFICE_SORT_DEFAULT,
    );

    const [rows, total] = await Promise.all([
      this.tournamentModel
        .aggregate<TournamentListAggregationRow>([
          { $match: {} },
          {
            $project: {
              name: 1,
              format: 1,
              status: 1,
              state: 1,
              createdAt: 1,
              updatedAt: 1,
              teamCount: { $size: '$teams' },
              consoleCount: { $size: '$consoleUnits' },
            },
          },
          { $sort: sortStage },
          { $skip: getPaginationSkip(page, pageSize) },
          { $limit: pageSize },
        ])
        .exec(),
      this.tournamentModel.countDocuments({}).exec(),
    ]);

    const data = rows.map(toTournamentListItem);
    return buildPaginatedResult(data, total, page, pageSize);
  }

  /**
   * GET /tournaments/:id — returns the tournament exactly as persisted
   * (already fully computed/ranked by the progression engine on every
   * PATCH), scoped to its owner.
   */
  async findOneForOwner(
    ownerId: string,
    id: string,
  ): Promise<SerializedTournament> {
    const tournament = await this.findOwnedTournamentOrThrow(ownerId, id);
    return serializeTournament(tournament);
  }

  /**
   * GET /tournaments/:id/matches — the lightweight "what can be played
   * right now" view (see progression/playable-matches.util.ts). Persists
   * any newly-assigned console before returning, so repeating the request
   * is idempotent.
   */
  async getPlayableMatches(
    ownerId: string,
    id: string,
  ): Promise<PlayableMatchItem[]> {
    const tournament = await this.findOwnedTournamentOrThrow(ownerId, id);
    const { items, hasNewAssignments } = computePlayableMatches(tournament);
    if (hasNewAssignments) {
      await tournament.save();
    }
    return items;
  }

  /**
   * DELETE /tournaments/:id — soft delete. The document is NEVER removed
   * from MongoDB (so it can still be used for future statistics): this just
   * moves `state` to the terminal `TournamentState.DELETED` and stamps
   * `deletedAt`. Reuses `findOwnedTournamentOrThrow`, which already excludes
   * `DELETED` tournaments, so deleting an already-deleted (or foreign/
   * nonexistent) tournament also 404s — from the caller's point of view it
   * simply no longer exists.
   */
  async softDeleteForOwner(ownerId: string, id: string): Promise<void> {
    const tournament = await this.findOwnedTournamentOrThrow(ownerId, id);
    tournament.state = TournamentState.DELETED;
    tournament.deletedAt = new Date();
    await tournament.save();
  }

  /**
   * PATCH /tournaments/match/:matchId — records a single leg's result and
   * runs the progression engine (standings, tiebreaks, bracket advancement,
   * Swiss pairing, stage transitions — see MatchProgressionService),
   * scoped to the owner via the same $or-over-every-embedded-path query
   * used for the lookup.
   */
  async recordMatchResult(
    ownerId: string,
    matchId: string,
    dto: RecordMatchResultDto,
  ): Promise<SerializedTournament> {
    const tournament = await this.findOwnedTournamentContainingMatch(
      ownerId,
      matchId,
    );
    this.progressionService.recordResult(tournament, matchId, dto);
    await tournament.save();
    return serializeTournament(tournament);
  }

  /**
   * POST /tournaments/:id/reset — puts the tournament back exactly in the
   * state it was in right after `create()`: every played match/result is
   * discarded and a brand-new fixture/draw is generated (fresh `teamId`s,
   * a new random seed order, standings back to zero, no bracket yet for the
   * formats that only build one later) via the SAME `DrawService.generate`
   * path `create()` uses — never reimplemented here. Only the "playable"
   * part is touched; metadata (`name`, `ownerId`, `format`, `matchMode`,
   * consoles, `createdAt`) is left untouched. The team names/players and the
   * draw options (two-legged, third-place match, group size) are read back
   * from whatever is currently persisted, so a reset after progression
   * (e.g. once the standalone `thirdPlaceMatch` slot has already been
   * consumed into the bracket, see MatchProgressionService) still derives
   * the original configuration correctly.
   *
   * A new random draw is not guaranteed to reproduce the original pairings
   * — only "as if freshly created", not "identical to the original draw".
   * Resetting a `FINISHED` tournament is explicitly allowed (that's the
   * whole point); `DELETED`/foreign/nonexistent tournaments 404 via
   * `findOwnedTournamentOrThrow`. Response is the full updated tournament,
   * same shape as `GET /tournaments/:id`.
   */
  async resetForOwner(
    ownerId: string,
    id: string,
  ): Promise<SerializedTournament> {
    const tournament = await this.findOwnedTournamentOrThrow(ownerId, id);

    const teamInputs: DrawTeamInput[] = tournament.teams.map((team) => ({
      name: team.name,
      playerNames: team.playerNames,
    }));

    const drawResult = this.drawService.generate(teamInputs, {
      format: tournament.format,
      twoLegged: this.resolveTwoLegged(tournament),
      thirdPlaceMatch: this.resolveThirdPlaceMatch(tournament),
      groupCap: tournament.groupStage?.groupCap,
    });

    tournament.state = INITIAL_STATE_BY_FORMAT[tournament.format];
    tournament.status = TournamentStatus.EN_PROGRESO;
    tournament.teams = drawResult.teams;
    tournament.leagueStage = drawResult.leagueStage;
    tournament.knockoutStage = drawResult.knockoutStage;
    tournament.groupStage = drawResult.groupStage;
    tournament.swissStage = drawResult.swissStage;
    tournament.thirdPlaceMatch = drawResult.standaloneThirdPlaceMatch;
    tournament.startedAt = undefined;
    tournament.finishedAt = undefined;

    await tournament.save();
    return serializeTournament(tournament);
  }

  // --- Lookup helpers ------------------------------------------------

  /**
   * Looks up a tournament by id, scoped to its owner. Soft-deleted
   * tournaments (`state = DELETED`) are treated as not found, so this is
   * also what backs `DELETE /tournaments/:id` itself: deleting an
   * already-deleted tournament 404s just like any other read.
   */
  private async findOwnedTournamentOrThrow(
    ownerId: string,
    id: string,
  ): Promise<TournamentDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Tournament ${id} not found`);
    }
    const tournament = await this.tournamentModel.findOne({
      _id: id,
      ownerId: new Types.ObjectId(ownerId),
      state: { $ne: TournamentState.DELETED },
    });
    if (!tournament) {
      throw new NotFoundException(`Tournament ${id} not found`);
    }
    return tournament;
  }

  private async findOwnedTournamentContainingMatch(
    ownerId: string,
    matchId: string,
  ): Promise<TournamentDocument> {
    const tournament = await this.tournamentModel.findOne({
      ownerId: new Types.ObjectId(ownerId),
      state: { $ne: TournamentState.DELETED },
      $or: [
        { 'leagueStage.matchdays.matches.matchId': matchId },
        { 'leagueStage.tiebreakMatches.matchId': matchId },
        { 'groupStage.groups.matches.matchId': matchId },
        { 'groupStage.groups.tiebreakMatches.matchId': matchId },
        { 'swissStage.rounds.matches.matchId': matchId },
        { 'swissStage.playIn.matchId': matchId },
        { 'knockoutStage.bracket.rounds.matches.matchId': matchId },
        { 'knockoutStage.bracket.thirdPlaceMatch.matchId': matchId },
        { 'thirdPlaceMatch.matchId': matchId },
      ],
    });
    if (!tournament) {
      throw new NotFoundException(
        `Match ${matchId} was not found in any of your tournaments`,
      );
    }
    return tournament;
  }

  // --- reset() helpers ---------------------------------------------------

  /**
   * Recovers the `twoLegged` draw option originally submitted at creation
   * time. There is no single dedicated field for it: each format persists
   * it on whichever stage carries its own fixtures (see the per-format
   * schema docs), so it survives a reset regardless of how far the
   * tournament has progressed.
   */
  private resolveTwoLegged(tournament: TournamentDocument): boolean {
    switch (tournament.format) {
      case TournamentFormat.LEAGUE:
        return tournament.leagueStage?.doubleRound ?? false;
      case TournamentFormat.SINGLE_ELIMINATION:
        return tournament.knockoutStage?.bracket.isTwoLegged ?? false;
      case TournamentFormat.GROUP_STAGE_PLUS_ELIMINATION:
        return tournament.groupStage?.doubleRound ?? false;
      case TournamentFormat.SWISS_PLUS_ELIMINATION:
        return tournament.swissStage?.knockoutTwoLegged ?? false;
      default: {
        const exhaustiveCheck: never = tournament.format;
        throw new Error(
          `Unsupported tournament format: ${String(exhaustiveCheck)}`,
        );
      }
    }
  }

  /**
   * Recovers the `thirdPlaceMatch` draw option. For GROUP_STAGE_PLUS_
   * ELIMINATION / SWISS_PLUS_ELIMINATION it starts out on the standalone
   * `Tournament.thirdPlaceMatch` placeholder but is consumed and cleared
   * once the knockout bracket is built from the group/Swiss qualifiers (see
   * MatchProgressionService.finishGroupStage/finishSwissStage), moving the
   * signal onto `knockoutStage.bracket.hasThirdPlaceMatch` instead — so
   * either location is checked here. LEAGUE never has one.
   */
  private resolveThirdPlaceMatch(tournament: TournamentDocument): boolean {
    if (tournament.format === TournamentFormat.LEAGUE) {
      return false;
    }
    return (
      Boolean(tournament.thirdPlaceMatch) ||
      Boolean(tournament.knockoutStage?.bracket.hasThirdPlaceMatch)
    );
  }

  // --- Validation helpers (cross-field rules, hence not in the DTO) ------

  /**
   * Validates `dto.consoles` and `dto.matchMode` against the Mongo-backed
   * catalogs (see UtilsService — the single source of truth for both,
   * replacing the former `GameConsole`/`MatchMode` enums). Fetches the
   * active console codes ONCE (not once per element of `dto.consoles`) and
   * looks up `dto.matchMode` in a single query, returning its
   * `playersPerTeam` for the caller to use in the rest of the cross-field
   * validation (players length, assignments).
   */
  private async validateConsolesAndMatchMode(
    dto: CreateTournamentDto,
  ): Promise<number> {
    const activeConsoleCodes = await this.utilsService.getActiveConsoleCodes();
    const invalidConsoles = dto.consoles.filter(
      (code) => !activeConsoleCodes.has(code),
    );
    if (invalidConsoles.length > 0) {
      throw new BadRequestException(
        `consoles contains invalid/inactive code(s): [${Array.from(new Set(invalidConsoles)).join(', ')}]`,
      );
    }

    const matchMode = await this.utilsService.findActiveMatchMode(
      dto.matchMode,
    );
    if (!matchMode) {
      throw new BadRequestException(
        `matchMode=${dto.matchMode} is not a valid/active match mode`,
      );
    }

    return matchMode.playersPerTeam;
  }

  /**
   * Validates `dto.teamCount` against the RANGE (SINGLE_ELIMINATION,
   * GROUP_STAGE_PLUS_ELIMINATION, LEAGUE) or closed set (SWISS_PLUS_ELIMINATION)
   * that applies to `dto.format` — see `dto/format-rules.ts`. Note this
   * always checks the REAL, organizer-submitted `teamCount` (`teams.length`)
   * — `aiFill` padding is resolved and validated separately, AFTER this
   * passes (see `computeTotalTeamCountForDraw` / the GROUP_STAGE distribution
   * check in `create()`), so a small real `teamCount` can never bypass this
   * range just because `aiFill` would later round it up.
   */
  private validateTeamCount(dto: CreateTournamentDto): void {
    const { format, teamCount } = dto;

    if (format === TournamentFormat.SWISS_PLUS_ELIMINATION) {
      if (!SWISS_TEAM_COUNTS.includes(teamCount)) {
        throw new BadRequestException(
          `teamCount must be one of [${SWISS_TEAM_COUNTS.join(', ')}] for ${format}`,
        );
      }
      return;
    }

    const range = TEAM_RANGE_BY_FORMAT[format];
    if (
      range &&
      (!Number.isInteger(teamCount) ||
        teamCount < range.min ||
        teamCount > range.max)
    ) {
      throw new BadRequestException(
        `teamCount must be an integer between ${range.min} and ${range.max} for ${format}`,
      );
    }
  }

  /**
   * Validates `dto.groupCap`: required (and >= `GROUP_CAP_MIN`, already
   * enforced by the DTO's `@Min(3)`) only for GROUP_STAGE_PLUS_ELIMINATION,
   * forbidden otherwise. Does NOT validate the teamCount/groupCap
   * COMBINATION here — that depends on the post-`aiFill` total team count,
   * so it's checked in `create()` via `computeGroupDistribution` once that
   * total is known.
   */
  private validateGroupCap(dto: CreateTournamentDto): void {
    const { format, groupCap } = dto;

    if (format === TournamentFormat.GROUP_STAGE_PLUS_ELIMINATION) {
      if (groupCap === undefined) {
        throw new BadRequestException(
          'groupCap is required for GROUP_STAGE_PLUS_ELIMINATION',
        );
      }
      if (groupCap < GROUP_CAP_MIN) {
        throw new BadRequestException(
          `groupCap must be an integer >= ${GROUP_CAP_MIN}`,
        );
      }
    } else if (groupCap !== undefined) {
      throw new BadRequestException(
        `groupCap is only allowed for GROUP_STAGE_PLUS_ELIMINATION, not ${format}`,
      );
    }
  }

  /**
   * `aiFill` is only meaningful for the formats that allow CPU/AI teams
   * (`allowsAi` on `GET /utils/tournament-formats`) — SINGLE_ELIMINATION and
   * GROUP_STAGE_PLUS_ELIMINATION. Rejected outright (not just ignored) for
   * LEAGUE/SWISS_PLUS_ELIMINATION, which require every team to be assigned
   * to a real player (see `FORMATS_REQUIRING_ALL_TEAMS_ASSIGNED`).
   */
  private validateAiFill(dto: CreateTournamentDto): void {
    if (
      dto.aiFill &&
      FORMATS_REQUIRING_ALL_TEAMS_ASSIGNED.includes(dto.format)
    ) {
      throw new BadRequestException(
        `aiFill is not allowed for ${dto.format}: every team must be assigned to a real player`,
      );
    }
  }

  private validateThirdPlaceMatch(dto: CreateTournamentDto): void {
    if (dto.thirdPlaceMatch && dto.format === TournamentFormat.LEAGUE) {
      throw new BadRequestException(
        'thirdPlaceMatch is not applicable to LEAGUE',
      );
    }
  }

  private validatePlayersLength(
    dto: CreateTournamentDto,
    perTeam: number,
  ): void {
    if (dto.players.length % perTeam !== 0) {
      throw new BadRequestException(
        `players.length must be a multiple of ${perTeam} for matchMode=${dto.matchMode}`,
      );
    }
    if (dto.players.length > dto.teamCount * perTeam) {
      throw new BadRequestException(
        `players.length cannot exceed teamCount * ${perTeam}`,
      );
    }
    if (dto.teams.length !== dto.teamCount) {
      throw new BadRequestException('teams.length must equal teamCount');
    }
  }

  /** Validates `assignments` and returns a teamIndex -> playerNames map. */
  private validateAssignments(
    dto: CreateTournamentDto,
    perTeam: number,
  ): Map<number, string[]> {
    const { assignments, teamCount, players } = dto;

    const seenTeamIndexes = new Set<number>();
    const assignedPlayers = new Set<string>();
    const playersByTeamIndex = new Map<number, string[]>();
    const validPlayerNames = new Set(players);

    for (const assignment of assignments) {
      if (assignment.teamIndex < 0 || assignment.teamIndex >= teamCount) {
        throw new BadRequestException(
          `assignments.teamIndex=${assignment.teamIndex} is out of range [0, ${teamCount - 1}]`,
        );
      }
      if (seenTeamIndexes.has(assignment.teamIndex)) {
        throw new BadRequestException(
          `assignments.teamIndex=${assignment.teamIndex} is repeated`,
        );
      }
      seenTeamIndexes.add(assignment.teamIndex);

      if (assignment.players.length !== perTeam) {
        throw new BadRequestException(
          `each assignment must have exactly ${perTeam} players for matchMode=${dto.matchMode}`,
        );
      }

      for (const playerName of assignment.players) {
        if (!validPlayerNames.has(playerName)) {
          throw new BadRequestException(
            `assignment player "${playerName}" is not present in players`,
          );
        }
        if (assignedPlayers.has(playerName)) {
          throw new BadRequestException(
            `player "${playerName}" is assigned to more than one team`,
          );
        }
        assignedPlayers.add(playerName);
      }

      playersByTeamIndex.set(assignment.teamIndex, assignment.players);
    }

    if (assignedPlayers.size !== players.length) {
      throw new BadRequestException(
        'every player in players must be assigned to exactly one team',
      );
    }

    if (
      FORMATS_REQUIRING_ALL_TEAMS_ASSIGNED.includes(dto.format) &&
      assignments.length !== teamCount
    ) {
      throw new BadRequestException(
        `${dto.format} does not allow CPU/AI teams: every team must have an assignment`,
      );
    }

    return playersByTeamIndex;
  }
}
