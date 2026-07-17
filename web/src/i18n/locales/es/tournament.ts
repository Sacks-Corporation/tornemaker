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
        numberPlaceholder: 'Ingresá la cantidad de equipos',
        loadingLabel: 'Cargando cantidades disponibles…',
        errors: {
          range: 'Ingresá un número entero entre {{min}} y {{max}}.',
        },
      },
      groupCap: {
        label: 'Tope de equipos por grupo',
        placeholder: 'Ingresá el tope de equipos por grupo',
        errors: {
          min: 'El tope debe ser un número entero de al menos {{min}} equipos.',
          invalidCombination:
            'Con esa cantidad de equipos y ese tope no se pueden formar al menos 2 grupos de 3 equipos o más. Probá con otro tope.',
        },
      },
      aiFill: {
        label: 'Relleno con IA',
        description:
          'Completa automáticamente los equipos que falten con IA hasta llegar a una cantidad válida para el formato.',
      },
      preview: {
        title: 'Vista previa de la configuración',
        preliminaryRound: '{{count}} equipos juegan la ronda preliminar',
        byeSingular: '1 equipo pasa directo a la siguiente ronda',
        byePlural: '{{count}} equipos pasan directo a la siguiente ronda',
        groups: '{{count}} grupos: {{sizes}}',
        aiFill: 'Se agregarán {{count}} equipos IA (total {{total}})',
      },
      twoLegged: {
        label: 'Ida y vuelta',
      },
      thirdPlaceMatch: {
        label: 'Partido por el tercer puesto',
      },
      matchMode: {
        label: 'Modalidad',
        loadingLabel: 'Cargando modalidades…',
      },
      consoleCount: {
        label: 'Cantidad de consolas',
        placeholder: 'Seleccioná la cantidad de consolas',
        loadingLabel: 'Cargando consolas…',
      },
      consoleType: {
        label: 'Consola {{index}}',
        loadingLabel: 'Cargando consolas…',
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
      groupCapLabel: 'Tope de equipos por grupo',
      aiFillLabel: 'Relleno con IA',
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
    card: {
      deleteLabel: 'Eliminar torneo',
    },
    deleteModal: {
      title: 'Eliminar torneo',
      message: '¿Estás seguro que quieres borrar {{name}}? La acción no podrá deshacerse.',
      cancel: 'Cancelar',
      confirm: 'Eliminar',
      confirming: 'Eliminando…',
      errors: {
        generic: 'Ocurrió un error al eliminar el torneo. Intentá de nuevo.',
      },
    },
    snackbar: {
      success: 'El torneo se eliminó correctamente',
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
      loading: 'Cargando próximos partidos…',
      empty: 'No hay partidos disponibles para cargar en este momento.',
      legFirst: 'Ida',
      legSecond: 'Vuelta',
      firstLegResult: 'Ida: {{home}} - {{away}}',
      console: 'Consola: {{console}}',
      loadResult: 'Cargar resultado',
      resetButton: 'Resetear torneo',
    },
    resetModal: {
      title: 'Resetear torneo',
      message:
        'Resetear el torneo reiniciará todos los partidos como si el torneo no se hubiese jugado. Esta acción no puede deshacerse.',
      cancel: 'Cancelar',
      confirm: 'Resetear',
      confirming: 'Reseteando…',
      errors: {
        generic: 'Ocurrió un error al resetear el torneo. Intentá de nuevo.',
      },
      snackbar: {
        success: 'El torneo se reseteó correctamente',
      },
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
