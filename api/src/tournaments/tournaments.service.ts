import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { RecordMatchResultDto } from './dto/record-match-result.dto';
import {
  FORMATS_REQUIRING_ALL_TEAMS_ASSIGNED,
  GROUP_SIZE_OPTIONS_BY_TEAM_COUNT,
  LEAGUE_MAX_TEAMS,
  LEAGUE_MIN_TEAMS,
  PLAYERS_PER_TEAM,
  VALID_TEAM_COUNTS,
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
import { Tournament, TournamentDocument } from './schemas/tournament.schema';

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
  ) {}

  async create(
    ownerId: string,
    dto: CreateTournamentDto,
  ): Promise<TournamentDocument> {
    this.validateTeamCountAndGroupSize(dto);
    this.validateThirdPlaceMatch(dto);

    const perTeam = PLAYERS_PER_TEAM[dto.matchMode];
    this.validatePlayersLength(dto, perTeam);
    const playersByTeamIndex = this.validateAssignments(dto, perTeam);

    const teamInputs: DrawTeamInput[] = dto.teams.map((name, index) => ({
      name,
      playerNames: playersByTeamIndex.get(index) ?? [],
    }));

    const drawResult = this.drawService.generate(teamInputs, {
      format: dto.format,
      twoLegged: dto.twoLegged,
      thirdPlaceMatch: dto.thirdPlaceMatch,
      groupSize: dto.groupSize,
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
   * GET /tournaments — lightweight listing of every tournament owned by the
   * authenticated user, for a dashboard/cards screen. Only projects the
   * fields `serializeTournamentSummary` needs (no fixtures/matches/
   * standings), sorted by most recently created first — matches the
   * `{ ownerId: 1, createdAt: -1 }` index on the schema.
   */
  async findAllForOwner(ownerId: string): Promise<SerializedTournamentSummary[]> {
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

  // --- Validation helpers (cross-field rules, hence not in the DTO) ------

  private validateTeamCountAndGroupSize(dto: CreateTournamentDto): void {
    const { format, teamCount, groupSize } = dto;

    if (format === TournamentFormat.LEAGUE) {
      if (
        !Number.isInteger(teamCount) ||
        teamCount < LEAGUE_MIN_TEAMS ||
        teamCount > LEAGUE_MAX_TEAMS
      ) {
        throw new BadRequestException(
          `teamCount must be an integer between ${LEAGUE_MIN_TEAMS} and ${LEAGUE_MAX_TEAMS} for LEAGUE`,
        );
      }
    } else {
      const validCounts = VALID_TEAM_COUNTS[format];
      if (validCounts && !validCounts.includes(teamCount)) {
        throw new BadRequestException(
          `teamCount must be one of [${validCounts.join(', ')}] for ${format}`,
        );
      }
    }

    if (format === TournamentFormat.GROUP_STAGE_PLUS_ELIMINATION) {
      if (groupSize === undefined) {
        throw new BadRequestException(
          'groupSize is required for GROUP_STAGE_PLUS_ELIMINATION',
        );
      }
      const validGroupSizes = GROUP_SIZE_OPTIONS_BY_TEAM_COUNT[teamCount];
      if (!validGroupSizes || !validGroupSizes.includes(groupSize)) {
        throw new BadRequestException(
          `groupSize=${groupSize} is not valid for teamCount=${teamCount}` +
            (validGroupSizes
              ? ` (valid options: [${validGroupSizes.join(', ')}])`
              : ''),
        );
      }
    } else if (groupSize !== undefined) {
      throw new BadRequestException(
        `groupSize is only allowed for GROUP_STAGE_PLUS_ELIMINATION, not ${format}`,
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
