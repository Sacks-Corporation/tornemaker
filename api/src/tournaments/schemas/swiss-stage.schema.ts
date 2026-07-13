import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Match, MatchSchema } from './common/match.schema';

/**
 * Format 4 — Swiss stage + elimination (Worlds/LoL style).
 *
 * Team/player counts supported: 8, 10, 12, 16, 24, 32.
 * Every team is linked to a real player. Matches are single-leg; extra time
 * and penalties are supported (a Swiss match must produce a winner, so a
 * draw after regulation escalates to extra time and/or penalties, exactly
 * like the reference example: "V(1-1) P(4-2)").
 *
 * Advancement rule: a team qualifies at 3 wins, is eliminated at 3 losses.
 * Because teams stop playing as soon as they hit 3W or 3L, **not every team
 * plays the same number of rounds** (a team can close out 3-0 in round 3,
 * or drag on to 3-2 in round 5) — this is why `SwissParticipant.record` is
 * tracked per team rather than assuming a fixed round count, and why
 * `SwissRound.matches` only contains the teams that are still alive AND not
 * yet qualified at the start of that round.
 *
 * Pairing rules (score groups):
 *   - Within a round, teams are grouped by their current record (score
 *     group), e.g. all 2W-1D... actually record is win/loss based: 2W-0L,
 *     1W-1L, 0W-2L, etc. Teams are paired against others in the SAME score
 *     group whenever possible.
 *   - Odd-sized score groups (e.g. a 2-1 group with 3 teams when the
 *     bracket doesn't split evenly) cannot pair everyone internally: one
 *     team is "bumped" down to the adjacent score group below (or up, per
 *     the tournament's chosen convention) to pair against a team one
 *     record apart (e.g. a 2-1 team facing a 1-2 team). This is standard
 *     Swiss practice (used in Worlds-style Swiss draws). The bumped
 *     pairing is still recorded as a normal SwissMatch; nothing special is
 *     stored for it beyond the two participants' records at pairing time
 *     (`participant.record` history is reconstructible from match log, but
 *     see `SwissParticipant.resultsByRound` for a direct per-round view).
 *   - Rematch avoidance: `SwissParticipant.opponentTeamIds` accumulates
 *     every opponent a team has already faced; the pairing algorithm (to be
 *     implemented later, outside this schema) MUST exclude any candidate
 *     pair already present in either side's `opponentTeamIds` before
 *     falling back to a cross-score-group pairing if a same-group pairing
 *     would force a repeat that cannot otherwise be avoided.
 *
 * Variable qualifier count + play-in: the number of teams that reach 3 wins
 * is not fixed in advance (e.g. 5 teams can reach 3W before the bracket's
 * required power-of-two count of qualifiers is reached, as in the Notion
 * reference example with 10 players producing 5 qualifiers for a 4-team
 * bracket). `targetQualifiers` holds the desired bracket size (e.g. 4).
 * When the number of teams that actually reach 3 wins does not match
 * `targetQualifiers`, one or more extra `playIn` matches are played among
 * the excess/lowest-ranked 3-win teams (ranked by tiebreakers such as game
 * differential) to trim the field down to exactly `targetQualifiers` before
 * the knockout bracket (`knockoutStage` on the Tournament document) is
 * generated. `playIn` is an explicit array (rather than folding it into the
 * regular Swiss rounds) because it is conceptually a different stage: it
 * only involves teams that already clinched qualification.
 */
@Schema({ _id: false })
export class SwissParticipant {
  @Prop({ type: String, required: true })
  teamId: string;

  @Prop({ default: 0 })
  wins: number;

  @Prop({ default: 0 })
  losses: number;

  /** True once wins reaches the qualification threshold (3). */
  @Prop({ default: false })
  isQualified: boolean;

  /** True once losses reaches the elimination threshold (3). */
  @Prop({ default: false })
  isEliminated: boolean;

  /** Every opponent already faced, to prevent rematches when pairing. */
  @Prop({ type: [String], default: [] })
  opponentTeamIds: string[];

  /** Tiebreaker: aggregate goal difference across all Swiss matches played. */
  @Prop({ default: 0 })
  gameDifferential: number;
}

export const SwissParticipantSchema =
  SchemaFactory.createForClass(SwissParticipant);

@Schema({ _id: false })
export class SwissRound {
  @Prop({ required: true })
  roundNumber: number;

  @Prop({ type: [MatchSchema], default: [] })
  matches: Match[];
}

export const SwissRoundSchema = SchemaFactory.createForClass(SwissRound);

@Schema({ _id: false })
export class SwissStage {
  @Prop({ default: 3 })
  winsToQualify: number;

  @Prop({ default: 3 })
  lossesToEliminate: number;

  /** Desired knockout bracket size the Swiss stage must funnel into (e.g. 4, 8). */
  @Prop({ required: true })
  targetQualifiers: number;

  @Prop({ type: [SwissParticipantSchema], default: [] })
  participants: SwissParticipant[];

  @Prop({ type: [SwissRoundSchema], default: [] })
  rounds: SwissRound[];

  /**
   * Extra matches played among teams that already reached `winsToQualify`
   * when their count doesn't match `targetQualifiers`, to seed the bracket
   * with exactly the right number of teams (see class doc).
   */
  @Prop({ type: [MatchSchema], default: [] })
  playIn: Match[];

  /** Final ranked list of local teamIds that advance to the knockout stage. */
  @Prop({ type: [String], default: [] })
  qualifiedTeamIds: string[];

  /**
   * Whether the knockout bracket built ONCE THIS SWISS STAGE FINISHES should
   * be two-legged. Set at tournament-creation time from
   * `CreateTournamentDto.twoLegged` (see draw/swiss-fixtures.ts /
   * draw.service.ts) and consumed later by the progression engine when it
   * builds `Tournament.knockoutStage` (see
   * progression/match-progression.service.ts).
   *
   * This does NOT affect the Swiss stage's own matches (`rounds`/`playIn`),
   * which are ALWAYS single-leg — a Swiss match must always produce a
   * winner in one leg (escalating to penalties if needed, see
   * `Match.allowsPenalties`). It only controls the follow-up bracket's
   * `Bracket.isTwoLegged`.
   */
  @Prop({ default: false })
  knockoutTwoLegged: boolean;
}

export const SwissStageSchema = SchemaFactory.createForClass(SwissStage);
