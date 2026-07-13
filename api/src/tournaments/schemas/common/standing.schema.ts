import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

/**
 * A single row of a standings table, used both for the league format and
 * for each group of the group-stage format.
 *
 * Tie-break order (applied in this exact sequence, per the business rule —
 * this REPLACES the previous head-to-head-based rule):
 *   1) Points
 *   2) Goal difference (goalsFor - goalsAgainst)
 *   3) Goals for
 *   4) Matches won
 *   5) If still tied AND the tie affects something that matters (a group's
 *      qualification boundary, or any position of a league's final table)
 *      AND the phase has already finished: one or more tiebreak matches are
 *      generated among (only) the tied teams — see `tiebreakMatches` on
 *      `LeagueStage`/`Group` — 1 match if 2 teams are tied, a round-robin
 *      (triangular/quadrangular) if 3 or 4 are tied. These matches admit
 *      draws (league rules — see `Match.allowsPenalties`). Once played, the
 *      tied teams are re-ranked using the SAME criteria above but computed
 *      only from the tiebreak matches; if that mini-table is STILL tied,
 *      the tie is broken by `Team.seed` (lower seed wins) as a last resort.
 *      The tournament's `state` does not advance past this phase until
 *      every such tie is resolved.
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
