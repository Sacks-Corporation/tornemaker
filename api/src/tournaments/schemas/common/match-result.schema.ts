import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

/**
 * The final outcome of a single leg (one played match), independent of the
 * format. Every leg is played on exactly one console, which is mandatory —
 * the organizer explicitly wants to know where each match was played.
 *
 * Regulation score is always required once the leg is played. Extra time and
 * penalties are optional escalation steps used only when regulation (and
 * then extra time) ends in a draw and the leg needs a single winner (e.g. a
 * decisive knockout leg, a Swiss-stage match, or the second leg of a tie that
 * is level on aggregate).
 */
@Schema({ _id: false })
export class MatchResult {
  /** `code` of the console this leg was played on (see `consoles` catalog / UtilsService). */
  @Prop({ type: String, required: true })
  console: string;

  /** Regulation-time (90 min) goals for the home side of this leg. */
  @Prop({ required: true, min: 0 })
  homeGoals: number;

  /** Regulation-time (90 min) goals for the away side of this leg. */
  @Prop({ required: true, min: 0 })
  awayGoals: number;

  @Prop({ default: false })
  wentToExtraTime: boolean;

  /** Extra-time-only goals (added on top of regulation), when applicable. */
  @Prop({ min: 0 })
  extraTimeHomeGoals?: number;

  @Prop({ min: 0 })
  extraTimeAwayGoals?: number;

  @Prop({ default: false })
  wentToPenalties: boolean;

  @Prop({ min: 0 })
  penaltyHomeGoals?: number;

  @Prop({ min: 0 })
  penaltyAwayGoals?: number;

  /**
   * Winner of THIS leg alone (not the aggregate/tie). Null/undefined means
   * the leg itself ended level and is only resolved together with the other
   * leg via aggregate score (normal for the first leg of a two-legged tie).
   * Populated with the team's local `teamId`.
   */
  @Prop({ type: String })
  legWinnerTeamId?: string;

  @Prop()
  playedAt?: Date;
}

export const MatchResultSchema = SchemaFactory.createForClass(MatchResult);
