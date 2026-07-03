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
 * Design notes — non power-of-two draws (6, 10, 12, 20, 24, 28 teams):
 * The bracket is always built as the next power of two that fits the
 * qualified team count (8, 16, 16, 32, 32, 32 respectively). The gap
 * between the team count and that power of two is resolved with byes
 * awarded to the best-seeded teams in a **preliminary round**:
 *   - 6  teams -> nextPow2 = 8  -> 2 teams get a bye, 4 teams (2 matches)
 *                 play a preliminary round; winners join the 2 byes in
 *                 quarterfinals... actually with 6 teams the preliminary
 *                 round produces 2 winners that combine with the 4 byes to
 *                 form a clean quarterfinal round of 4 matches (see
 *                 byeCount below — this is computed, not hardcoded).
 *   - 10 teams -> nextPow2 = 16 -> 6 byes, 4 preliminary matches (8 teams).
 *   - 12 teams -> nextPow2 = 16 -> 4 byes, 8 preliminary matches... i.e.
 *                 preliminary round is sized as
 *                 (teamCount - byeCount) where byeCount = nextPow2 - teamCount,
 *                 and preliminary match count = (teamCount - byeCount) / 2.
 *   - 20 teams -> nextPow2 = 32 -> 12 byes, 8 preliminary matches.
 *   - 24 teams -> nextPow2 = 32 -> 8 byes, 16 preliminary matches.
 *   - 28 teams -> nextPow2 = 32 -> 4 byes, 24 preliminary matches.
 * `byeTeamIds` records exactly which teams received a bye directly into
 * round 1 of the main bracket, so the fixture generator and the UI can
 * render the preliminary round distinctly. This computation is generic
 * (byeCount = nextPowerOfTwo(teamCount) - teamCount) and therefore covers
 * every case above without special-casing any particular team count.
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
