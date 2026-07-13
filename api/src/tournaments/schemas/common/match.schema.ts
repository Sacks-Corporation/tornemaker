import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { GameConsole } from './console.enum';
import { MatchResult, MatchResultSchema } from './match-result.schema';
import { MatchStatus } from './match-status.enum';

/**
 * A tie between two teams. Depending on `isTwoLegged`, it holds either a
 * single leg (`legs.length === 1`) or two legs — home & away — with the
 * winner decided by aggregate score (away-goals-away rule is intentionally
 * NOT modeled: modern FIFA/EA FC competitive rulesets generally resolve
 * aggregate ties with extra time + penalties on the second leg instead of
 * away goals; `awayGoalsRuleApplies` on the tournament config controls this
 * if ever needed, see tournament.schema.ts).
 *
 * `Match` is the generic building block reused by every format:
 *   - Single elimination bracket slots
 *   - Group stage round-robin fixtures
 *   - League round-robin fixtures
 *   - Swiss stage pairings
 *   - Third-place / playoff / final matches
 *
 * It is embedded (not a separate collection) because matches only ever make
 * sense in the context of one tournament, are always read/written together
 * with it, and the total volume is small: even a 32-team double round-robin
 * league is at most 32*31 = 992 fixtures — well within the 16MB document
 * limit alongside the rest of the tournament data (realistically most
 * tournaments have well under 100 matches).
 */
@Schema({ _id: false })
export class Match {
  /**
   * Stable id for this match/tie. Generated as `new Types.ObjectId().toString()`
   * at fixture-generation time (draw/*, and later by the progression engine
   * for matches created after the draw: Swiss rounds/play-in, knockout
   * brackets built from group/Swiss qualifiers, table tiebreaks). IDs are
   * unique GLOBALLY (not just within the tournament) so `PATCH
   * /tournaments/match/:matchId` can look a match up without knowing which
   * tournament/phase it belongs to. The match's structural position (phase,
   * round/group, array order) is what conveys "where" it is — never parsed
   * out of the id's format.
   */
  @Prop({ required: true })
  matchId: string;

  /** Local teamId (Team.teamId) of the home/first-leg-host side. */
  @Prop({ type: String })
  homeTeamId?: string;

  /** Local teamId (Team.teamId) of the away/second-leg-host side. */
  @Prop({ type: String })
  awayTeamId?: string;

  @Prop({ default: false })
  isTwoLegged: boolean;

  /** One entry if single match, two entries (leg 1, leg 2) if two-legged. */
  @Prop({ type: [MatchResultSchema], default: [] })
  legs: MatchResult[];

  @Prop({ type: String, enum: MatchStatus, default: MatchStatus.SCHEDULED })
  status: MatchStatus;

  /**
   * Final winner of the tie (after aggregate + extra time/penalties on the
   * decisive leg, if needed). Local teamId. Undefined until decided.
   * For a draw-eligible context (e.g. league fixtures where draws stand),
   * this is left undefined and each leg's regulation score is what counts.
   */
  @Prop({ type: String })
  winnerTeamId?: string;

  /** True when the tie ended in a draw and draws are allowed to stand (league). */
  @Prop({ default: false })
  isDraw: boolean;

  /**
   * Whether THIS tie may be decided by penalties when scores are level.
   * Set once, at generation time, per the format/phase it belongs to:
   *   - false: league fixtures, group-stage fixtures, and league/group
   *     tiebreak matches (all of these are draw-eligible — league rules).
   *   - true: Swiss matches, knockout matches (incl. preliminary round),
   *     play-in matches, third-place matches.
   * For a two-legged knockout tie, `allowsPenalties=true` means penalties
   * are only ever taken on the SECOND leg, if the aggregate score is level
   * after both legs — the first leg can always end level with no penalties,
   * it's simply carried into the aggregate.
   */
  @Prop({ default: false })
  allowsPenalties: boolean;

  /**
   * Console physical unit type assigned to this match once it becomes
   * playable (both teams known). Assigned by the backend — round-robin over
   * `Tournament.consoleUnits` — either when `GET /tournaments/:id/matches`
   * first surfaces it as playable, or (as a fallback) by the result PATCH
   * itself if it was somehow never assigned. Once set it never changes.
   */
  @Prop({ type: String, enum: GameConsole })
  assignedConsole?: GameConsole;

  @Prop()
  scheduledAt?: Date;
}

export const MatchSchema = SchemaFactory.createForClass(Match);
