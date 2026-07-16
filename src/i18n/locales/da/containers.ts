export const containersDa = {
  title: 'Containere',
  subtitle: 'Verdenskister og tønder der genopfyldes på timer.',
  subtitleHint:
    'Placér containere ved faste koordinater. Lageret kan indeholde vanilla- eller brugerdefinerede quest-genstande. Genopfyldning tømmer inventaret først.',

  overworld: 'Overworld',

  list: {
    title: 'Containere ({{count}})',
    empty:
      'Ingen verdenscontainere endnu. Tilføj en kiste eller tønde til genopfyldning i verdenen.',
    add: 'Tilføj container',
    deleteConfirm: 'Slet denne verdenscontainer?',
    selectEmpty: 'Vælg en container fra listen.',
    untitled: 'Unavngivet',
  },

  editor: {
    name: 'Containernavn',
    blockType: 'Bloktype',
    location: 'Placering',
    coordsHint: 'Blokkoordinater hvor containeren placeres.',
    dimension: 'Dimension',
    refillInterval: 'Genopfyldningsinterval (sekunder)',
    refillHint: 'Hvor ofte containeren tømmes og genopfyldes. Minimum 1 sekund.',
    stock: 'Lager',
    stockHint:
      'Genstande der lægges i containeren ved hver genopfyldning (chance og antal pr. post).',
    addStock: 'Tilføj genstand',
    emptyStock: 'Ingen lagergenstande endnu — genopfyldninger efterlader containeren tom.',
    blockChest: 'Kiste',
    blockTrappedChest: 'Fældet kiste',
    blockBarrel: 'Tønde',
  },
} as const;
