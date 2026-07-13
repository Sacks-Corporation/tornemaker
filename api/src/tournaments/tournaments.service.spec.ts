import { NotFoundException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { UtilsService } from '../utils/utils.service';
import { buildGroupStage } from './draw/group-fixtures';
import { buildKnockoutStage } from './draw/knockout-fixtures';
import { buildLeagueStage } from './draw/league-fixtures';
import { buildSwissStage } from './draw/swiss-fixtures';
import { DrawService } from './draw/draw.service';
import { makeSeededTeams } from './draw/test-helpers';
import { MatchProgressionService } from './progression/match-progression.service';
import { MatchStatus } from './schemas/common/match-status.enum';
import { Team } from './schemas/common/team.schema';
import { TournamentFormat } from './schemas/common/tournament-format.enum';
import { TournamentState } from './schemas/common/tournament-state.enum';
import {
  Tournament,
  TournamentDocument,
  TournamentStatus,
} from './schemas/tournament.schema';
import { TournamentsService } from './tournaments.service';

function toTeams(seeded: ReturnType<typeof makeSeededTeams>): Team[] {
  return seeded.map((t) => ({
    teamId: t.teamId,
    name: t.name,
    playerNames: t.playerNames,
    seed: t.seed,
  }));
}

/** Builds a fake persisted TournamentDocument (plain object + a jest `save`
 *  spy), mirroring the `baseTournament` helper used in
 *  match-progression.service.spec.ts. Returns the spy separately so
 *  assertions never read `tournament.save` as an unbound method reference. */
function baseTournament(
  ownerId: Types.ObjectId,
  overrides: Partial<Tournament>,
): { tournament: TournamentDocument; saveSpy: jest.Mock } {
  const saveSpy = jest.fn().mockResolvedValue(undefined);
  const tournament = {
    _id: new Types.ObjectId(),
    ownerId,
    name: 'Test tournament',
    status: TournamentStatus.EN_PROGRESO,
    matchMode: '1v1',
    consoleUnits: ['PLAY_5'],
    allowedConsoles: ['PLAY_5'],
    teams: [],
    save: saveSpy,
    ...overrides,
  } as unknown as TournamentDocument;
  return { tournament, saveSpy };
}

/** Builds a TournamentsService wired with the REAL DrawService (reset must
 *  reuse it, not reimplement drawing) and a fake model whose `findOne`
 *  resolves to `tournament` (or `null`). */
function makeService(tournament: TournamentDocument | null) {
  const findOne = jest.fn().mockResolvedValue(tournament);
  const model = { findOne } as unknown as Model<TournamentDocument>;
  // None of the specs below exercise `create()`, so UtilsService is never
  // actually called — a bare stub satisfies the constructor's dependency.
  const utilsService = {} as UtilsService;
  const service = new TournamentsService(
    model,
    new DrawService(),
    new MatchProgressionService(),
    utilsService,
  );
  return { service, findOne };
}

describe('TournamentsService.resetForOwner', () => {
  const ownerId = new Types.ObjectId();

  it('404s when the tournament does not exist / is not owned / is DELETED (delegated to findOwnedTournamentOrThrow)', async () => {
    const { service } = makeService(null);
    await expect(
      service.resetForOwner(
        ownerId.toString(),
        new Types.ObjectId().toString(),
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('resets a FINISHED LEAGUE tournament back to LEAGUE with fresh fixtures and zeroed standings', async () => {
    const seeded = makeSeededTeams(4);
    const teams = toTeams(seeded);
    const leagueStage = buildLeagueStage(seeded, true);
    const originalTeamIds = teams.map((t) => t.teamId.toString());

    const { tournament, saveSpy } = baseTournament(ownerId, {
      format: TournamentFormat.LEAGUE,
      state: TournamentState.FINISHED,
      status: TournamentStatus.TERMINADO,
      teams,
      leagueStage,
      startedAt: new Date(),
      finishedAt: new Date(),
    });
    // Simulate a finished league: mark every match as played + non-zero standings.
    for (const md of tournament.leagueStage!.matchdays) {
      for (const m of md.matches) {
        m.status = MatchStatus.PLAYED;
      }
    }
    tournament.leagueStage!.standings[0].played = 6;

    const { service, findOne } = makeService(tournament);
    const result = await service.resetForOwner(
      ownerId.toString(),
      tournament._id.toString(),
    );

    expect(findOne).toHaveBeenCalledWith(
      expect.objectContaining({ state: { $ne: TournamentState.DELETED } }),
    );
    expect(saveSpy).toHaveBeenCalled();

    // Metadata untouched.
    expect(tournament.name).toBe('Test tournament');
    expect(tournament.format).toBe(TournamentFormat.LEAGUE);

    // Playable part reset.
    expect(tournament.state).toBe(TournamentState.LEAGUE);
    expect(tournament.status).toBe(TournamentStatus.EN_PROGRESO);
    expect(tournament.startedAt).toBeUndefined();
    expect(tournament.finishedAt).toBeUndefined();
    expect(
      tournament.leagueStage!.matchdays.every((md) =>
        md.matches.every((m) => m.status === MatchStatus.SCHEDULED),
      ),
    ).toBe(true);
    expect(tournament.leagueStage!.standings.every((s) => s.played === 0)).toBe(
      true,
    );
    // Two-legged draw option was preserved from the persisted leagueStage.
    expect(tournament.leagueStage!.doubleRound).toBe(true);

    // Same team names/players, but brand-new teamIds (a fresh draw).
    expect(tournament.teams.map((t) => t.name).sort()).toEqual(
      teams.map((t) => t.name).sort(),
    );
    expect(
      tournament.teams.every(
        (t) => !originalTeamIds.includes(t.teamId.toString()),
      ),
    ).toBe(true);

    // Response contract: same shape as GET /tournaments/:id.
    expect(result._id).toBe(tournament._id.toString());
    expect(result.state).toBe(TournamentState.LEAGUE);
  });

  it('resets a KNOCKOUTS SINGLE_ELIMINATION tournament back to KNOCKOUTS, preserving twoLegged/thirdPlaceMatch options', async () => {
    const seeded = makeSeededTeams(4);
    const teams = toTeams(seeded);
    const knockoutStage = buildKnockoutStage(seeded, true, true);

    const { tournament } = baseTournament(ownerId, {
      format: TournamentFormat.SINGLE_ELIMINATION,
      state: TournamentState.KNOCKOUTS,
      teams,
      knockoutStage,
    });

    const { service } = makeService(tournament);
    await service.resetForOwner(ownerId.toString(), tournament._id.toString());

    expect(tournament.state).toBe(TournamentState.KNOCKOUTS);
    expect(tournament.knockoutStage!.bracket.isTwoLegged).toBe(true);
    expect(tournament.knockoutStage!.bracket.hasThirdPlaceMatch).toBe(true);
    expect(tournament.knockoutStage!.bracket.championTeamId).toBeUndefined();
  });

  it('resets a tournament that already progressed past GROUPS into KNOCKOUTS, still recovering thirdPlaceMatch=true from the consumed standalone slot', async () => {
    const seeded = makeSeededTeams(6);
    const teams = toTeams(seeded);
    const groupStage = buildGroupStage(seeded, 3, false);
    // Simulate MatchProgressionService.finishGroupStage: bracket already
    // built with a 3rd place match, and the standalone slot consumed/cleared.
    const bracketSeeded = makeSeededTeams(4);
    const knockoutStage = buildKnockoutStage(bracketSeeded, false, true);

    const { tournament } = baseTournament(ownerId, {
      format: TournamentFormat.GROUP_STAGE_PLUS_ELIMINATION,
      state: TournamentState.KNOCKOUTS,
      teams,
      groupStage,
      knockoutStage,
      thirdPlaceMatch: undefined,
    });

    const { service } = makeService(tournament);
    await service.resetForOwner(ownerId.toString(), tournament._id.toString());

    expect(tournament.state).toBe(TournamentState.GROUPS);
    expect(tournament.knockoutStage).toBeUndefined();
    expect(tournament.groupStage).toBeDefined();
    expect(tournament.thirdPlaceMatch).toBeDefined();
  });

  it('resets a SWISS_PLUS_ELIMINATION tournament back to SWISS with fresh participants', async () => {
    const seeded = makeSeededTeams(4);
    const teams = toTeams(seeded);
    const swissStage = buildSwissStage(seeded, true);
    swissStage.participants[0].wins = 3;
    swissStage.participants[0].isQualified = true;

    const { tournament } = baseTournament(ownerId, {
      format: TournamentFormat.SWISS_PLUS_ELIMINATION,
      state: TournamentState.SWISS,
      teams,
      swissStage,
    });

    const { service } = makeService(tournament);
    await service.resetForOwner(ownerId.toString(), tournament._id.toString());

    expect(tournament.state).toBe(TournamentState.SWISS);
    expect(tournament.swissStage!.knockoutTwoLegged).toBe(true);
    expect(
      tournament.swissStage!.participants.every(
        (p) => p.wins === 0 && !p.isQualified,
      ),
    ).toBe(true);
  });
});
