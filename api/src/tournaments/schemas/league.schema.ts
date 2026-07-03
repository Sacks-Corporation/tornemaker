import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Match, MatchSchema } from './common/match.schema';
import { Standing, StandingSchema } from './common/standing.schema';

/**
 * Format 3 — League (round-robin).
 *
 * - 4 to 30 teams, ALL of them linked to a real player (enforced at the
 *   service/validation layer against Team.playerName / Team.userId, since
 *   that constraint is cross-field and doesn't belong in the schema).
 * - `doubleRound` = false -> single round-robin (n-1 rounds, n*(n-1)/2 matches).
 *   `doubleRound` = true  -> home-and-away round-robin (2*(n-1) rounds,
 *   n*(n-1) matches). Each fixture is a single-leg Match (isTwoLegged is
 *   always false here — "ida y vuelta" in a league means two SEPARATE
 *   fixtures/matches, each with its own winner/draw, not one aggregate tie
 *   like in a knockout).
 * - Matches are grouped into rounds (matchdays) for scheduling purposes.
 * - Standings tie-break order: goal difference -> goals for -> head-to-head
 *   (see Standing schema doc). Points are configurable (win/draw/loss) via
 *   `pointsForWin` / `pointsForDraw` / `pointsForLoss` so the organizer can
 *   support the classic 3/1/0 or any other scheme.
 */
@Schema({ _id: false })
export class LeagueMatchday {
  @Prop({ required: true })
  roundNumber: number;

  @Prop({ type: [MatchSchema], default: [] })
  matches: Match[];
}

export const LeagueMatchdaySchema =
  SchemaFactory.createForClass(LeagueMatchday);

@Schema({ _id: false })
export class LeagueStage {
  @Prop({ default: false })
  doubleRound: boolean;

  @Prop({ default: 3 })
  pointsForWin: number;

  @Prop({ default: 1 })
  pointsForDraw: number;

  @Prop({ default: 0 })
  pointsForLoss: number;

  @Prop({ type: [LeagueMatchdaySchema], default: [] })
  matchdays: LeagueMatchday[];

  @Prop({ type: [StandingSchema], default: [] })
  standings: Standing[];
}

export const LeagueStageSchema = SchemaFactory.createForClass(LeagueStage);
