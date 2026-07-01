export const platformEn = {
  installGuide: {
    common: {
      spawnNpcs:
        'Spawn your NPCs: run "/function {{namespace}}:setup_guide" to see the spawn commands, or run "/function {{namespace}}:spawn_all" while standing where you want player-located NPCs.',
      verify: 'Verify everything with "/function {{namespace}}:debug".',
    },

    paper: {
      title: 'Install on a PaperMC server',
      step1: 'Stop the server (or be ready to run /reload).',
      step2: 'Copy the datapack ZIP into <world>/datapacks/ on the server.',
      step3: 'Start the server, or run /reload in the console/in-game.',
      step4:
        'Optional: install Vault + an economy plugin and LuckPerms for money/permission rewards.',
    },

    vanilla: {
      title: 'Install on a Vanilla server',
      step1: 'Stop the server (or be ready to run /reload).',
      step2: 'Copy the datapack ZIP into <world>/datapacks/.',
      step3: 'Start the server, or run /reload.',
      step4:
        'Money is tracked with an internal scoreboard; permission rewards show a chat message only.',
    },

    lan: {
      title: 'Install for a single-player world (Open to LAN)',
      step1: 'Find your world save folder (Singleplayer > Edit > Open World Folder).',
      step2: 'Copy the datapack ZIP into the saves/<world>/datapacks/ folder.',
      step3:
        'Load the world and run /reload (enable cheats once to reload; players do not need cheats to play quests).',
      step4: 'Use Open to LAN to play with friends.',
    },
  },

  rewardNotes: {
    moneyVanilla: 'Money uses an internal scoreboard on Vanilla/LAN (no real economy plugin).',
    permissionPaper:
      'Permission rewards require a permissions plugin (Paper). A chat message is shown instead.',
  },
} as const;
