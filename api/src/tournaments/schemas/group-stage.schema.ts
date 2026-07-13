import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Match, MatchSchema } from './common/match.schema';
import { Standing, StandingSchema } from './common/standing.schema';

/**
 * Format 2 — Group stage + single elimination.
 *
 * - Teams: 6, 8, 12, 16, 20, 24, 28, 32. Group size: 3, 4 or 5 (organizer
 *   choice, validated together with team count at the service layer —
 *   `teamCount` must be evenly divisible by `groupSize`).
 * - Matches within a group can be single leg or two-legged (`doubleRound`).
 * - Top 2 of every group always qualify. Depending on how many groups/what
 *   size, the bracket may also need the "best third-placed teams" to reach
 *   a power-of-two qualifier count so the knockout bracket closes cleanly
 *   (this stage never generates byes into its own knockout stage — any
 *   gap is closed by best-thirds instead).
 *
 * Design note — worked cases (teamCount / groupSize -> groups -> qualifiers):
 *   6  / 3 -> 2 groups -> 4 direct (2x2)            -> bracket of 4, no thirds.
 *   8  / 4 -> 2 groups -> 4 direct (2x2)            -> bracket of 4, no thirds.
 *   12 / 4 -> 3 groups -> 6 direct (2x3) + 2 best 3rd -> bracket of 8.
 *   12 / 3 -> 4 groups -> 8 direct (2x4)            -> bracket of 8, no thirds.
 *   16 / 4 -> 4 groups -> 8 direct (2x4)            -> bracket of 8, no thirds.
 *   20 / 5 -> 4 groups -> 8 direct (2x4)            -> bracket of 8, no thirds.
 *   20 / 4 -> 5 groups -> 10 direct (2x5)           -> NOT supported: cannot
 *             reach 8 (10 > 8) nor 16 (would need 6 best-thirds out of only
 *             5 possible) with a clean bracket; the service layer should
 *             reject `groupSize=4` for `teamCount=20` and require
 *             `groupSize=5` instead.
 *   24 / 3 -> 8 groups -> 16 direct (2x8)           -> bracket of 16, no thirds.
 *   24 / 4 -> 6 groups -> 12 direct (2x6) + 4 best 3rd -> bracket of 16.
 *   28 / 4 -> 7 groups -> 14 direct (2x7) + 2 best 3rd -> bracket of 16.
 *   32 / 4 -> 8 groups -> 16 direct (2x8)           -> bracket of 16, no thirds.
 * `bestThirdPlaceSlots` therefore is always either 0 or a value that makes
 * (2 * groupCount + bestThirdPlaceSlots) a power of two; it is computed and
 * stored explicitly (rather than re-derived ad hoc) so the bracket-building
 * step and the UI have one unambiguous source of truth. Ranking among
 * third-placed teams uses the same tie-break order as group standings
 * (goal difference -> goals for -> head-to-head where applicable).
 *
 * Group standings reuse the generic Standing subdocument and its tie-break
 * order (goal difference -> goals for -> head-to-head between tied teams).
 * The subsequent knockout bracket is the shared `Bracket` subdocument
 * (embedded on Tournament as `knockoutStage`), fed by the qualifiers this
 * stage produces.
 */
@Schema({ _id: false })
export class Group {
  @Prop({ required: true })
  name: string; // e.g. "Group A"

  @Prop({ type: [String], required: true })
  teamIds: string[];

  @Prop({ type: [MatchSchema], default: [] })
  matches: Match[];

  @Prop({ type: [StandingSchema], default: [] })
  standings: Standing[];

  /**
   * Extra matches played among teams tied within this group (once every
   * group match is complete) when the tie affects the group's qualification
   * boundary — see the tie-break rule documented on `Standing`. Empty
   * until/unless needed.
   */
  @Prop({ type: [MatchSchema], default: [] })
  tiebreakMatches: Match[];
}

export const GroupSchema = SchemaFactory.createForClass(Group);

@Schema({ _id: false })
export class GroupStage {
  @Prop({ required: true, min: 3, max: 5 })
  groupSize: number;

  @Prop({ default: false })
  doubleRound: boolean;

  @Prop({ type: [GroupSchema], default: [] })
  groups: Group[];

  /** How many extra "best third-placed" teams advance (0 if not needed). */
  @Prop({ default: 0 })
  bestThirdPlaceSlots: number;

  /** Local teamIds of the qualified best-third teams, ranked, once decided. */
  @Prop({ type: [String], default: [] })
  qualifiedThirdPlaceTeamIds: string[];
}

export const GroupStageSchema = SchemaFactory.createForClass(GroupStage);
