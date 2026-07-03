import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

/**
 * A single row of a standings table, used both for the league format and
 * for each group of the group-stage format.
 *
 * Tie-break order (applied in this exact sequence, per the business rule):
 *   1) Goal difference (goalsFor - goalsAgainst)
 *   2) Goals for
 *   3) Head-to-head result between the tied teams only
 *      (mini-table restricted to the tied teams' matches against each
 *      other; if still tied, points from those matches, then goal
 *      difference within those matches, then goals scored within those
 *      matches — computed on demand by the standings service, not stored).
 * These stored fields are the inputs to that computation; the rank itself
 * is recomputed by the service layer, not persisted as a source of truth,
 * but `rank` is cached here for fast reads (list of standings without
 * recomputation) and MUST be recalculated on every result update.
 */
@Schema({ _id: false })
export class Standing {
  @Prop({ type: String, required: true })
  teamId: string;

  @Prop({ default: 0 })
  played: number;

  @Prop({ default: 0 })
  won: number;

  @Prop({ default: 0 })
  drawn: number;

  @Prop({ default: 0 })
  lost: number;

  @Prop({ default: 0 })
  goalsFor: number;

  @Prop({ default: 0 })
  goalsAgainst: number;

  @Prop({ default: 0 })
  goalDifference: number;

  @Prop({ default: 0 })
  points: number;

  /** Cached table position (1-based) after applying the tie-break rules. */
  @Prop()
  rank?: number;
}

export const StandingSchema = SchemaFactory.createForClass(Standing);
