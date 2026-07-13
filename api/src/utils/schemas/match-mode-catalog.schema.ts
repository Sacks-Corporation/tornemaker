import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MatchModeCatalogDocument = HydratedDocument<MatchModeCatalog>;

/**
 * Catalog of match modes (how many real players sit behind each team) a
 * tournament can be configured with. This collection is the SINGLE SOURCE
 * OF TRUTH for which match mode `code`s are valid, and for
 * `playersPerTeam` — it replaces the former `MatchMode` enum (see
 * match-mode.enum.ts, deleted) and the former `PLAYERS_PER_TEAM` map (see
 * dto/format-rules.ts).
 *
 * `code` is persisted verbatim on `Tournament.matchMode`, so existing
 * `code`s must NEVER change once in use — there are tournaments already
 * persisted with the exact values seeded by `UtilsService`
 * ('1v1'/'2v2'/'3v3'). Retiring a mode is done by setting `isActive: false`
 * rather than deleting it.
 */
@Schema({ collection: 'matchmodes', timestamps: true })
export class MatchModeCatalog {
  /** Stable machine code, e.g. '2v2'. Immutable once created. */
  @Prop({ required: true, unique: true, trim: true })
  code: string;

  /** Human-readable label for the UI, e.g. '2 vs 2'. */
  @Prop({ required: true, trim: true })
  label: string;

  /** How many real players make up one team under this mode. */
  @Prop({ required: true, min: 1 })
  playersPerTeam: number;

  /** Display order for `GET /utils/match-modes`. */
  @Prop({ required: true })
  sortOrder: number;

  /** Whether this option is still offered to new tournaments. */
  @Prop({ default: true })
  isActive: boolean;
}

export const MatchModeCatalogSchema =
  SchemaFactory.createForClass(MatchModeCatalog);
