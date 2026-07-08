import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { MatchStatus } from '../schemas/common/match-status.enum';
import { Match } from '../schemas/common/match.schema';
import { Team } from '../schemas/common/team.schema';
import { TournamentFormat } from '../schemas/common/tournament-format.enum';
import { GroupStage } from '../schemas/group-stage.schema';
import { KnockoutStage } from '../schemas/knockout-stage.schema';
import { LeagueStage } from '../schemas/league.schema';
import { SwissStage } from '../schemas/swiss-stage.schema';
import { buildGroupStage } from './group-fixtures';
import { buildKnockoutStage } from './knockout-fixtures';
import { buildLeagueStage } from './league-fixtures';
import { buildSwissStage } from './swiss-fixtures';
import { DrawTeamInput, SeededTeam } from './types';

export interface DrawOptions {
  format: TournamentFormat;
  twoLegged: boolean;
  thirdPlaceMatch: boolean;
  /** Required (and pre-validated) only for GROUP_STAGE_PLUS_ELIMINATION. */
  groupSize?: number;
}

export interface DrawResult {
  teams: Team[];
  leagueStage?: LeagueStage;
  knockoutStage?: KnockoutStage;
  groupStage?: GroupStage;
  swissStage?: SwissStage;
  /**
   * Placeholder 3rd-place Match to persist on `Tournament.thirdPlaceMatch`
   * when the format doesn't have its own knockout Bracket yet at creation
   * time (GROUP_STAGE_PLUS_ELIMINATION, SWISS_PLUS_ELIMINATION). Per the
   * doc comment on `Tournament.thirdPlaceMatch`, this is the intended
   * fallback slot for exactly this situation; the future bracket-building
   * step (once qualifiers are known, out of scope here) should consume it
   * to populate `Bracket.hasThirdPlaceMatch`/`Bracket.thirdPlaceMatch` and
   * clear this field.
   */
  standaloneThirdPlaceMatch?: Match;
}

/**
 * Orchestrates the random draw/fixture generation that happens inside
 * `POST /tournaments`: shuffles+seeds the submitted teams, then delegates to
 * the format-specific fixture builder.
 */
@Injectable()
export class DrawService {
  generate(teamInputs: DrawTeamInput[], options: DrawOptions): DrawResult {
    const seededTeams = this.shuffleAndSeed(teamInputs);
    const teams: Team[] = seededTeams.map((t) => ({
      teamId: t.teamId,
      name: t.name,
      playerNames: t.playerNames,
      seed: t.seed,
    }));

    switch (options.format) {
      case TournamentFormat.LEAGUE:
        return {
          teams,
          leagueStage: buildLeagueStage(seededTeams, options.twoLegged),
        };

      case TournamentFormat.SINGLE_ELIMINATION:
        return {
          teams,
          knockoutStage: buildKnockoutStage(
            seededTeams,
            options.twoLegged,
            options.thirdPlaceMatch,
          ),
        };

      case TournamentFormat.GROUP_STAGE_PLUS_ELIMINATION:
        return {
          teams,
          groupStage: buildGroupStage(
            seededTeams,
            options.groupSize as number,
            options.twoLegged,
          ),
          standaloneThirdPlaceMatch: options.thirdPlaceMatch
            ? this.buildThirdPlacePlaceholder('GROUP-3RD')
            : undefined,
        };

      case TournamentFormat.SWISS_PLUS_ELIMINATION:
        return {
          teams,
          swissStage: buildSwissStage(seededTeams),
          standaloneThirdPlaceMatch: options.thirdPlaceMatch
            ? this.buildThirdPlacePlaceholder('SWISS-3RD')
            : undefined,
        };

      default: {
        const exhaustiveCheck: never = options.format;
        throw new Error(
          `Unsupported tournament format: ${String(exhaustiveCheck)}`,
        );
      }
    }
  }

  /** Fisher-Yates shuffle, then assigns a 1-based `seed` and a stable `teamId`. */
  private shuffleAndSeed(teamInputs: DrawTeamInput[]): SeededTeam[] {
    const shuffled = [...teamInputs];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.map((input, index) => {
      const teamId = new Types.ObjectId();
      return {
        teamId,
        hexId: teamId.toHexString(),
        name: input.name,
        playerNames: input.playerNames,
        seed: index + 1,
      };
    });
  }

  private buildThirdPlacePlaceholder(prefix: string): Match {
    return {
      matchId: `${prefix}-M1`,
      isTwoLegged: false,
      legs: [],
      status: MatchStatus.SCHEDULED,
      isDraw: false,
    };
  }
}
