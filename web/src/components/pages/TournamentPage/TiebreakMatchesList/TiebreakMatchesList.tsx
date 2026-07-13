export interface TiebreakMatchView {
  matchId: string
  homeName: string
  awayName: string
  scoreLabel: string
}

export interface TiebreakMatchesListProps {
  title: string
  matches: TiebreakMatchView[]
}

// Lista simple de partidos de desempate (LEAGUE/GROUPS). Solo pinta lo que
// devuelve el back; no calcula quién desempata a quién.
function TiebreakMatchesList({ title, matches }: TiebreakMatchesListProps) {
  if (matches.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-sm font-semibold text-text">{title}</h4>
      <ul className="flex flex-col gap-2">
        {matches.map((match) => (
          <li
            key={match.matchId}
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <span className="text-text">
              {match.homeName} <span className="text-text-muted">vs</span> {match.awayName}
            </span>
            <span className="font-semibold text-text">{match.scoreLabel}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default TiebreakMatchesList
