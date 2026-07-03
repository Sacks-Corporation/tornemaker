import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
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
  /** Stable local id for this match/tie, unique within the tournament. */
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

  @Prop()
  scheduledAt?: Date;
}

export const MatchSchema = SchemaFactory.createForClass(Match);
