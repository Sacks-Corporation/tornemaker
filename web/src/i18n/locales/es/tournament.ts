const tournament = {
  wizard: {
    back: 'Atrás',
    next: 'Siguiente',
    stepIndicator: 'Paso {{current}} de {{total}}',
  },
  formats: {
    LEAGUE: {
      title: 'Liga',
      description: 'Todos los equipos se enfrentan entre sí y se define una tabla de posiciones.',
    },
    SINGLE_ELIMINATION: {
      title: 'Eliminatorias',
      description: 'Cruces directos a eliminación simple hasta llegar a la final.',
    },
    GROUP_STAGE_PLUS_ELIMINATION: {
      title: 'Fase de grupos + Eliminatorias',
      description: 'Los equipos se dividen en grupos y los mejores avanzan a playoffs.',
    },
    SWISS_PLUS_ELIMINATION: {
      title: 'Suizo',
      description: 'Rondas emparejadas por rendimiento, seguidas de una fase de eliminación.',
    },
  },
  matchModes: {
    '1v1': '1 vs 1',
    '2v2': '2 vs 2',
    '3v3': '3 vs 3',
  },
  consoleTypes: {
    PLAY_2: 'Play 2',
    PLAY_3: 'Play 3',
    PLAY_4: 'Play 4',
    PLAY_5: 'Play 5',
  },
  yesNo: {
    yes: 'Sí',
    no: 'No',
  },
  steps: {
    format: {
      title: 'Elegí el formato del torneo',
      subtitle: 'Definí cómo se van a disputar los partidos.',
    },
    parameters: {
      title: 'Parámetros del torneo',
      selectedFormatLabel: 'Formato seleccionado',
      name: {
        label: 'Nombre del torneo',
        placeholder: 'Nombre del torneo',
        defaultName: 'Torneo de {{userName}} {{date}}',
      },
      teamCount: {
        label: 'Cantidad de equipos',
        placeholder: 'Seleccioná la cantidad de equipos',
      },
      groupSize: {
        label: 'Tamaño de grupo',
        placeholder: 'Seleccioná el tamaño de grupo',
      },
      twoLegged: {
        label: 'Ida y vuelta',
      },
      thirdPlaceMatch: {
        label: 'Partido por el tercer puesto',
      },
      matchMode: {
        label: 'Modalidad',
      },
      consoleCount: {
        label: 'Cantidad de consolas',
        placeholder: 'Seleccioná la cantidad de consolas',
      },
      consoleType: {
        label: 'Consola {{index}}',
      },
    },
    teams: {
      title: 'Cargá los equipos',
      teamLabel: 'Equipo {{index}}',
      teamPlaceholder: 'Nombre del equipo',
      aiAlert:
        'Si la cantidad de equipos no coincide con la cantidad de jugadores, los equipos restantes serán completados con partidos contra la IA.',
      assignedNote: 'En este formato todos los equipos deberán tener jugadores asignados.',
      errors: {
        required: 'Completá el nombre de todos los equipos.',
        duplicate: 'No puede haber equipos con el mismo nombre.',
      },
    },
    players: {
      title: 'Cargá los jugadores',
      matchModeLegend: 'Los jugadores se cargan de a {{perTeam}} por equipo.',
      playerLabel: 'Jugador {{index}}',
      playerPlaceholder: 'Nombre del jugador',
      aiLegend: 'Si hay menos jugadores que equipos, los equipos restantes serán controlados por la IA/Máquina.',
      assignedLegend: 'En este formato todos los equipos deberán tener jugadores asignados.',
      errors: {
        duplicate: 'No puede haber jugadores con el mismo nombre.',
        notMultipleOfPerTeam: 'La cantidad de jugadores cargados debe ser múltiplo de la modalidad elegida.',
        allRequired: 'En este formato todos los jugadores deben estar completos.',
      },
    },
    assignmentModal: {
      title: '¿Cómo desea realizar la asignación de equipos con jugadores?',
      manual: 'Manual',
      draw: 'Sorteo',
      roulette: 'Ruleta',
      rouletteComingSoon: 'Próximamente',
      cancel: 'Cancelar',
      confirm: 'Confirmar',
    },
    teamPlayers: {
      title: 'Asigná los jugadores a cada equipo',
      unassignedTitle: 'Jugadores sin asignar',
      noUnassigned: 'No quedan jugadores sin asignar.',
      teamLabel: 'Equipo {{index}}',
      slotLabel: 'Jugador {{index}}',
      slotPlaceholder: 'Elegí un jugador',
      aiTeam: 'Equipo controlado por IA',
      markAsAi: 'Dejar sin jugadores (IA)',
      errors: {
        pendingPlayers: 'Todavía quedan jugadores sin asignar a un equipo.',
      },
    },
    confirmation: {
      title: 'Confirmá los datos del torneo',
      formatLabel: 'Formato',
      nameLabel: 'Nombre',
      teamCountLabel: 'Cantidad de equipos',
      groupSizeLabel: 'Tamaño de grupo',
      twoLeggedLabel: 'Ida y vuelta',
      thirdPlaceMatchLabel: 'Partido por el tercer puesto',
      matchModeLabel: 'Modalidad',
      consolesLabel: 'Consolas',
      teamsLabel: 'Equipos',
      aiTeam: 'IA',
      submit: 'Crear torneo',
      submitting: 'Creando torneo…',
      errors: {
        generic: 'Ocurrió un error al crear el torneo. Intentá de nuevo.',
      },
    },
  },
  list: {
    title: 'Torneos guardados',
    loading: 'Cargando torneos…',
    loadError: 'No pudimos cargar tus torneos. Intentá de nuevo más tarde.',
    teamCount: '{{count}} equipos',
    createdAt: 'Creado el {{date}}',
    status: {
      EN_PROGRESO: 'En progreso',
      TERMINADO: 'Terminado',
    },
    empty: {
      title: 'Todavía no tenés torneos',
      subtitle: 'Creá tu primer torneo para empezar a organizar partidos.',
      cta: 'Crear torneo',
    },
  },
  tournamentPage: {
    loading: 'Cargando torneo…',
    loadError: 'No pudimos cargar el torneo. Intentá de nuevo más tarde.',
    placeholderTeam: 'Por definirse',
    finished: {
      title: 'Torneo terminado',
      champion: 'Campeón: {{team}}',
    },
    phases: {
      LEAGUE: 'Liga',
      GROUPS: 'Fase de grupos',
      SWISS: 'Fase suiza',
      KNOCKOUTS: 'Eliminación',
      PLAY_IN: 'Play-in',
      TIEBREAK: 'Desempate',
      THIRD_PLACE: 'Tercer puesto',
    },
    tabs: {
      groupStage: 'Fase de grupos',
      swissStage: 'Fase suiza',
      knockout: 'Eliminación',
      lockedHint: 'Se habilita cuando termine la fase anterior.',
    },
    upcomingBar: {
      title: 'Próximos partidos',
      empty: 'No hay partidos disponibles para cargar en este momento.',
      legFirst: 'Ida',
      legSecond: 'Vuelta',
      firstLegResult: 'Ida: {{home}} - {{away}}',
      console: 'Consola: {{console}}',
      loadResult: 'Cargar resultado',
    },
    standings: {
      columns: {
        rank: 'Pos',
        team: 'Equipo',
        played: 'PJ',
        won: 'V',
        drawn: 'E',
        lost: 'D',
        goalsFor: 'GF',
        goalsAgainst: 'GC',
        goalDifference: 'DG',
        points: 'Pts',
      },
      tiebreakTitle: 'Partidos de desempate',
    },
    bracket: {
      penalties: 'Definido por penales',
      walkover: 'Walkover',
      thirdPlaceTitle: 'Tercer puesto',
      championTitle: 'Campeón',
      leg: {
        first: 'Ida',
        second: 'Vuelta',
      },
    },
    swissBoard: {
      roundTitle: 'Ronda {{number}}',
      playInTitle: 'Play-in',
      record: '{{wins}}V - {{losses}}D',
      penalties: 'Penales: ganó {{team}}',
      qualified: 'Clasificado',
      eliminated: 'Eliminado',
      empty: 'La fase suiza todavía no tiene rondas disponibles.',
    },
    resultModal: {
      title: 'Cargar resultado',
      homeGoalsLabel: 'Goles de {{team}}',
      awayGoalsLabel: 'Goles de {{team}}',
      aggregateValue: 'Global (ida + vuelta): {{home}} - {{away}}',
      penaltiesQuestion: '¿Quién ganó por penales?',
      cancel: 'Cancelar',
      continue: 'Continuar',
      back: 'Volver',
      confirmTitle: 'Confirmá el resultado',
      confirmWarning: 'Una vez confirmado, el resultado no se va a poder editar.',
      confirmButton: 'Confirmar resultado',
      submitting: 'Guardando…',
      errors: {
        invalidScore: 'Ingresá un resultado válido para ambos equipos.',
        penaltyRequired: 'Elegí qué equipo ganó por penales.',
        generic: 'Ocurrió un error al cargar el resultado. Intentá de nuevo.',
      },
    },
    snackbar: {
      success: 'Partido cargado satisfactoriamente',
    },
  },
} as const

export default tournament
