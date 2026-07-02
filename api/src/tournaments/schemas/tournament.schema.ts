import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TournamentDocument = HydratedDocument<Tournament>;

export enum TournamentStatus {
  EN_PROGRESO = 'EN_PROGRESO',
  TERMINADO = 'TERMINADO',
}

/**
 * Tournament metadata only.
 *
 * The internal structure (participants, brackets, matches, results, etc.)
 * is intentionally left undefined — it will be modeled once the team defines
 * the tournament format(s).
 * TODO: add internal structure field(s) once the format is defined by the team.
 */
@Schema({ timestamps: true })
export class Tournament {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({
    type: String,
    enum: TournamentStatus,
    default: TournamentStatus.EN_PROGRESO,
  })
  status: TournamentStatus;

  // createdAt and updatedAt are injected automatically by { timestamps: true }
}

export const TournamentSchema = SchemaFactory.createForClass(Tournament);
