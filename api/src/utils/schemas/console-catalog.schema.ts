import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ConsoleCatalogDocument = HydratedDocument<ConsoleCatalog>;

/**
 * Catalog of gaming consoles a tournament can be played on. This collection
 * is the SINGLE SOURCE OF TRUTH for which console `code`s are valid — it
 * replaces the former `GameConsole` enum (see console.enum.ts, deleted).
 *
 * `code` is persisted verbatim wherever a console needs to be referenced
 * (`Tournament.consoleUnits`, `Tournament.allowedConsoles`,
 * `Match.assignedConsole`, `MatchResult.console`), so existing `code`s must
 * NEVER change once in use — there are tournaments already persisted with
 * the exact values seeded by `UtilsService` (PLAY_2/PLAY_3/PLAY_4/PLAY_5).
 * New consoles can be added over time by inserting new documents; retiring
 * one is done by setting `isActive: false` rather than deleting it, so past
 * tournaments that already reference it keep a meaningful value.
 */
@Schema({ collection: 'consoles', timestamps: true })
export class ConsoleCatalog {
  /** Stable machine code, e.g. 'PLAY_4'. Immutable once created. */
  @Prop({ required: true, unique: true, trim: true })
  code: string;

  /** Human-readable label for the UI, e.g. 'Play 4'. */
  @Prop({ required: true, trim: true })
  label: string;

  /** Display order for `GET /utils/consoles`. */
  @Prop({ required: true })
  sortOrder: number;

  /** Whether this is the option pre-selected by default in the UI. */
  @Prop({ default: false })
  isDefault: boolean;

  /** Whether this option is still offered to new tournaments. */
  @Prop({ default: true })
  isActive: boolean;
}

export const ConsoleCatalogSchema =
  SchemaFactory.createForClass(ConsoleCatalog);
