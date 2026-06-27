export const platformDa = {
  installGuide: {
    common: {
      spawnNpcs:
        'Spawn dine NPC\'er: kør "/function {{namespace}}:setup_guide" for at se spawn-kommandoerne, eller kør "/function {{namespace}}:spawn_all" mens du står hvor du vil have spillerplacerede NPC\'er.',
      verify: 'Verificér alt med "/function {{namespace}}:debug".',
    },

    paper: {
      title: 'Installation på en PaperMC-server',
      step1: 'Stop serveren (eller vær klar til at køre /reload).',
      step2: 'Kopiér datapack-ZIP\'en til <world>/datapacks/ på serveren.',
      step3: 'Start serveren, eller kør /reload i konsollen/in-game.',
      step4:
        'Valgfrit: installér Vault + et økonomi-plugin og LuckPerms til penge-/tilladelsesbelønninger.',
    },

    vanilla: {
      title: 'Installation på en Vanilla-server',
      step1: 'Stop serveren (eller vær klar til at køre /reload).',
      step2: 'Kopiér datapack-ZIP\'en til <world>/datapacks/.',
      step3: 'Start serveren, eller kør /reload.',
      step4:
        'Penge spores med et internt scoreboard; tilladelsesbelønninger viser kun en chatbesked.',
    },

    lan: {
      title: 'Installation til singleplayer-verden (Åben for LAN)',
      step1:
        'Find din verdens gemmemappe (Singleplayer > Rediger > Åbn verdensmappe).',
      step2: 'Kopiér datapack-ZIP\'en til mappen saves/<world>/datapacks/.',
      step3:
        'Indlæs verdenen og kør /reload (aktivér snydekoder én gang for at reload; spillere behøver ikke snydekoder for at spille quests).',
      step4: 'Brug Åben for LAN for at spille med venner.',
    },
  },

  rewardNotes: {
    moneyVanilla:
      'Penge bruger et internt scoreboard på Vanilla/LAN (intet rigtigt økonomi-plugin).',
    permissionPaper:
      'Tilladelsesbelønninger kræver et tilladelses-plugin (Paper). En chatbesked vises i stedet.',
  },
} as const;
