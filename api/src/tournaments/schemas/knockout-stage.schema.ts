import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Bracket, BracketSchema } from './common/bracket.schema';

/**
 * Format 1 — Single elimination.
 *
 * - Teams: 6, 8, 10, 12, 16, 20, 24, 28, 32 (validated at the DTO/service
 *   layer against this closed set of supported draw sizes).
 * - Ties can be single match or two-legged (isTwoLegged on the Bracket),
 *   configurable per tournament.
 * - Optional third-place match (hasThirdPlaceMatch).
 * - Losers are eliminated. Extra time / penalties are supported per leg via
 *   MatchResult.
 * - Non power-of-two draws (6, 10, 12, 20, 24, 28) get a preliminary round
 *   with byes for the best-seeded teams — see Bracket schema doc for the
 *   generic byeCount computation that covers every one of these cases.
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
