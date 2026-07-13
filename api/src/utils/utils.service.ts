import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  FORMATS_REQUIRING_ALL_TEAMS_ASSIGNED,
  GROUP_SIZE_OPTIONS_BY_TEAM_COUNT,
  LEAGUE_MAX_TEAMS,
  LEAGUE_MIN_TEAMS,
  VALID_TEAM_COUNTS,
} from '../tournaments/dto/format-rules';
import { TournamentFormat } from '../tournaments/schemas/common/tournament-format.enum';
import {
  ConsoleCatalog,
  ConsoleCatalogDocument,
} from './schemas/console-catalog.schema';
import {
  MatchModeCatalog,
  MatchModeCatalogDocument,
} from './schemas/match-mode-catalog.schema';

/** Shape of a single item returned by `GET /utils/consoles`. */
export interface ConsoleCatalogItem {
  code: string;
  label: string;
  sortOrder: number;
  isDefault: boolean;
}

/** Shape of a single item returned by `GET /utils/match-modes`. */
export interface MatchModeCatalogItem {
  code: string;
  label: string;
  playersPerTeam: number;
  sortOrder: number;
}

/** Shape of a single item returned by `GET /utils/tournament-formats`. */
export interface TournamentFormatRule {
  format: TournamentFormat;
  teamCounts: number[];
  groupSizesByTeamCount?: Record<number, number[]>;
  allowsAi: boolean;
  allowsThirdPlace: boolean;
}

const SEED_CONSOLES: ReadonlyArray<
  Pick<ConsoleCatalog, 'code' | 'label' | 'sortOrder' | 'isDefault'>
> = [
  { code: 'PLAY_2', label: 'Play 2', sortOrder: 1, isDefault: false },
  { code: 'PLAY_3', label: 'Play 3', sortOrder: 2, isDefault: false },
  { code: 'PLAY_4', label: 'Play 4', sortOrder: 3, isDefault: true },
  { code: 'PLAY_5', label: 'Play 5', sortOrder: 4, isDefault: false },
];

const SEED_MATCH_MODES: ReadonlyArray<
  Pick<MatchModeCatalog, 'code' | 'label' | 'playersPerTeam' | 'sortOrder'>
> = [
  { code: '1v1', label: '1 vs 1', playersPerTeam: 1, sortOrder: 1 },
  { code: '2v2', label: '2 vs 2', playersPerTeam: 2, sortOrder: 2 },
  { code: '3v3', label: '3 vs 3', playersPerTeam: 3, sortOrder: 3 },
];

/**
 * UtilsModule's service — backs the read-only catalog endpoints consumed by
 * the frontend to render tournament-creation options, AND is the place
 * every other module goes through to validate that a console/match-mode
 * `code` submitted by a client actually belongs to the (now Mongo-backed)
 * catalog — these collections are the single source of truth, replacing the
 * old `GameConsole`/`MatchMode` enums.
 *
 * Seeds both catalogs once, idempotently, the first time the module starts
 * up with an empty collection — see `onModuleInit`.
 */
@Injectable()
export class UtilsService implements OnModuleInit {
  private readonly logger = new Logger(UtilsService.name);

  constructor(
    @InjectModel(ConsoleCatalog.name)
    private readonly consoleModel: Model<ConsoleCatalogDocument>,
    @InjectModel(MatchModeCatalog.name)
    private readonly matchModeModel: Model<MatchModeCatalogDocument>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedConsolesIfEmpty();
    await this.seedMatchModesIfEmpty();
  }

  private async seedConsolesIfEmpty(): Promise<void> {
    const count = await this.consoleModel.estimatedDocumentCount().exec();
    if (count > 0) {
      return;
    }
    await this.consoleModel.insertMany(
      SEED_CONSOLES.map((seed) => ({ ...seed, isActive: true })),
    );
    this.logger.log(`Seeded ${SEED_CONSOLES.length} console catalog entries`);
  }

