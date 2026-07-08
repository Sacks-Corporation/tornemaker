import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateTournamentDto } from './dto/create-tournament.dto';
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
import { TournamentFormat } from './schemas/common/tournament-format.enum';
import { Tournament, TournamentDocument } from './schemas/tournament.schema';

@Injectable()
export class TournamentsService {
  constructor(
    @InjectModel(Tournament.name)
    private readonly tournamentModel: Model<TournamentDocument>,
    private readonly drawService: DrawService,
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
