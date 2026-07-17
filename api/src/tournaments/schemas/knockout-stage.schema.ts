import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Bracket, BracketSchema } from './common/bracket.schema';

/**
 * Format 1 — Single elimination.
 *
 * - Teams: any integer `teamCount` in [4, 64] (validated at the DTO/service
 *   layer as a RANGE, not a closed set — see
 *   `dto/format-rules.ts#TEAM_RANGE_BY_FORMAT`). With `aiFill=true`, CPU/AI
 *   teams are added up to the next power of two before the draw runs (e.g.
 *   7 -> 8) — see `Tournament.aiFill`.
 * - Ties can be single match or two-legged (isTwoLegged on the Bracket),
 *   configurable per tournament.
 * - Optional third-place match (hasThirdPlaceMatch).
 * - Losers are eliminated. Extra time / penalties are supported per leg via
 *   MatchResult.
 * - Non power-of-two draws get a preliminary round with byes for the
 *   best-seeded teams — see Bracket schema doc for the generic byeCount
 *   computation that covers every team count in the supported range.
 *
 * This stage is just a thin wrapper around the generic Bracket subdocument
 * so the tournament document has a stable, self-describing field name
 * (`knockoutStage`) regardless of which format populated it.
 */
@Schema({ _id: false })
export class KnockoutStage {
  @Prop({ type: BracketSchema, required: true })
  bracket: Bracket;
}

export const KnockoutStageSchema = SchemaFactory.createForClass(KnockoutStage);
