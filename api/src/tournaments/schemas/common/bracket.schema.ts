import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Match, MatchSchema } from './match.schema';

/**
 * A single round of a single-elimination bracket (e.g. "Round of 16",
 * "Quarterfinals", "Semifinals", "Final", or a "Preliminary Round" used to
 * cut a non-power-of-two draw down to a power of two).
 *
 * Round ordering is given by the array order inside Bracket.rounds — round
 * 0 is played first. `name` is a human label computed at generation time
 * (e.g. "Preliminary Round", "Round of 16", "Quarterfinals", "Semifinals").
 */
@Schema({ _id: false })
export class BracketRound {
  @Prop({ required: true })
  roundNumber: number;

  @Prop({ required: true })
  name: string;

  @Prop({ type: [MatchSchema], default: [] })
  matches: Match[];
}

export const BracketRoundSchema = SchemaFactory.createForClass(BracketRound);

/**
 * A full single-elimination bracket. Used standalone (Format 1), as the
 * second stage of Format 2 (group stage -> elimination) and Format 4
 * (Swiss -> elimination).
 *
 * Design notes — non power-of-two draws (ANY `teamCount`, not a fixed list):
 * The bracket is always built as the next power of two that fits the
 * qualified team count (`nextPowerOfTwo(teamCount)`). The gap between the
 * team count and that power of two is resolved with byes awarded to the
 * best-seeded teams in a **preliminary round**:
 *   - byeCount = nextPowerOfTwo(teamCount) - teamCount teams get a bye
 *     directly into round 1 of the main bracket.
 *   - The remaining (teamCount - byeCount) teams play a preliminary round of
 *     (teamCount - byeCount) / 2 matches; winners join the byes to fill
 *     round 1 of the main bracket.
 * E.g. teamCount=15 -> nextPow2=16 -> 1 bye, 14 teams / 7 preliminary
 * matches. teamCount=7 -> nextPow2=8 -> 1 bye, 6 teams / 3 preliminary
 * matches. `byeTeamIds` records exactly which teams received a bye directly
 * into round 1 of the main bracket, so the fixture generator and the UI can
 * render the preliminary round distinctly. This computation is fully
 * generic (byeCount = nextPowerOfTwo(teamCount) - teamCount) and covers
 * every `teamCount` in the supported range without special-casing any
 * particular value — see draw/knockout-fixtures.ts#buildKnockoutStage.
 */
@Schema({ _id: false })
export class Bracket {
  @Prop({ required: true })
  drawSize: number; // next power of two the bracket was built for (e.g. 8, 16, 32)

  @Prop({ type: [String], default: [] })
  byeTeamIds: string[]; // local teamIds that skipped the preliminary round

  @Prop({ default: false })
  hasPreliminaryRound: boolean;

  @Prop({ type: [BracketRoundSchema], default: [] })
  rounds: BracketRound[];

  /** Whether bracket ties (other than a dedicated 3rd-place match) are two-legged. */
  @Prop({ default: false })
  isTwoLegged: boolean;

  @Prop({ default: false })
  hasThirdPlaceMatch: boolean;

  @Prop({ type: MatchSchema })
  thirdPlaceMatch?: Match;

  @Prop({ type: String })
  championTeamId?: string;
}

export const BracketSchema = SchemaFactory.createForClass(Bracket);
