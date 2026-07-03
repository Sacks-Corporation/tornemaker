import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { GameConsole } from './common/console.enum';
import { TournamentFormat } from './common/tournament-format.enum';
import { Team, TeamSchema } from './common/team.schema';
import { KnockoutStage, KnockoutStageSchema } from './knockout-stage.schema';
import { GroupStage, GroupStageSchema } from './group-stage.schema';
import { LeagueStage, LeagueStageSchema } from './league.schema';
import { SwissStage, SwissStageSchema } from './swiss-stage.schema';
import { Match, MatchSchema } from './common/match.schema';

export type TournamentDocument = HydratedDocument<Tournament>;

export enum TournamentStatus {
  EN_PROGRESO = 'EN_PROGRESO',
  TERMINADO = 'TERMINADO',
}

/**
 * Tournament — aggregate root for a full FIFA/EA Sports FC tournament run
 * by a Tornemaker user.
 *
 * Embedding strategy (why almost everything lives on this one document):
 *   - Teams, matches, groups, standings, Swiss rounds and the knockout
 *     bracket are all embedded subdocuments, NOT separate collections.
 *   - Rationale: (1) none of these nested entities are ever queried or
 *     updated independently of their tournament — the app's dominant access
 *     pattern is "load the whole tournament" / "save the whole tournament
 *     after recording a result"; (2) they have no existence outside their
 *     parent tournament (deleting a tournament deletes everything in it,
 *     which embedding gives for free); (3) volume is bounded and small —
 *     even the largest supported configuration (32-team double round-robin
 *     league) tops out at under 1,000 small match subdocuments, several
 *     orders of magnitude below the 16MB MongoDB document limit.
 *   - The one true reference (not embed) is `ownerId -> User`, because
 *     users are a genuinely independent, separately-queried collection
 *     (login, profile) and a tournament belongs to exactly one owner.
 *   - `Team.userId` is also a reference for the same reason (an optional
 *     link to a platform account), while everything about the team's
 *     participation *within this tournament* (seed, display name, logo)
 *     is embedded because it's tournament-specific, not user-specific.
 *
 * Format-specific structure: exactly one of `knockoutStage`, `groupStage`,
 * `leagueStage`, `swissStage` is populated, matching `format`. They are
 * modeled as distinct, strongly-typed optional subdocuments (instead of a
 * single `Mixed`/schemaless blob or a Mongoose discriminator on the root
 * document) so every field keeps full Mongoose validation and TypeScript
 * typing. A root-level discriminator was intentionally avoided: the four
 * formats share the large majority of their building blocks (Team, Match,
 * MatchResult, Standing, Bracket), so composing them as optional typed
 * sub-schemas keeps that shared code truly shared, while still letting the
 * service layer narrow on `format` to know which field is populated.
 * `groupStage` and `swissStage` additionally populate `knockoutStage` once
 * their qualifiers are known (group stage -> elimination, Swiss ->
 * elimination), reusing the very same Bracket structure as format 1.
 *
 * Consoles: `allowedConsoles` declares which console(s) this tournament is
 * played on (it can be more than one, e.g. mixing Play 4 and Play 5).
 * Every individual match leg still carries its own mandatory `console` on
 * `MatchResult` — this is intentionally NOT redundant: `allowedConsoles` is
 * the tournament-level configuration/validation set, while the per-leg
 * value is the actual historical record of where that specific leg was
 * played (the service layer should validate that a leg's console belongs
 * to `allowedConsoles`, but the schema does not hardcode any single value).
 */
@Schema({ timestamps: true })
export class Tournament {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({
    type: String,
    enum: TournamentStatus,
    default: TournamentStatus.EN_PROGRESO,
  })
  status: TournamentStatus;

  @Prop({ type: String, enum: TournamentFormat, required: true })
  format: TournamentFormat;

  /** Console(s) this tournament may be played on. At least one required. */
  @Prop({ type: [String], enum: GameConsole, required: true })
  allowedConsoles: GameConsole[];

  @Prop({ type: [TeamSchema], default: [] })
  teams: Team[];

  // --- Format-specific stages (exactly one populated per `format`) -------

  /** Populated when format = SINGLE_ELIMINATION, or as stage 2 of
   *  GROUP_STAGE_PLUS_ELIMINATION / SWISS_PLUS_ELIMINATION. */
  @Prop({ type: KnockoutStageSchema })
  knockoutStage?: KnockoutStage;

  /** Populated when format = GROUP_STAGE_PLUS_ELIMINATION. */
  @Prop({ type: GroupStageSchema })
  groupStage?: GroupStage;

  /** Populated when format = LEAGUE. */
  @Prop({ type: LeagueStageSchema })
  leagueStage?: LeagueStage;

  /** Populated when format = SWISS_PLUS_ELIMINATION. */
  @Prop({ type: SwissStageSchema })
  swissStage?: SwissStage;

  /**
   * Optional standalone 3rd-place match when it does not naturally belong
   * inside a Bracket (kept here only as a fallback slot; formats that use
   * Bracket.thirdPlaceMatch/hasThirdPlaceMatch should prefer that field —
   * this exists so a 3rd-place decider is always representable even for
   * stages that don't wrap a full Bracket).
   */
  @Prop({ type: MatchSchema })
  thirdPlaceMatch?: Match;

  @Prop()
  startedAt?: Date;

  @Prop()
  finishedAt?: Date;

  // createdAt and updatedAt are injected automatically by { timestamps: true }
}

export const TournamentSchema = SchemaFactory.createForClass(Tournament);

// --- Indexes -----------------------------------------------------------
// Primary access pattern: "list this user's tournaments, optionally
// filtered by status", used for dashboards/history views.
TournamentSchema.index({ ownerId: 1, status: 1 });
// Secondary: recency-ordered listing of a user's tournaments.
TournamentSchema.index({ ownerId: 1, createdAt: -1 });
