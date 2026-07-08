import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

/**
 * A team entry inside a tournament.
 *
 * Teams are entirely user-defined per tournament (no closed catalog — the
 * organizer types in whatever club/national team name they want, e.g. a
 * FIFA/EA Sports FC club). A team MAY optionally be linked to a real player
 * (a person), depending on the format:
 *   - League: every team MUST have a player.
 *   - Swiss: every team MUST have a player (score is tracked per player/team).
 *   - Single elimination / group stage: players are optional (a team can be
 *     "CPU vs CPU" or represent a player who plays multiple teams, etc.).
 *
 * Teams are embedded inside the Tournament document (not a separate
 * collection) because they only make sense in the context of a single
 * tournament, are never queried independently, and are small in number
 * (max 32). Each team gets its own stable `teamId` (a Mongo ObjectId
 * generated at creation time) so it can be referenced from matches,
 * standings and bracket slots that live in sibling embedded structures
 * without relying on Mongoose's array-subdocument `_id`.
 */
@Schema({ _id: false })
export class Team {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  teamId: Types.ObjectId;

  /** Free-text club/national team name, defined by the organizer. */
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  logoUrl?: string;

  /**
   * Display names of the real person/people playing this team, in team-order
   * (length matches the tournament's `matchMode`: 1 for 1v1, 2 for 2v2, 3 for
   * 3v3). An EMPTY array means this team is not linked to any player and is
   * controlled by the CPU/AI — only allowed for formats where AI teams are
   * permitted (see tournament.schema.ts / format validation at the service
   * layer; League and Swiss+elimination require every team to be assigned).
   */
  @Prop({ type: [String], default: [] })
  playerNames: string[];

  /**
   * Optional link to a registered platform user, in case the player also
   * has a Tornemaker account. Not required — most players will just be a
   * free-text playerName.
   */
  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;

  /** Seed / pot number used to build the initial bracket or group draw. */
  @Prop()
  seed?: number;
}

export const TeamSchema = SchemaFactory.createForClass(Team);
