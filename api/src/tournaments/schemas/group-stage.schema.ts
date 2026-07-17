import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Match, MatchSchema } from './common/match.schema';
import { Standing, StandingSchema } from './common/standing.schema';

/**
 * Format 2 — Group stage + single elimination.
 *
 * - Teams: any integer `teamCount` in [6, 64] (see
 *   `dto/format-rules.ts#TEAM_RANGE_BY_FORMAT`). `groupCap` (organizer
 *   choice, min 3) is the MAX size of any group — teams are split into a
 *   balanced distribution via `dto/format-rules.ts#computeGroupDistribution`
 *   (`groupCount = ceil(teamCount / groupCap)`, sizes differ by at most 1,
 *   never exceed `groupCap`). E.g. teamCount=10, groupCap=4 -> groups of
 *   [4, 3, 3] (never [4, 4, 2]). A combination is only valid when
 *   `groupCount >= 2` and `teamCount >= 3 * groupCount` — rejected at the
 *   service layer otherwise (e.g. teamCount=10, groupCap=3 -> groupCount=4,
 *   but 10 < 12, invalid).
 * - Matches within a group can be single leg or two-legged (`doubleRound`).
 * - ONLY the top 2 of every group qualify — there is no "best third-placed
 *   teams" mechanism (removed together with the old closed team-count
 *   table). Direct qualifiers = `2 * groupCount`; when that isn't a power of
 *   two, the follow-up knockout bracket is resolved with byes/a preliminary
 *   round instead, reusing the exact same generic mechanism as
 *   SINGLE_ELIMINATION (see draw/knockout-fixtures.ts#buildKnockoutStage).
 *   When seeding that bracket, group WINNERS are prioritized to receive the
 *   byes (see progression/knockout-seeding.util.ts#buildGroupQualifiersSeedOrder).
 *
 * `aiFill` (see `Tournament.aiFill`) can pad `teamCount` up to the next
 * multiple of `groupCap` (capped at the format's max) before the draw runs,
 * so a request for e.g. 10 teams with `groupCap=4` and `aiFill=true` is
 * actually drawn as 12 teams (3 clean groups of 4) — the extra teams are
 * CPU/AI-controlled (no assigned players), same convention as an unassigned
 * team in any other format.
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
  /** Max teams allowed per group (organizer choice, min 3) — the actual
   *  per-group sizes are a balanced distribution capped at this value, see
   *  the class doc above. Renamed from the old fixed `groupSize` (which
   *  used to be every group's EXACT size, now only its ceiling). */
  @Prop({ required: true, min: 3 })
  groupCap: number;

  @Prop({ default: false })
  doubleRound: boolean;

  @Prop({ type: [GroupSchema], default: [] })
  groups: Group[];

  /**
   * @deprecated Vestigial. The "best third-placed teams" mechanism was
   * removed (see class doc above): non-power-of-two qualifier counts are now
   * resolved with knockout byes, not extra qualifiers. Always `0` on any
   * stage built by the current `buildGroupStage`/migration. Kept ONLY so
   * historical tournaments created before this change keep serializing with
   * the same response shape on `GET /tournaments/:id`.
   */
  @Prop({ default: 0 })
  bestThirdPlaceSlots: number;

  /** @deprecated Vestigial, see `bestThirdPlaceSlots`. Always `[]` now. */
  @Prop({ type: [String], default: [] })
  qualifiedThirdPlaceTeamIds: string[];
}

export const GroupStageSchema = SchemaFactory.createForClass(GroupStage);
