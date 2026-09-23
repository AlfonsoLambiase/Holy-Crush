export const CandyCrushAssetConf = {
  scene: {
    boot: "boot",
    verse: "verse",
    game: "game",
    timerManager: "timerManager",
    exitManager: "exitManager",
    gameManager: "gameManager",
    outro: "outro",
  },
  audio: {
    music: "music",
    success: "success",
    error: "error",
    help: "help",
    endWin: "endWin",
    endFailed: "endFailed",
    missile: "missile",
    explosion: "explosion",
    fill: "fill",
  } as const,
  image: {
    // for timerManager
    iconSandClock: "iconSandClock",

    // for game
    backgroundGame: "backgroundGame",
    backgroundScore: "backgroundScore",
    //logo_stage: "logo_stage",
    iconHelp: "iconHelp",
    iconScore: "iconScore",
    iconLive: "iconLive",
    logoPhaser: "logoPhaser", //! Solo per test
    endWin: "endWin",
    endFailed: "endFailed",
    endBackground: "endBackground",

    // for specific game
    backgroundGriglia: "backgroundGriglia",
    block: "block",
    obj_0_0: "obj_0_0",
    obj_1_0: "obj_1_0",
    obj_2_0: "obj_2_0",
    obj_3_0: "obj_3_0",
    rocket: "rocket",
    bomb: "bomb",

    // for exitManager
    btnExitGame: "btnExitGame",
    btnConfirm: "btnConfirm",
    btnCancel: "btnCancel",
    popupExitGame: "popupExitGame",
    containerScore: "containerScore",
  },
  spritesheet: {
    // for confetti - fine partita
    confetti_left: {
      frameWidth: 195,
      frameHeight: 177.5,
      key: "confetti_left",
    },
    confetti_right: {
      frameWidth: 195,
      frameHeight: 177.5,
      key: "confetti_right",
    },

    // for starsEffect
    starsEffect: {
      // 20
      frameWidth: 184,
      frameHeight: 184,
      key: "starsEffect",
    },

    // for animLive
    animLive: {
      // 41
      frameWidth: 128,
      frameHeight: 256,
      key: "animLive",
    },

    // for brokenHeartAnim
    animBrokenHeart: {
      // 27
      frameWidth: 128,
      frameHeight: 104,
      key: "animBrokenHeart",
    },
  },
  keyAnim: {
    // for starsEffect
    animStars: "animStars",
  },
  font: {
    "CinzelDecorative-Regular": "Cinzel Decorative",
  },
  registry: {
    score: "score",
    coins: "coins",
    timer: "timer",
  },
};