  private async seedMatchModesIfEmpty(): Promise<void> {
    const count = await this.matchModeModel.estimatedDocumentCount().exec();
    if (count > 0) {
      return;
    }
    await this.matchModeModel.insertMany(
      SEED_MATCH_MODES.map((seed) => ({ ...seed, isActive: true })),
    );
    this.logger.log(
      `Seeded ${SEED_MATCH_MODES.length} match mode catalog entries`,
    );
  }

  // --- Read-only catalog endpoints --------------------------------------

  /** `GET /utils/consoles` — active consoles, ordered for display. */
  async getConsoles(): Promise<ConsoleCatalogItem[]> {
    const docs = await this.consoleModel
      .find({ isActive: true })
      .sort({ sortOrder: 1 })
      .exec();
    return docs.map((doc) => ({
      code: doc.code,
      label: doc.label,
      sortOrder: doc.sortOrder,
      isDefault: doc.isDefault,
    }));
  }

  /** `GET /utils/match-modes` — active match modes, ordered for display. */
  async getMatchModes(): Promise<MatchModeCatalogItem[]> {
    const docs = await this.matchModeModel
      .find({ isActive: true })
      .sort({ sortOrder: 1 })
      .exec();
    return docs.map((doc) => ({
      code: doc.code,
      label: doc.label,
      playersPerTeam: doc.playersPerTeam,
      sortOrder: doc.sortOrder,
    }));
  }

  /**
   * `GET /utils/tournament-formats` — NOT backed by Mongo: the closed
   * team-count / group-size rules are coupled to the draw engine and only
   * change with a deploy (see dto/format-rules.ts, the single source of
   * truth this transforms rather than duplicates).
   */
  getTournamentFormats(format?: TournamentFormat): TournamentFormatRule[] {
    const formats = format ? [format] : Object.values(TournamentFormat);
    return formats.map((f) => this.buildTournamentFormatRule(f));
  }

  private buildTournamentFormatRule(
    format: TournamentFormat,
  ): TournamentFormatRule {
    return {
      format,
      teamCounts: this.teamCountsFor(format),
      groupSizesByTeamCount: this.groupSizesByTeamCountFor(format),
      allowsAi: !FORMATS_REQUIRING_ALL_TEAMS_ASSIGNED.includes(format),
      allowsThirdPlace: format !== TournamentFormat.LEAGUE,
    };
  }

  private teamCountsFor(format: TournamentFormat): number[] {
    if (format === TournamentFormat.LEAGUE) {
      const counts: number[] = [];
      for (let n = LEAGUE_MIN_TEAMS; n <= LEAGUE_MAX_TEAMS; n++) {
        counts.push(n);
      }
      return counts;
    }
    return [...(VALID_TEAM_COUNTS[format] ?? [])];
  }

  private groupSizesByTeamCountFor(
    format: TournamentFormat,
  ): Record<number, number[]> | undefined {
    if (format !== TournamentFormat.GROUP_STAGE_PLUS_ELIMINATION) {
      return undefined;
    }
    const teamCounts = VALID_TEAM_COUNTS[format] ?? [];
    const byTeamCount: Record<number, number[]> = {};
    for (const teamCount of teamCounts) {
      const sizes = GROUP_SIZE_OPTIONS_BY_TEAM_COUNT[teamCount];
      if (sizes) {
        byTeamCount[teamCount] = [...sizes];
      }
    }
    return byTeamCount;
  }

  // --- Catalog-membership validation (used by TournamentsService) -------

  /**
   * Every currently-active console `code`, fetched in a single query so
   * callers validating a whole array of submitted codes (e.g.
   * `CreateTournamentDto.consoles`) never issue one query per element.
   */
  async getActiveConsoleCodes(): Promise<Set<string>> {
    const docs = await this.consoleModel
      .find({ isActive: true })
      .select('code')
      .exec();
    return new Set(docs.map((doc) => doc.code));
  }

  /**
   * Looks up a single active match mode by `code`, or `null` if it doesn't
   * exist / is inactive. Returns the full catalog entry (not just a
   * boolean) so callers get `playersPerTeam` from the very same query
   * instead of a second round-trip.
   */
  async findActiveMatchMode(
    code: string,
  ): Promise<MatchModeCatalogDocument | null> {
    return this.matchModeModel.findOne({ code, isActive: true }).exec();
  }
}
