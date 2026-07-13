import { GameConsole } from '../schemas/common/console.enum';
import { GroupStage } from '../schemas/group-stage.schema';
import { KnockoutStage } from '../schemas/knockout-stage.schema';
import { LeagueStage } from '../schemas/league.schema';
import { Match } from '../schemas/common/match.schema';
import { SwissStage } from '../schemas/swiss-stage.schema';

/**
 * Minimal shape needed to walk every embedded match in a tournament,
 * regardless of format/phase, to count how many already have a console
 * assigned (see `Match.assignedConsole` doc).
 */
export interface MatchContainer {
  leagueStage?: LeagueStage;
  groupStage?: GroupStage;
  swissStage?: SwissStage;
  knockoutStage?: KnockoutStage;
  thirdPlaceMatch?: Match;
}

/** Every embedded Match subdocument across every phase/format, in no particular order. */
export function collectAllMatches(tournament: MatchContainer): Match[] {
  const matches: Match[] = [];

  if (tournament.leagueStage) {
    for (const md of tournament.leagueStage.matchdays) {
      matches.push(...md.matches);
    }
    matches.push(...tournament.leagueStage.tiebreakMatches);
  }

  if (tournament.groupStage) {
    for (const group of tournament.groupStage.groups) {
      matches.push(...group.matches);
      matches.push(...group.tiebreakMatches);
    }
  }

  if (tournament.swissStage) {
    for (const round of tournament.swissStage.rounds) {
      matches.push(...round.matches);
    }
    matches.push(...tournament.swissStage.playIn);
  }

  if (tournament.knockoutStage) {
    for (const round of tournament.knockoutStage.bracket.rounds) {
      matches.push(...round.matches);
    }
    if (tournament.knockoutStage.bracket.thirdPlaceMatch) {
      matches.push(tournament.knockoutStage.bracket.thirdPlaceMatch);
    }
  }

  if (tournament.thirdPlaceMatch) {
    matches.push(tournament.thirdPlaceMatch);
  }

  return matches;
}

/**
 * Deterministic round-robin console assigner: `consoleUnits` is the physical
 * inventory (duplicates allowed, see Tournament.consoleUnits doc); the Nth
 * match to ever receive an assignment (0-based, counted across every phase
 * of the tournament, in insertion order) gets `consoleUnits[N % length]`.
 * Because assignment is persisted once made and never re-computed for an
 * already-assigned match, repeating this process is idempotent: passing the
 * current count in and bumping it for each newly-assigned match reproduces
 * the same sequence every time.
 */
export class ConsoleAssigner {
  private nextIndex: number;

  constructor(
    private readonly consoleUnits: GameConsole[],
    alreadyAssignedCount: number,
  ) {
    if (consoleUnits.length === 0) {
      throw new Error('consoleUnits must not be empty');
    }
    this.nextIndex = alreadyAssignedCount % consoleUnits.length;
  }

  /** Assigns (and returns) the next console in the rotation. */
  next(): GameConsole {
    const console_ =
      this.consoleUnits[this.nextIndex % this.consoleUnits.length];
    this.nextIndex++;
    return console_;
  }
}

/**
 * Ensures `match.assignedConsole` is set, assigning the next console in the
 * rotation if it's missing. Returns the (possibly pre-existing) console.
 */
export function ensureAssignedConsole(
  match: Match,
  assigner: ConsoleAssigner,
): GameConsole {
  if (!match.assignedConsole) {
    match.assignedConsole = assigner.next();
  }
  return match.assignedConsole;
}
