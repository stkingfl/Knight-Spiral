const OEIS_A392177_PREFIX = [
  0, 2, 5, 9, 11, 15, 20, 21, 30, 31, 36, 40, 42, 47, 48, 50, 56, 61, 65,
  67, 69, 70, 71, 75, 76, 81, 83, 85, 87, 89, 93, 99, 109, 110, 111, 112,
  116, 117, 126, 132, 133, 138, 144, 148, 150, 152, 154, 156, 161, 162, 176,
  180, 182, 187, 193, 197, 199, 201, 203, 205, 207, 208, 209, 211, 213, 214,
  219, 229, 231, 233, 235, 237, 238, 239, 243,
];

const MIN_ZOOM = 0.12;
const MAX_ZOOM = 48;
const ZOOM_STEP = 1.28;
const MAX_QUEUE_LENGTH = 5;
const DEFAULT_QUEUE = ["knight", "knight"];
const TILE_CELLS = 32;
const TILE_INDEX_CHUNK = 60000;
const RIDER_STEP_CAP = 25_000;
const RIDER_WARNING_STEPS = 5_000;

const MOVE_SETS = {
  wazir: symmetricLeapers([[1, 0]]),
  ferz: symmetricLeapers([[1, 1]]),
  alfil: symmetricLeapers([[2, 2]]),
  dabbaba: symmetricLeapers([[2, 0]]),
  knight: symmetricLeapers([[1, 2]]),
  camel: symmetricLeapers([[1, 3]]),
  zebra: symmetricLeapers([[2, 3]]),
  giraffe: symmetricLeapers([[1, 4]]),
  antelope: symmetricLeapers([[3, 4]]),
};

MOVE_SETS.mann = mergeVectors(MOVE_SETS.wazir, MOVE_SETS.ferz);
MOVE_SETS.alibaba = mergeVectors(MOVE_SETS.alfil, MOVE_SETS.dabbaba);
MOVE_SETS.squirrel = mergeVectors(MOVE_SETS.knight, MOVE_SETS.alfil, MOVE_SETS.dabbaba);

const RIDER_SETS = {
  rook: symmetricRiders([[1, 0]]),
  bishop: symmetricRiders([[1, 1]]),
  queen: symmetricRiders([[1, 0], [1, 1]]),
  nightrider: symmetricRiders([[1, 2]]),
  camelrider: symmetricRiders([[1, 3]]),
  zebrarider: symmetricRiders([[2, 3]]),
  alfilrider: symmetricRiders([[2, 2]]),
  dabbabarider: symmetricRiders([[2, 0]]),
  alibabarider: symmetricRiders([[2, 2], [2, 0]]),
};

const PIECE_CATALOG = [
  piece("knight", "Knight", "N", "Leaper: (1,2)", MOVE_SETS.knight),
  piece("king", "King / Mann", "K", "Leaper: one square in any direction", MOVE_SETS.mann),
  piece("wazir", "Wazir", "W", "Leaper: one square orthogonally", MOVE_SETS.wazir),
  piece("ferz", "Ferz", "F", "Leaper: one square diagonally", MOVE_SETS.ferz),
  piece("alfil", "Alfil", "A", "Leaper: (2,2)", MOVE_SETS.alfil),
  piece("dabbaba", "Dabbaba", "D", "Leaper: (2,0)", MOVE_SETS.dabbaba),
  piece("alibaba", "Alibaba", "AD", "Alfil + Dabbaba", MOVE_SETS.alibaba),
  piece("camel", "Camel", "C", "Leaper: (1,3)", MOVE_SETS.camel),
  piece("zebra", "Zebra", "Z", "Leaper: (2,3)", MOVE_SETS.zebra),
  piece("giraffe", "Giraffe", "G", "Leaper: (1,4)", MOVE_SETS.giraffe),
  piece("antelope", "Antelope", "AN", "Leaper: (3,4)", MOVE_SETS.antelope),
  piece("bishop", "Bishop", "B", "Rider: diagonal", [], RIDER_SETS.bishop),
  piece("rook", "Rook", "R", "Rider: orthogonal", [], RIDER_SETS.rook),
  piece("queen", "Queen", "Q", "Rider: orthogonal + diagonal", [], RIDER_SETS.queen),
  piece("nightrider", "Nightrider", "NN", "Rider: repeated knight steps", [], RIDER_SETS.nightrider),
  piece("camelrider", "Camelrider / Mehari", "CC", "Rider: repeated camel steps", [], RIDER_SETS.camelrider),
  piece("zebrarider", "Zebrarider", "ZZ", "Rider: repeated zebra steps", [], RIDER_SETS.zebrarider),
  piece("alfilrider", "Alfilrider", "AA", "Rider: repeated alfil steps", [], RIDER_SETS.alfilrider),
  piece("dabbabarider", "Dabbabarider", "DD", "Rider: repeated dabbaba steps", [], RIDER_SETS.dabbabarider),
  piece("alibabarider", "Alibabarider", "AADD", "Alfilrider + Dabbabarider", [], RIDER_SETS.alibabarider),
  piece("gnu", "Gnu / Wildebeest", "GN", "Knight + Camel", mergeVectors(MOVE_SETS.knight, MOVE_SETS.camel)),
  piece("bison", "Bison", "BI", "Camel + Zebra", mergeVectors(MOVE_SETS.camel, MOVE_SETS.zebra)),
  piece("buffalo", "Buffalo", "BU", "Knight + Camel + Zebra", mergeVectors(MOVE_SETS.knight, MOVE_SETS.camel, MOVE_SETS.zebra)),
  piece("auroch", "Auroch", "AU", "Knight + Giraffe", mergeVectors(MOVE_SETS.knight, MOVE_SETS.giraffe)),
  piece("squirrel", "Squirrel / Bear / Castle", "SQ", "Knight + Alfil + Dabbaba", MOVE_SETS.squirrel),
  piece("amazon", "Amazon", "AM", "Queen + Knight", MOVE_SETS.knight, RIDER_SETS.queen),
  piece("archbishop", "Archbishop / Cardinal", "BN", "Bishop + Knight", MOVE_SETS.knight, RIDER_SETS.bishop),
  piece("chancellor", "Chancellor / Empress", "RN", "Rook + Knight", MOVE_SETS.knight, RIDER_SETS.rook),
  piece("centaur", "Centaur", "KN", "King + Knight", mergeVectors(MOVE_SETS.mann, MOVE_SETS.knight)),
  piece("champion", "Champion", "WAD", "Wazir + Alfil + Dabbaba", mergeVectors(MOVE_SETS.wazir, MOVE_SETS.alfil, MOVE_SETS.dabbaba)),
  piece("wizard", "Wizard", "FC", "Ferz + Camel", mergeVectors(MOVE_SETS.ferz, MOVE_SETS.camel)),
  piece("admiral", "Admiral / Dragon King", "RF", "Rook + Ferz", MOVE_SETS.ferz, RIDER_SETS.rook),
  piece("dragon-horse", "Dragon Horse", "BW", "Bishop + Wazir", MOVE_SETS.wazir, RIDER_SETS.bishop),
  piece("phoenix", "Phoenix / Waffle", "WA", "Wazir + Alfil", mergeVectors(MOVE_SETS.wazir, MOVE_SETS.alfil)),
  piece("kirin", "Kirin", "FD", "Ferz + Dabbaba", mergeVectors(MOVE_SETS.ferz, MOVE_SETS.dabbaba)),
  piece("war-machine", "War Machine / Machine", "WD", "Wazir + Dabbaba", mergeVectors(MOVE_SETS.wazir, MOVE_SETS.dabbaba)),
  piece("modern-elephant", "Elephant (Modern)", "FA", "Ferz + Alfil", mergeVectors(MOVE_SETS.ferz, MOVE_SETS.alfil)),
  piece("mastodon", "Mastodon / Squire", "KAD", "King + Alfil + Dabbaba", mergeVectors(MOVE_SETS.mann, MOVE_SETS.alfil, MOVE_SETS.dabbaba)),
  piece("carpenter", "Carpenter", "ND", "Knight + Dabbaba", mergeVectors(MOVE_SETS.knight, MOVE_SETS.dabbaba)),
  piece("bede", "Bede", "BD", "Bishop + Dabbaba", MOVE_SETS.dabbaba, RIDER_SETS.bishop),
  piece("caliph", "Caliph", "BC", "Bishop + Camel", MOVE_SETS.camel, RIDER_SETS.bishop),
  piece("canvasser", "Canvasser", "RC", "Rook + Camel", MOVE_SETS.camel, RIDER_SETS.rook),
  piece("emperor", "Emperor / Marquis", "WN", "Wazir + Knight", mergeVectors(MOVE_SETS.wazir, MOVE_SETS.knight)),
  piece("teutonic-knight", "Teutonic Knight", "WNC", "Wazir + Knight + Camel", mergeVectors(MOVE_SETS.wazir, MOVE_SETS.knight, MOVE_SETS.camel)),
  piece("sorcerer", "Sorcerer", "WZ", "Wazir + Zebra", mergeVectors(MOVE_SETS.wazir, MOVE_SETS.zebra)),
  piece("crown-princess", "Crown Princess / Popess", "BNW", "Archbishop + Wazir", mergeVectors(MOVE_SETS.knight, MOVE_SETS.wazir), RIDER_SETS.bishop),
  piece("archchancellor", "Archchancellor", "RNF", "Chancellor + Ferz", mergeVectors(MOVE_SETS.ferz, MOVE_SETS.knight), RIDER_SETS.rook),
  piece("amazonrider", "Amazonrider", "QNN", "Queen + Nightrider", [], mergeRiders(RIDER_SETS.queen, RIDER_SETS.nightrider)),
  piece("waran", "Waran / Raven", "RNN", "Rook + Nightrider", [], mergeRiders(RIDER_SETS.rook, RIDER_SETS.nightrider)),
  piece("bodyguard", "Bodyguard", "Q2", "Queen limited to 2 squares", [], symmetricRiders([[1, 0], [1, 1]], 2)),
  piece("bishops-dog", "Bishop's Dog", "B3", "Bishop limited to 3 squares", [], symmetricRiders([[1, 1]], 3)),
  piece("abbot", "Abbot", "B4N", "Bishop limited to 4 + Knight", MOVE_SETS.knight, symmetricRiders([[1, 1]], 4)),
];

const PIECES_BY_ID = new Map(PIECE_CATALOG.map((pieceDefinition) => [pieceDefinition.id, pieceDefinition]));
const VISIBLE_PIECE_CATALOG = PIECE_CATALOG.filter((pieceDefinition) => pieceDefinition.riderVectors.length === 0);
const simulationEngine = createSimulationEngine();

const PLAYER_STYLES = [
  { name: "Black", color: "#1c2733", attackColor: "rgba(28, 39, 51, 0.08)" },
  { name: "Red", color: "#c73f46", attackColor: "rgba(199, 63, 70, 0.08)" },
  { name: "Blue", color: "#2274a5", attackColor: "rgba(34, 116, 165, 0.08)" },
];

const PRESET_LIBRARY = [
  {
    description: "The recognizable two-knight territory from the video.",
    id: "video-shape",
    name: "Video Shape",
    queue: ["knight", "knight"],
    steps: 1_000_000,
  },
  {
    description: "A short run for checking the OEIS prefix and early spiral terms.",
    id: "oeis-prefix",
    name: "OEIS Prefix",
    queue: ["knight", "knight"],
    steps: 160,
  },
  {
    description: "Three leapers with different jump lengths competing on the same spiral.",
    id: "three-leapers",
    name: "Three Leapers",
    queue: ["knight", "camel", "zebra"],
    steps: 100_000,
  },
  {
    description: "Old leapers with tiny moves make dense, inspectable texture.",
    id: "ancient-leapers",
    name: "Ancient Leapers",
    queue: ["wazir", "ferz", "alfil", "dabbaba"],
    steps: 250_000,
  },
  {
    description: "Five compound leapers with broad jump vocabularies.",
    id: "hybrid-stack",
    name: "Hybrid Stack",
    queue: ["gnu", "buffalo", "squirrel", "champion", "mastodon"],
    steps: 500_000,
  },
];

const ICON_PATHS = {
  "chevron-down": ["M6 9l6 6 6-6"],
  "chevron-up": ["M6 15l6-6 6 6"],
  "eye-off": ["M3 3l18 18", "M10.7 5.1A10.8 10.8 0 0 1 12 5c5 0 9 4.5 10 7a12 12 0 0 1-3.1 4.6", "M6.2 6.2A12.2 12.2 0 0 0 2 12c1 2.5 5 7 10 7a10.9 10.9 0 0 0 4.3-.9", "M9.9 9.9a3 3 0 0 0 4.2 4.2"],
  fit: ["M8 3H3v5", "M16 3h5v5", "M21 16v5h-5", "M8 21H3v-5", "M3 3l6 6", "M21 3l-6 6", "M21 21l-6-6", "M3 21l6-6"],
  knight: ["M7 20h10", "M8 17h8l-1-5 2-2-2-5-5-2-3 3 2 2-3 3 2 6z", "M10 8h.01", "M9 13l3-1"],
  panel: ["M4 5h16v14H4z", "M4 15h16", "M9 15v4"],
  pieces: ["M12 3l4 4-4 4-4-4 4-4z", "M6 13l3 3-3 3-3-3 3-3z", "M18 13l3 3-3 3-3-3 3-3z"],
  play: ["M8 5v14l11-7-11-7z"],
  pause: ["M8 5v14", "M16 5v14"],
  presets: ["M5 6h14", "M5 12h14", "M5 18h14", "M4 6h.01", "M4 12h.01", "M4 18h.01"],
  reset: ["M20 6v6h-6", "M20 12a8 8 0 1 1-2.3-5.7L20 9"],
  sliders: ["M4 6h8", "M16 6h4", "M4 12h4", "M12 12h8", "M4 18h10", "M18 18h2", "M12 4v4", "M8 10v4", "M16 16v4"],
  "step-back": ["M12 5l-7 7 7 7", "M5 12h14"],
  "step-forward": ["M12 5l7 7-7 7", "M5 12h14"],
  trash: ["M4 7h16", "M10 11v6", "M14 11v6", "M6 7l1 14h10l1-14", "M9 7V4h6v3"],
  x: ["M6 6l12 12", "M18 6L6 18"],
  "zoom-in": ["M11 5a6 6 0 1 0 0 12 6 6 0 0 0 0-12z", "M20 20l-4.3-4.3", "M11 8v6", "M8 11h6"],
  "zoom-out": ["M11 5a6 6 0 1 0 0 12 6 6 0 0 0 0-12z", "M20 20l-4.3-4.3", "M8 11h6"],
};

const elements = {
  advancedDrawer: document.querySelector("#advancedDrawer"),
  board: document.querySelector("#board"),
  boardStatus: document.querySelector("#boardStatus"),
  boardStatusDetail: document.querySelector("#boardStatusDetail"),
  boardStatusFill: document.querySelector("#boardStatusFill"),
  boardStatusTitle: document.querySelector("#boardStatusTitle"),
  closeAdvancedDrawer: document.querySelector("#closeAdvancedDrawer"),
  closePieceDrawer: document.querySelector("#closePieceDrawer"),
  closePresetDrawer: document.querySelector("#closePresetDrawer"),
  stepsRange: document.querySelector("#stepsRange"),
  stepsNumber: document.querySelector("#stepsNumber"),
  backStep: document.querySelector("#backStep"),
  forwardStep: document.querySelector("#forwardStep"),
  hideUi: document.querySelector("#hideUi"),
  playPause: document.querySelector("#playPause"),
  presetDrawer: document.querySelector("#presetDrawer"),
  presetList: document.querySelector("#presetList"),
  revealUi: document.querySelector("#revealUi"),
  sheetHandle: document.querySelector("#sheetHandle"),
  speedRange: document.querySelector("#speedRange"),
  speedValue: document.querySelector("#speedValue"),
  showAttacks: document.querySelector("#showAttacks"),
  showSpiral: document.querySelector("#showSpiral"),
  showIndexes: document.querySelector("#showIndexes"),
  zoomOut: document.querySelector("#zoomOut"),
  fitBoard: document.querySelector("#fitBoard"),
  zoomIn: document.querySelector("#zoomIn"),
  summaryStats: document.querySelector("#summaryStats"),
  sequenceList: document.querySelector("#sequenceList"),
  placementList: document.querySelector("#placementList"),
  piecePalette: document.querySelector("#piecePalette"),
  pieceDetailToggle: document.querySelector("#pieceDetailToggle"),
  pieceDrawer: document.querySelector("#pieceDrawer"),
  pieceDrawerBackdrop: document.querySelector("#pieceDrawerBackdrop"),
  queueDropZone: document.querySelector("#queueDropZone"),
  queueCount: document.querySelector("#queueCount"),
  queueMessage: document.querySelector("#queueMessage"),
  openAdvancedDrawer: document.querySelector("#openAdvancedDrawer"),
  openPieceDrawer: document.querySelector("#openPieceDrawer"),
  openPresetDrawer: document.querySelector("#openPresetDrawer"),
  clearQueue: document.querySelector("#clearQueue"),
  resetQueue: document.querySelector("#resetQueue"),
  presetButtons: document.querySelectorAll("[data-steps]"),
};

const ctx = elements.board.getContext("2d");
const state = {
  activeResult: null,
  activeSnapshot: null,
  animationFrame: 0,
  fallbackFrame: 0,
  draggedQueueIndex: null,
  indexBuildFrame: 0,
  indexProgress: 0,
  indexing: false,
  lastPlayTime: 0,
  notice: "",
  noticeTimer: 0,
  occupiedIndex: new Map(),
  panX: 0,
  panY: 0,
  playing: false,
  queue: DEFAULT_QUEUE.slice(),
  queueMessageTimer: 0,
  runId: 0,
  runTimer: 0,
  running: false,
  stepCarry: 0,
  targetSteps: Number(elements.stepsNumber.value),
  tileIndex: new Map(),
  tileIndexReady: false,
  uiHidden: false,
  worker: null,
  workerMode: "worker",
  zoom: 1,
  sheetExpanded: true,
  sheetGesture: null,
};

const pointerState = {
  activePointers: new Map(),
  gesture: null,
};

function piece(id, name, symbol, description, leaperOffsets = [], riderVectors = []) {
  return {
    description,
    id,
    leaperOffsets: mergeVectors(leaperOffsets),
    name,
    riderVectors: mergeRiders(riderVectors),
    symbol,
  };
}

function symmetricLeapers(pairs) {
  return mergeVectors(
    pairs.flatMap(([a, b]) => {
      const offsets = [];
      for (const [x, y] of uniquePairs(a, b)) {
        for (const sx of [-1, 1]) {
          for (const sy of [-1, 1]) {
            offsets.push([sx * x, sy * y]);
          }
        }
      }
      return offsets;
    })
  );
}

function symmetricRiders(pairs, maxSteps = Infinity) {
  return mergeRiders(
    pairs.flatMap(([a, b]) => {
      const vectors = [];
      for (const [x, y] of uniquePairs(a, b)) {
        for (const sx of [-1, 1]) {
          for (const sy of [-1, 1]) {
            vectors.push({ dx: sx * x, dy: sy * y, maxSteps });
          }
        }
      }
      return vectors;
    })
  );
}

function uniquePairs(a, b) {
  return a === b ? [[a, b]] : [[a, b], [b, a]];
}

function mergeVectors(...groups) {
  const seen = new Map();
  for (const group of groups) {
    for (const [dx, dy] of group) {
      if (dx || dy) {
        seen.set(`${dx},${dy}`, [dx, dy]);
      }
    }
  }
  return [...seen.values()];
}

function mergeRiders(...groups) {
  const seen = new Map();
  for (const group of groups) {
    for (const vector of group) {
      if (!vector.dx && !vector.dy) {
        continue;
      }
      const maxSteps = vector.maxSteps ?? Infinity;
      const key = `${vector.dx},${vector.dy}`;
      const existing = seen.get(key);
      if (!existing || maxSteps > existing.maxSteps) {
        seen.set(key, { dx: vector.dx, dy: vector.dy, maxSteps });
      }
    }
  }
  return [...seen.values()];
}

function createSimulationEngine() {
  const COORD_OFFSET = 1048576;
  const COORD_BASE = 2097152;
  const DENSE_BOARD_SIZE = 3000;
  const DENSE_BOARD_MIN = -1500;
  const DENSE_BOARD_MAX = DENSE_BOARD_MIN + DENSE_BOARD_SIZE - 1;
  const DENSE_BOARD_CELLS = DENSE_BOARD_SIZE * DENSE_BOARD_SIZE;
  const DENSE_MAX_INDEX = (2 * Math.max(Math.abs(DENSE_BOARD_MIN), Math.abs(DENSE_BOARD_MAX)) + 1) ** 2 - 1;
  const DENSE_MAX_PLAYERS = 8;
  const INITIAL_CAPACITY = 1024;
  const SEQUENCE_LIMIT = 120;
  const RECENT_LIMIT = 16;

  class SpiralCursor {
    constructor() {
      this.x = 0;
      this.y = 0;
      this.index = -1;
      this.lastScannedIndex = -1;
      this.directionIndex = 0;
      this.sideLength = 1;
      this.stepInSide = 0;
      this.sidesAtLength = 0;
      this.directions = [[1, 0], [0, 1], [-1, 0], [0, -1]];
    }

    next() {
      if (this.index === -1) {
        this.index = 0;
        this.lastScannedIndex = 0;
        return;
      }

      const direction = this.directions[this.directionIndex];
      this.x += direction[0];
      this.y += direction[1];
      this.index += 1;
      this.lastScannedIndex = this.index;
      this.stepInSide += 1;

      if (this.stepInSide === this.sideLength) {
        this.stepInSide = 0;
        this.directionIndex = (this.directionIndex + 1) % this.directions.length;
        this.sidesAtLength += 1;
        if (this.sidesAtLength === 2) {
          this.sidesAtLength = 0;
          this.sideLength += 1;
        }
      }
    }
  }

  class PlacementStore {
    constructor() {
      this.length = 0;
      this.capacity = INITIAL_CAPACITY;
      this.indices = new Int32Array(this.capacity);
      this.xs = new Int32Array(this.capacity);
      this.ys = new Int32Array(this.capacity);
      this.playerIds = new Uint16Array(this.capacity);
    }

    append(index, x, y, player) {
      if (this.length === this.capacity) {
        this.grow();
      }
      this.indices[this.length] = index;
      this.xs[this.length] = x;
      this.ys[this.length] = y;
      this.playerIds[this.length] = player;
      this.length += 1;
    }

    grow() {
      this.capacity *= 2;
      this.indices = copyTyped(this.indices, new Int32Array(this.capacity));
      this.xs = copyTyped(this.xs, new Int32Array(this.capacity));
      this.ys = copyTyped(this.ys, new Int32Array(this.capacity));
      this.playerIds = copyTyped(this.playerIds, new Uint16Array(this.capacity));
    }

    trim() {
      return {
        indices: this.indices.slice(0, this.length),
        playerIds: this.playerIds.slice(0, this.length),
        xs: this.xs.slice(0, this.length),
        ys: this.ys.slice(0, this.length),
      };
    }
  }

  class DenseLeaperGame {
    constructor(config) {
      this.mode = "dense";
      this.players = config.players;
      this.activeCount = this.players.length;
      this.activeMask = (1 << this.activeCount) - 1;
      this.movesByPlayer = this.players.map((player) => player.leaperOffsets);
      this.tileColors = new Uint8Array(DENSE_BOARD_CELLS);
      this.attacked = new Uint8Array(DENSE_BOARD_CELLS);
      this.nextCandidates = new Int32Array(this.activeCount);
      this.exhausted = new Uint8Array(this.activeCount);
      this.counts = new Uint32Array(this.activeCount);
      this.placements = new PlacementStore();
      this.turnCursor = 0;
      this.finished = false;
      this.sequenceTerms = this.players.map(() => []);
      this.recent = [];
      this.minX = Infinity;
      this.maxX = -Infinity;
      this.minY = Infinity;
      this.maxY = -Infinity;
      this.coordScratch = [0, 0];
    }

    get completed() {
      return this.placements.length;
    }

    runToTarget(targetSteps, onProgress, progressEvery = 25000) {
      while (this.completed < targetSteps && !this.finished) {
        this.step();
        if (onProgress && (this.completed % progressEvery === 0 || this.finished)) {
          onProgress(this.snapshot());
        }
      }
    }

    step() {
      if (this.finished) {
        return false;
      }

      let checked = 0;
      while (checked < this.activeCount) {
        const playerIndex = this.turnCursor;
        this.turnCursor = (this.turnCursor + 1) % this.activeCount;

        if (this.exhausted[playerIndex]) {
          checked += 1;
          continue;
        }

        const move = this.findMove(playerIndex);
        if (move) {
          this.place(playerIndex, move.index, move.x, move.y, move.offset);
          return true;
        }
        checked += 1;
      }

      this.finished = true;
      return false;
    }

    findMove(playerIndex) {
      const ownBit = 1 << playerIndex;
      const attackMask = this.activeCount === 1 ? ownBit : this.activeMask & ~ownBit;
      let candidate = this.nextCandidates[playerIndex];

      while (candidate <= DENSE_MAX_INDEX) {
        spiralCoordInto(candidate, this.coordScratch);
        const x = this.coordScratch[0];
        const y = this.coordScratch[1];

        if (inDenseBoard(x, y)) {
          const offset = denseBoardOffset(x, y);
          if (this.tileColors[offset] === 0 && (this.attacked[offset] & attackMask) === 0) {
            this.nextCandidates[playerIndex] = candidate + 1;
            return { index: candidate, offset, x, y };
          }
        }
        candidate += 1;
      }

      this.nextCandidates[playerIndex] = DENSE_MAX_INDEX + 1;
      this.exhausted[playerIndex] = 1;
      return null;
    }

    place(playerIndex, spiralIndex, x, y, offset) {
      const colorValue = playerIndex + 1;
      const colorBit = 1 << playerIndex;
      this.tileColors[offset] = colorValue;
      this.counts[playerIndex] += 1;
      this.placements.append(spiralIndex, x, y, playerIndex);

      for (const [dx, dy] of this.movesByPlayer[playerIndex]) {
        const attackX = x + dx;
        const attackY = y + dy;
        if (inDenseBoard(attackX, attackY)) {
          this.attacked[denseBoardOffset(attackX, attackY)] |= colorBit;
        }
      }

      this.minX = Math.min(this.minX, x);
      this.maxX = Math.max(this.maxX, x);
      this.minY = Math.min(this.minY, y);
      this.maxY = Math.max(this.maxY, y);
      insertSortedTerm(this.sequenceTerms[playerIndex], spiralIndex);

      this.recent.push({ index: spiralIndex, playerIndex, turnNumber: this.completed - 1, x, y });
      if (this.recent.length > RECENT_LIMIT) {
        this.recent.shift();
      }
    }

    snapshot() {
      return {
        bounds: this.bounds(),
        completed: this.completed,
        counts: Array.from(this.counts),
        mode: this.mode,
        players: this.players,
        recent: this.recent.slice(),
        sequenceTerms: this.sequenceTerms.map((terms) => terms.slice()),
      };
    }

    finalResult() {
      return {
        ...this.snapshot(),
        ...this.placements.trim(),
        attacked: this.attacked,
        board: {
          maxIndex: DENSE_MAX_INDEX,
          maxX: DENSE_BOARD_MAX,
          maxY: DENSE_BOARD_MAX,
          minX: DENSE_BOARD_MIN,
          minY: DENSE_BOARD_MIN,
          size: DENSE_BOARD_SIZE,
        },
        tileColors: this.tileColors,
      };
    }

    bounds() {
      if (!this.completed) {
        return { maxX: 4, maxY: 4, minX: -4, minY: -4 };
      }
      return { maxX: this.maxX, maxY: this.maxY, minX: this.minX, minY: this.minY };
    }
  }

  class SparseGame {
    constructor(config) {
      this.mode = "sparse";
      this.players = config.players;
      this.cursors = this.players.map(() => new SpiralCursor());
      this.counts = new Uint32Array(this.players.length);
      this.leaperAttacked = this.players.map(() => new Set());
      this.occupied = new Map();
      this.placements = new PlacementStore();
      this.nextPlayerIndex = 0;
      this.sequenceTerms = this.players.map(() => []);
      this.recent = [];
      this.minX = Infinity;
      this.maxX = -Infinity;
      this.minY = Infinity;
      this.maxY = -Infinity;
    }

    get completed() {
      return this.placements.length;
    }

    runToTarget(targetSteps, onProgress, progressEvery = 25000) {
      while (this.completed < targetSteps) {
        this.step();
        if (onProgress && this.completed % progressEvery === 0) {
          onProgress(this.snapshot());
        }
      }
    }

    step() {
      const playerIndex = this.nextPlayerIndex;
      const cursor = this.cursors[playerIndex];

      while (true) {
        cursor.next();
        if (this.isLegal(playerIndex, cursor.x, cursor.y)) {
          this.place(playerIndex, cursor.index, cursor.x, cursor.y);
          this.nextPlayerIndex = (this.nextPlayerIndex + 1) % this.players.length;
          return;
        }
      }
    }

    isLegal(playerIndex, x, y) {
      const key = packCoord(x, y);
      if (this.occupied.has(key)) {
        return false;
      }

      for (let opponent = 0; opponent < this.players.length; opponent += 1) {
        if (opponent === playerIndex) {
          continue;
        }
        if (this.leaperAttacked[opponent].has(key) || this.riderAttacks(opponent, x, y)) {
          return false;
        }
      }

      return true;
    }

    riderAttacks(playerIndex, targetX, targetY) {
      const vectors = this.players[playerIndex].riderVectors;
      if (!vectors.length || !this.completed) {
        return false;
      }

      for (const vector of vectors) {
        const scanDx = -vector.dx;
        const scanDy = -vector.dy;
        const limit = vector.maxSteps || Infinity;
        let x = targetX + scanDx;
        let y = targetY + scanDy;
        let step = 1;

        while (step <= limit) {
          if (this.isPastOccupiedBounds(x, y, scanDx, scanDy)) {
            break;
          }

          const blocker = this.occupied.get(packCoord(x, y));
          if (blocker !== undefined) {
            return blocker === playerIndex;
          }

          x += scanDx;
          y += scanDy;
          step += 1;
        }
      }

      return false;
    }

    isPastOccupiedBounds(x, y, scanDx, scanDy) {
      if (scanDx === 0 && (x < this.minX || x > this.maxX)) {
        return true;
      }
      if (scanDy === 0 && (y < this.minY || y > this.maxY)) {
        return true;
      }
      return (
        (scanDx < 0 && x < this.minX) ||
        (scanDx > 0 && x > this.maxX) ||
        (scanDy < 0 && y < this.minY) ||
        (scanDy > 0 && y > this.maxY)
      );
    }

    place(playerIndex, spiralIndex, x, y) {
      const key = packCoord(x, y);
      const player = this.players[playerIndex];
      this.occupied.set(key, playerIndex);
      this.counts[playerIndex] += 1;
      this.placements.append(spiralIndex, x, y, playerIndex);

      for (const offset of player.leaperOffsets) {
        this.leaperAttacked[playerIndex].add(packCoord(x + offset[0], y + offset[1]));
      }

      this.minX = Math.min(this.minX, x);
      this.maxX = Math.max(this.maxX, x);
      this.minY = Math.min(this.minY, y);
      this.maxY = Math.max(this.maxY, y);
      insertSortedTerm(this.sequenceTerms[playerIndex], spiralIndex);

      this.recent.push({ index: spiralIndex, playerIndex, turnNumber: this.completed - 1, x, y });
      if (this.recent.length > RECENT_LIMIT) {
        this.recent.shift();
      }
    }

    snapshot() {
      return {
        bounds: this.bounds(),
        completed: this.completed,
        counts: Array.from(this.counts),
        mode: this.mode,
        players: this.players,
        recent: this.recent.slice(),
        sequenceTerms: this.sequenceTerms.map((terms) => terms.slice()),
      };
    }

    finalResult() {
      return {
        ...this.snapshot(),
        ...this.placements.trim(),
      };
    }

    bounds() {
      if (!this.completed) {
        return { maxX: 4, maxY: 4, minX: -4, minY: -4 };
      }
      return { maxX: this.maxX, maxY: this.maxY, minX: this.minX, minY: this.minY };
    }
  }

  function ringForIndex(index) {
    return Math.ceil((Math.sqrt(index + 1) - 1) / 2);
  }

  function spiralCoordInto(index, out) {
    if (index === 0) {
      out[0] = 0;
      out[1] = 0;
      return;
    }

    const ring = ringForIndex(index);
    const start = (2 * ring - 1) * (2 * ring - 1);
    const side = 2 * ring;
    const offset = index - start;

    if (offset < side) {
      out[0] = ring;
      out[1] = -ring + 1 + offset;
    } else if (offset < 2 * side) {
      out[0] = ring - 1 - (offset - side);
      out[1] = ring;
    } else if (offset < 3 * side) {
      out[0] = -ring;
      out[1] = ring - 1 - (offset - 2 * side);
    } else {
      out[0] = -ring + 1 + (offset - 3 * side);
      out[1] = -ring;
    }
  }

  function inDenseBoard(x, y) {
    return x >= DENSE_BOARD_MIN && x <= DENSE_BOARD_MAX && y >= DENSE_BOARD_MIN && y <= DENSE_BOARD_MAX;
  }

  function denseBoardOffset(x, y) {
    return (DENSE_BOARD_MAX - y) * DENSE_BOARD_SIZE + (x - DENSE_BOARD_MIN);
  }

  function insertSortedTerm(terms, value) {
    if (terms.length === SEQUENCE_LIMIT && value >= terms[terms.length - 1]) {
      return;
    }

    let index = terms.findIndex((term) => value < term);
    if (index === -1) {
      index = terms.length;
    }
    terms.splice(index, 0, value);
    if (terms.length > SEQUENCE_LIMIT) {
      terms.pop();
    }
  }

  function copyTyped(source, target) {
    target.set(source);
    return target;
  }

  function packCoord(x, y) {
    return (x + COORD_OFFSET) * COORD_BASE + (y + COORD_OFFSET);
  }

  function unpackX(key) {
    return Math.floor(key / COORD_BASE) - COORD_OFFSET;
  }

  function unpackY(key) {
    return (key % COORD_BASE) - COORD_OFFSET;
  }

  function canUseDense(config) {
    return (
      config.players.length > 0 &&
      config.players.length <= DENSE_MAX_PLAYERS &&
      config.players.every((player) => player.riderVectors.length === 0)
    );
  }

  function createGame(config) {
    return canUseDense(config) ? new DenseLeaperGame(config) : new SparseGame(config);
  }

  return { createGame, packCoord, unpackX, unpackY };
}

function pieceForId(pieceId) {
  return PIECES_BY_ID.get(pieceId) || PIECES_BY_ID.get("knight");
}

function playerStyleAt(index) {
  if (index < PLAYER_STYLES.length) {
    return PLAYER_STYLES[index];
  }

  const playerNumber = index + 1;
  const hue = Math.round((index * 137.508 + 210) % 360);
  return {
    attackColor: `hsl(${hue} 68% 42% / 0.08)`,
    color: `hsl(${hue} 68% 42%)`,
    name: `Player ${playerNumber}`,
  };
}

function buildPlayersFromQueue(queue) {
  return queue.map((pieceId, index) => {
    const pieceDefinition = pieceForId(pieceId);
    return {
      ...playerStyleAt(index),
      leaperOffsets: pieceDefinition.leaperOffsets,
      pieceId: pieceDefinition.id,
      pieceName: pieceDefinition.name,
      riderVectors: pieceDefinition.riderVectors,
      symbol: pieceDefinition.symbol,
    };
  });
}

function buildSimulationConfig() {
  return {
    players: buildPlayersFromQueue(state.queue),
    progressEvery: progressEveryForTarget(state.targetSteps),
    targetSteps: state.targetSteps,
  };
}

function progressEveryForTarget(targetSteps) {
  if (targetSteps <= 25000) {
    return 2500;
  }
  if (targetSteps <= 250000) {
    return 10000;
  }
  return 25000;
}

function renderPalette() {
  elements.piecePalette.replaceChildren(...VISIBLE_PIECE_CATALOG.map((pieceDefinition) => createPaletteCard(pieceDefinition)));
}

function createSvgIcon(iconName) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  svg.classList.add("svg-icon");
  for (const pathData of ICON_PATHS[iconName] || ICON_PATHS.x) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathData);
    svg.append(path);
  }
  return svg;
}

function setIconButton(button, iconName, label) {
  button.classList.add("icon-button");
  button.replaceChildren(createSvgIcon(iconName));
  button.title = label;
  button.setAttribute("aria-label", label);
  button.dataset.tooltip = label;
  button.dataset.icon = iconName;
}

function hydrateIconButtons() {
  document.querySelectorAll("[data-icon]").forEach((button) => {
    const label = button.getAttribute("aria-label") || button.title || button.dataset.tooltip || "";
    setIconButton(button, button.dataset.icon, label);
  });
}

function renderPresets() {
  elements.presetList.replaceChildren(...PRESET_LIBRARY.map((preset) => createPresetCard(preset)));
  updatePresetButtons();
}

function createPresetCard(preset) {
  const button = document.createElement("button");
  const text = document.createElement("span");
  const name = document.createElement("strong");
  const description = document.createElement("span");
  const meta = document.createElement("span");
  const chips = document.createElement("span");

  button.type = "button";
  button.className = "preset-card";
  button.dataset.presetId = preset.id;
  button.setAttribute("aria-label", `Load ${preset.name} preset`);

  text.className = "preset-card-text";
  name.textContent = preset.name;
  description.textContent = preset.description;

  meta.className = "preset-meta";
  meta.textContent = `${preset.steps.toLocaleString()} placements`;

  chips.className = "preset-piece-row";
  for (const pieceId of preset.queue) {
    const pieceDefinition = pieceForId(pieceId);
    const chip = document.createElement("span");
    chip.className = "preset-piece";
    chip.textContent = pieceDefinition.symbol;
    chip.title = pieceDefinition.name;
    chips.append(chip);
  }

  text.append(name, description, meta);
  button.append(text, chips);
  button.addEventListener("click", () => applyPreset(preset.id));
  return button;
}

function createPaletteCard(pieceDefinition) {
  const card = document.createElement("article");
  const top = document.createElement("div");
  const symbol = document.createElement("strong");
  const text = document.createElement("div");
  const name = document.createElement("h3");
  const description = document.createElement("p");
  const addButton = document.createElement("button");
  let suppressClickUntil = 0;

  card.className = "piece-card";
  card.draggable = true;
  card.dataset.pieceId = pieceDefinition.id;
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `Add ${pieceDefinition.name} to queue`);
  top.className = "piece-card-top";
  symbol.className = "piece-symbol";
  symbol.textContent = pieceDefinition.symbol;
  name.textContent = pieceDefinition.name;
  description.textContent = pieceDefinition.description;
  addButton.type = "button";
  addButton.className = "piece-add-button";
  addButton.textContent = "Add";
  addButton.draggable = false;
  addButton.setAttribute("aria-label", `Add ${pieceDefinition.name}`);

  card.addEventListener("dragstart", (event) => {
    suppressClickUntil = performance.now() + 800;
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("application/x-piece-id", pieceDefinition.id);
  });
  card.addEventListener("dragend", () => {
    suppressClickUntil = performance.now() + 800;
  });
  card.addEventListener("click", (event) => {
    if (performance.now() < suppressClickUntil) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    addPieceToQueue(pieceDefinition.id);
  });
  addButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    addPieceToQueue(pieceDefinition.id);
  });
  addButton.addEventListener("dragstart", (event) => {
    event.preventDefault();
  });
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      addPieceToQueue(pieceDefinition.id);
    }
  });

  text.append(name, description);
  top.append(symbol, text);
  card.append(top, createPieceDiagram(pieceDefinition), addButton);
  return card;
}

function createPieceDiagram(pieceDefinition) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const size = 74;
  const center = size / 2;
  const maxDistance = Math.max(2, maxPieceDistance(pieceDefinition));
  const scale = 28 / maxDistance;
  svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
  svg.setAttribute("class", "piece-diagram");
  svg.setAttribute("aria-hidden", "true");

  for (let offset = -maxDistance; offset <= maxDistance; offset += 1) {
    const x = center + offset * scale;
    const y = center + offset * scale;
    svg.append(line(x, center - maxDistance * scale, x, center + maxDistance * scale, "grid"));
    svg.append(line(center - maxDistance * scale, y, center + maxDistance * scale, y, "grid"));
  }

  for (const vector of pieceDefinition.riderVectors) {
    const length = Math.min(vector.maxSteps || maxDistance, maxDistance);
    svg.append(line(center, center, center + vector.dx * length * scale, center - vector.dy * length * scale, "ray"));
  }

  for (const [dx, dy] of pieceDefinition.leaperOffsets) {
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", String(center + dx * scale));
    dot.setAttribute("cy", String(center - dy * scale));
    dot.setAttribute("r", "2.9");
    dot.setAttribute("class", "target");
    svg.append(dot);
  }

  const centerDot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  centerDot.setAttribute("cx", String(center));
  centerDot.setAttribute("cy", String(center));
  centerDot.setAttribute("r", "4.2");
  centerDot.setAttribute("class", "origin");
  svg.append(centerDot);
  return svg;
}

function line(x1, y1, x2, y2, className) {
  const lineElement = document.createElementNS("http://www.w3.org/2000/svg", "line");
  lineElement.setAttribute("x1", String(x1));
  lineElement.setAttribute("y1", String(y1));
  lineElement.setAttribute("x2", String(x2));
  lineElement.setAttribute("y2", String(y2));
  lineElement.setAttribute("class", className);
  return lineElement;
}

function maxPieceDistance(pieceDefinition) {
  const leaperMax = pieceDefinition.leaperOffsets.reduce((max, [dx, dy]) => Math.max(max, Math.abs(dx), Math.abs(dy)), 0);
  const riderMax = pieceDefinition.riderVectors.reduce((max, vector) => Math.max(max, Math.abs(vector.dx), Math.abs(vector.dy)), 0);
  return Math.min(4, Math.max(leaperMax, riderMax, 2));
}

function renderQueue() {
  elements.queueDropZone.replaceChildren(...state.queue.map((pieceId, index) => createQueueCard(pieceId, index)));
  if (state.queue.length < MAX_QUEUE_LENGTH) {
    const slot = document.createElement("div");
    slot.className = "queue-slot empty";
    slot.title = "Drop piece here";
    slot.setAttribute("aria-label", "Drop piece here");
    slot.dataset.tooltip = "Drop piece here";
    slot.append(createSvgIcon("pieces"));
    slot.dataset.insertIndex = String(state.queue.length);
    addDropHandlers(slot);
    elements.queueDropZone.append(slot);
  }

  elements.queueCount.textContent = `${state.queue.length} ${state.queue.length === 1 ? "player" : "players"}`;
  elements.clearQueue.disabled = state.queue.length === 0;
  renderQueueMessage();
}

function createQueueCard(pieceId, index) {
  const pieceDefinition = pieceForId(pieceId);
  const style = playerStyleAt(index);
  const card = document.createElement("article");
  const symbol = document.createElement("strong");
  const label = document.createElement("span");
  const player = document.createElement("small");
  const pieceName = document.createElement("span");
  const controls = document.createElement("div");
  const up = document.createElement("button");
  const down = document.createElement("button");
  const remove = document.createElement("button");

  card.className = "queue-card";
  card.draggable = true;
  card.dataset.queueIndex = String(index);
  card.dataset.insertIndex = String(index);
  card.style.setProperty("--player-color", style.color);
  symbol.className = "piece-symbol";
  symbol.textContent = pieceDefinition.symbol;
  label.className = "queue-card-label";
  player.textContent = `${index + 1}. ${style.name}`;
  pieceName.textContent = pieceDefinition.name;
  label.append(player, pieceName);
  controls.className = "queue-card-controls";

  up.type = "button";
  setIconButton(up, "chevron-up", "Move earlier");
  up.disabled = index === 0;
  up.addEventListener("click", () => moveQueueCard(index, index - 1));

  down.type = "button";
  setIconButton(down, "chevron-down", "Move later");
  down.disabled = index === state.queue.length - 1;
  down.addEventListener("click", () => moveQueueCard(index, index + 2));

  remove.type = "button";
  setIconButton(remove, "x", "Remove");
  remove.addEventListener("click", () => removeQueueCard(index));

  card.addEventListener("dragstart", (event) => {
    state.draggedQueueIndex = index;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/x-queue-index", String(index));
  });
  card.addEventListener("dragend", () => {
    state.draggedQueueIndex = null;
  });

  addDropHandlers(card);
  controls.append(up, down, remove);
  card.append(symbol, label, controls);
  return card;
}

function addDropHandlers(element) {
  element.addEventListener("dragover", (event) => {
    if (canAcceptDrop(event)) {
      event.preventDefault();
      event.stopPropagation();
      updateDropHint(element, event);
      element.classList.add("drag-over");
    }
  });
  element.addEventListener("dragleave", (event) => {
    event.stopPropagation();
    clearDropHint(element);
  });
  element.addEventListener("drop", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const insertIndex = dropIndexForElement(element, event);
    const pieceId = event.dataTransfer.getData("application/x-piece-id");
    const queueIndex = event.dataTransfer.getData("application/x-queue-index");
    clearDropHint(element);

    if (pieceId) {
      addPieceToQueue(pieceId, insertIndex);
    } else if (queueIndex !== "") {
      moveQueueCard(Number(queueIndex), insertIndex);
    }
    state.draggedQueueIndex = null;
  });
}

function canAcceptDrop(event) {
  const types = Array.from(event.dataTransfer.types || []);
  return types.includes("application/x-piece-id") || types.includes("application/x-queue-index");
}

function updateDropHint(element, event) {
  clearDropHint(element);
  if (!element.classList.contains("queue-card")) {
    return;
  }
  const queueIndex = Number(element.dataset.queueIndex);
  element.classList.add(queueCardDropIndex(element, event) > queueIndex ? "drop-after" : "drop-before");
}

function clearDropHint(element) {
  element.classList.remove("drag-over", "drop-before", "drop-after");
}

function dropIndexForElement(element, event) {
  if (!element.classList.contains("queue-card")) {
    return Number(element.dataset.insertIndex ?? state.queue.length);
  }
  return queueCardDropIndex(element, event);
}

function queueCardDropIndex(element, event) {
  const queueIndex = Number(element.dataset.queueIndex);
  const rect = element.getBoundingClientRect();
  const isHorizontal = rect.width > rect.height * 1.35;
  const midpoint = isHorizontal ? rect.left + rect.width / 2 : rect.top + rect.height / 2;
  const pointer = isHorizontal ? event.clientX : event.clientY;
  return queueIndex + (pointer > midpoint ? 1 : 0);
}

function addPieceToQueue(pieceId, insertIndex = state.queue.length) {
  if (state.queue.length >= MAX_QUEUE_LENGTH) {
    flashQueueMessage("Queue is full. Remove a card before adding another.");
    return;
  }
  state.queue.splice(Math.min(insertIndex, state.queue.length), 0, pieceId);
  handleQueueChanged();
}

function removeQueueCard(index) {
  state.queue.splice(index, 1);
  handleQueueChanged();
}

function moveQueueCard(fromIndex, toIndex) {
  if (fromIndex === toIndex || fromIndex < 0 || fromIndex >= state.queue.length) {
    return;
  }
  const [pieceId] = state.queue.splice(fromIndex, 1);
  const adjustedIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
  state.queue.splice(Math.max(0, Math.min(adjustedIndex, state.queue.length)), 0, pieceId);
  handleQueueChanged();
}

function handleQueueChanged() {
  renderQueue();
  cancelActiveRun();
  enforceTargetLimitForQueue();
  state.activeResult = null;
  state.tileIndexReady = false;
  state.tileIndex = new Map();
  state.occupiedIndex = new Map();
  scheduleSimulation(0);
}

function renderQueueMessage(message = "") {
  if (message) {
    elements.queueMessage.textContent = message;
    return;
  }
  if (state.notice) {
    elements.queueMessage.textContent = state.notice;
    return;
  }
  if (state.indexing) {
    elements.queueMessage.textContent = `indexing board ${state.indexProgress}%`;
    return;
  }
  if (state.queue.length < 2) {
    elements.queueMessage.textContent = "Add at least 2 cards to run the simulation.";
  } else if (state.running) {
    const completed = state.activeSnapshot?.completed ?? 0;
    elements.queueMessage.textContent = `${state.workerMode}: ${completed.toLocaleString()} / ${state.targetSteps.toLocaleString()} placements`;
  } else if (queueHasRider() && state.targetSteps > RIDER_WARNING_STEPS) {
    elements.queueMessage.textContent = `ready: rider-heavy run capped at ${RIDER_STEP_CAP.toLocaleString()} placements`;
  } else {
    elements.queueMessage.textContent = `ready: ${state.queue.map((id) => pieceForId(id).symbol).join(", ")}`;
  }
}

function flashQueueMessage(message) {
  state.notice = message;
  renderQueueMessage();
  window.clearTimeout(state.noticeTimer);
  state.noticeTimer = window.setTimeout(() => {
    state.notice = "";
    renderQueueMessage();
  }, 2600);
}

function syncTargetInputs(steps) {
  elements.stepsNumber.value = String(steps);
  growStepsRange(steps);
  elements.stepsRange.value = String(steps);
  updatePresetButtons();
}

function setTargetSteps(nextSteps) {
  const clamped = cappedTargetSteps(nextSteps);
  state.targetSteps = clamped;
  syncTargetInputs(clamped);
  scheduleSimulation(90);
}

function cappedTargetSteps(nextSteps, notify = true) {
  const numericSteps = Number(nextSteps);
  let clamped = Math.max(0, Math.round(Number.isFinite(numericSteps) ? numericSteps : 0));

  if (queueHasRider() && clamped > RIDER_STEP_CAP) {
    clamped = RIDER_STEP_CAP;
    if (notify) {
      flashQueueMessage(`Rider-piece runs are capped at ${RIDER_STEP_CAP.toLocaleString()} placements.`);
    }
  }

  return clamped;
}

function enforceTargetLimitForQueue() {
  const capped = cappedTargetSteps(state.targetSteps);
  if (capped === state.targetSteps) {
    updatePresetButtons();
    return;
  }

  state.targetSteps = capped;
  syncTargetInputs(capped);
}

function updatePresetButtons() {
  document.querySelectorAll("[data-steps]").forEach((button) => {
    const isActive = Number(button.dataset.steps) === state.targetSteps;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  document.querySelectorAll("[data-preset-id]").forEach((button) => {
    const preset = PRESET_LIBRARY.find((item) => item.id === button.dataset.presetId);
    const isActive = Boolean(preset) && queuesMatch(state.queue, preset.queue) && state.targetSteps === cappedStepsForQueue(preset.steps, preset.queue);
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function setPieceDrawerOpen(isOpen) {
  elements.pieceDrawer.hidden = !isOpen;
  elements.pieceDrawer.classList.toggle("is-open", isOpen);
  elements.pieceDrawer.setAttribute("aria-hidden", String(!isOpen));
  elements.openPieceDrawer.setAttribute("aria-pressed", String(isOpen));
  document.body.classList.toggle("piece-panel-open", isOpen);
  if (isOpen) {
    setControlSheetExpanded(true);
  }
  if (isOpen) {
    setPresetDrawerOpen(false);
    setAdvancedDrawerOpen(false);
  }
}

function setPresetDrawerOpen(isOpen) {
  setDrawerOpen(elements.presetDrawer, isOpen);
}

function setAdvancedDrawerOpen(isOpen) {
  setDrawerOpen(elements.advancedDrawer, isOpen);
}

function setDrawerOpen(drawer, isOpen) {
  if (isOpen) {
    closeDrawers();
  }
  drawer.classList.toggle("is-open", isOpen);
  drawer.setAttribute("aria-hidden", String(!isOpen));
  syncDrawerBackdrop();
}

function closeDrawers() {
  setPieceDrawerOpen(false);
  for (const drawer of [elements.presetDrawer, elements.advancedDrawer]) {
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
  }
  syncDrawerBackdrop();
}

function setControlSheetExpanded(isExpanded) {
  state.sheetExpanded = isExpanded;
  document.body.classList.toggle("sheet-collapsed", !isExpanded);
  elements.sheetHandle?.setAttribute("aria-expanded", String(isExpanded));
  elements.sheetHandle?.setAttribute("aria-label", isExpanded ? "Collapse controls" : "Expand controls");
}

function startSheetGesture(event) {
  if (!elements.sheetHandle) {
    return;
  }
  event.preventDefault();
  elements.sheetHandle.setPointerCapture(event.pointerId);
  state.sheetGesture = {
    id: event.pointerId,
    moved: false,
    startY: event.clientY,
  };
  document.body.classList.add("sheet-dragging");
}

function moveSheetGesture(event) {
  const gesture = state.sheetGesture;
  if (!gesture || gesture.id !== event.pointerId) {
    return;
  }
  if (Math.abs(event.clientY - gesture.startY) > 6) {
    gesture.moved = true;
  }
}

function endSheetGesture(event) {
  const gesture = state.sheetGesture;
  if (!gesture || gesture.id !== event.pointerId) {
    return;
  }
  const deltaY = event.clientY - gesture.startY;
  state.sheetGesture = null;
  document.body.classList.remove("sheet-dragging");
  if (deltaY > 24) {
    setControlSheetExpanded(false);
  } else if (deltaY < -24) {
    setControlSheetExpanded(true);
  } else {
    setControlSheetExpanded(!state.sheetExpanded);
  }
}

function syncDrawerBackdrop() {
  const isOpen = [elements.presetDrawer, elements.advancedDrawer].some((drawer) => drawer.classList.contains("is-open"));
  elements.pieceDrawerBackdrop.hidden = !isOpen;
  document.body.classList.toggle("drawer-open", isOpen);
}

function syncPieceDetailMode() {
  elements.pieceDrawer.classList.toggle("show-piece-details", elements.pieceDetailToggle.open);
}

function queueHasRider(queue = state.queue) {
  return queue.some((pieceId) => pieceForId(pieceId).riderVectors.length > 0);
}

function cappedStepsForQueue(steps, queue) {
  return queueHasRider(queue) && steps > RIDER_STEP_CAP ? RIDER_STEP_CAP : steps;
}

function queuesMatch(left, right) {
  return left.length === right.length && left.every((pieceId, index) => pieceId === right[index]);
}

function applyPreset(presetId) {
  const preset = PRESET_LIBRARY.find((item) => item.id === presetId);
  if (!preset) {
    return;
  }
  state.queue = preset.queue.slice(0, MAX_QUEUE_LENGTH);
  renderQueue();
  cancelActiveRun();
  state.activeResult = null;
  state.tileIndexReady = false;
  state.tileIndex = new Map();
  state.occupiedIndex = new Map();
  state.targetSteps = cappedTargetSteps(preset.steps);
  syncTargetInputs(state.targetSteps);
  closeDrawers();
  flashQueueMessage(`Loaded ${preset.name}.`);
  scheduleSimulation(0);
}

function setUiHidden(isHidden) {
  state.uiHidden = isHidden;
  document.body.classList.toggle("ui-hidden", isHidden);
  elements.revealUi.hidden = !isHidden;
  elements.hideUi.setAttribute("aria-pressed", String(isHidden));
  if (isHidden) {
    closeDrawers();
  }
  window.requestAnimationFrame(drawBoard);
}

function shouldIgnoreGlobalShortcut(event) {
  const tagName = event.target?.tagName?.toLowerCase();
  return tagName === "input" || tagName === "textarea" || tagName === "select" || event.target?.isContentEditable;
}

function growStepsRange(steps) {
  const currentMax = Number(elements.stepsRange.max);
  if (steps > currentMax) {
    elements.stepsRange.max = String(nextRoundSliderMax(steps));
  }
}

function nextRoundSliderMax(value) {
  const magnitude = 10 ** Math.max(1, Math.floor(Math.log10(value)) - 1);
  return Math.ceil(value / magnitude) * magnitude;
}

function scheduleSimulation(delay) {
  window.clearTimeout(state.runTimer);
  if (state.queue.length < 2) {
    state.activeSnapshot = emptySnapshot();
    state.running = false;
    updatePanels();
    drawBoard();
    return;
  }
  state.runTimer = window.setTimeout(startSimulation, delay);
}

function startSimulation() {
  cancelActiveRun();
  const runId = state.runId + 1;
  state.runId = runId;
  state.running = true;
  state.activeResult = null;
  state.tileIndexReady = false;
  state.tileIndex = new Map();
  state.occupiedIndex = new Map();
  state.activeSnapshot = {
    bounds: { maxX: 4, maxY: 4, minX: -4, minY: -4 },
    completed: 0,
    counts: state.queue.map(() => 0),
    players: buildPlayersFromQueue(state.queue),
    recent: [],
    sequenceTerms: state.queue.map(() => []),
  };
  renderQueueMessage();
  updatePanels();

  const config = buildSimulationConfig();
  if (canUseWorker()) {
    startWorkerRun(runId, config);
  } else {
    startFallbackRun(runId, config);
  }
}

function canUseWorker() {
  return typeof Worker !== "undefined";
}

function startWorkerRun(runId, config) {
  try {
    state.workerMode = "worker";
    const worker = createSimulationWorker();
    state.worker = worker;
    worker.onmessage = (event) => handleWorkerMessage(runId, config, event.data);
    worker.onerror = (event) => {
      console.error("Simulation worker failed", event.message);
      worker.terminate();
      state.worker = null;
      if (state.runId === runId) {
        startFallbackRun(runId, config);
      }
    };
    worker.postMessage({ config, runId });
  } catch (error) {
    console.warn("Falling back to chunked main-thread simulation", error);
    startFallbackRun(runId, config);
  }
}

function createSimulationWorker() {
  if (typeof Blob !== "undefined" && typeof URL !== "undefined") {
    const workerUrl = URL.createObjectURL(new Blob([createWorkerSource()], { type: "text/javascript" }));
    const worker = new Worker(workerUrl);
    setTimeout(() => URL.revokeObjectURL(workerUrl), 1000);
    return worker;
  }
  return new Worker("simulation-worker.js");
}

function createWorkerSource() {
  return `
    "use strict";
    const simulationEngine = (${createSimulationEngine.toString()})();
    self.onmessage = (event) => {
      const { config, runId } = event.data;
      try {
        const game = simulationEngine.createGame(config);
        game.runToTarget(
          config.targetSteps,
          (snapshot) => self.postMessage({ runId, snapshot, type: "progress" }),
          config.progressEvery
        );
        const result = game.finalResult();
        const transferables = [result.indices.buffer, result.playerIds.buffer, result.xs.buffer, result.ys.buffer];
        if (result.tileColors) {
          transferables.push(result.tileColors.buffer);
        }
        if (result.attacked) {
          transferables.push(result.attacked.buffer);
        }
        self.postMessage(
          { result, runId, type: "complete" },
          transferables
        );
      } catch (error) {
        self.postMessage({
          message: error instanceof Error ? error.message : String(error),
          runId,
          type: "error",
        });
      }
    };
  `;
}

function handleWorkerMessage(runId, config, message) {
  if (runId !== state.runId) {
    return;
  }

  if (message.type === "progress") {
    state.activeSnapshot = message.snapshot;
    updatePanels();
    return;
  }

  if (message.type === "complete") {
    state.running = false;
    state.activeResult = message.result;
    state.activeSnapshot = message.result;
    state.worker = null;
    if (isDenseResult(message.result)) {
      state.tileIndexReady = true;
      state.indexing = false;
      state.indexProgress = 100;
      prepareDensePreview(message.result);
    } else {
      startTileIndexBuild(message.result);
    }
    updatePanels();
    drawBoard();
  }

  if (message.type === "error") {
    console.warn("Simulation worker reported an error", message.message);
    if (state.worker) {
      state.worker.terminate();
      state.worker = null;
    }
    startFallbackRun(runId, config);
  }
}

function startFallbackRun(runId, config) {
  state.workerMode = "main thread";
  const game = simulationEngine.createGame(config);
  const stepChunk = () => {
    if (runId !== state.runId) {
      return;
    }
    const deadline = performance.now() + 10;
    while (game.completed < config.targetSteps && performance.now() < deadline) {
      game.step();
    }

    state.activeSnapshot = game.snapshot();
    updatePanels();

    if (game.completed < config.targetSteps) {
      state.fallbackFrame = requestAnimationFrame(stepChunk);
      return;
    }

    state.running = false;
    state.activeResult = game.finalResult();
    state.activeSnapshot = state.activeResult;
    if (isDenseResult(state.activeResult)) {
      state.tileIndexReady = true;
      state.indexing = false;
      state.indexProgress = 100;
      prepareDensePreview(state.activeResult);
    } else {
      startTileIndexBuild(state.activeResult);
    }
    updatePanels();
    drawBoard();
  };
  stepChunk();
}

function cancelActiveRun() {
  window.clearTimeout(state.runTimer);
  cancelAnimationFrame(state.fallbackFrame);
  cancelAnimationFrame(state.indexBuildFrame);
  if (state.worker) {
    state.worker.terminate();
    state.worker = null;
  }
  state.running = false;
  state.indexing = false;
  state.runId += 1;
}

function emptySnapshot() {
  return {
    bounds: { maxX: 4, maxY: 4, minX: -4, minY: -4 },
    completed: 0,
    counts: [],
    players: [],
    recent: [],
    sequenceTerms: [],
  };
}

function startTileIndexBuild(result) {
  state.tileIndex = new Map();
  state.occupiedIndex = new Map();
  state.tileIndexReady = false;
  state.indexing = true;
  state.indexProgress = 0;
  const buildId = state.runId;
  let index = 0;

  const buildChunk = () => {
    if (buildId !== state.runId) {
      return;
    }
    const end = Math.min(result.xs.length, index + TILE_INDEX_CHUNK);
    for (; index < end; index += 1) {
      const x = result.xs[index];
      const y = result.ys[index];
      const key = simulationEngine.packCoord(x, y);
      const tileKey = tileKeyForCoord(x, y);
      let bucket = state.tileIndex.get(tileKey);
      if (!bucket) {
        bucket = [];
        state.tileIndex.set(tileKey, bucket);
      }
      bucket.push(index);
      state.occupiedIndex.set(key, result.playerIds[index]);
    }

    if (index < result.xs.length) {
      state.indexProgress = Math.round((index / result.xs.length) * 100);
      renderQueueMessage();
      updateBoardStatus(state.activeSnapshot || emptySnapshot());
      state.indexBuildFrame = requestAnimationFrame(buildChunk);
      return;
    }

    state.tileIndexReady = true;
    state.indexing = false;
    state.indexProgress = 100;
    renderQueueMessage();
    updateBoardStatus(state.activeSnapshot || emptySnapshot());
    drawBoard();
  };

  buildChunk();
}

function tileKeyForCoord(x, y) {
  return `${Math.floor(x / TILE_CELLS)},${Math.floor(y / TILE_CELLS)}`;
}

function updatePanels() {
  const snapshot = state.activeSnapshot || emptySnapshot();
  updateStats(snapshot);
  updateSequence(snapshot);
  updateRecent(snapshot);
  renderQueueMessage();
  updateBoardStatus(snapshot);
}

function updateBoardStatus(snapshot) {
  if (state.queue.length < 2) {
    elements.boardStatus.hidden = false;
    elements.boardStatusTitle.textContent = "Queue needs two pieces";
    elements.boardStatusDetail.textContent = "Add at least two cards to start the simulation.";
    elements.boardStatusFill.style.width = "0%";
    return;
  }

  if (state.indexing) {
    elements.boardStatus.hidden = false;
    elements.boardStatusTitle.textContent = "Preparing map view";
    elements.boardStatusDetail.textContent = `${state.indexProgress}% indexed`;
    elements.boardStatusFill.style.width = `${state.indexProgress}%`;
    return;
  }

  if (state.running) {
    const progress = state.targetSteps ? Math.min(100, (snapshot.completed / state.targetSteps) * 100) : 100;
    elements.boardStatus.hidden = false;
    elements.boardStatusTitle.textContent = "Building spiral";
    elements.boardStatusDetail.textContent = `${snapshot.completed.toLocaleString()} / ${state.targetSteps.toLocaleString()} placements`;
    elements.boardStatusFill.style.width = `${progress}%`;
    return;
  }

  elements.boardStatus.hidden = true;
}

function updateStats(snapshot) {
  const placementStat = createStat("placements", snapshot.completed, "placementCount");
  const playerStats = snapshot.players.map((player, index) => {
    const stat = createStat(`${player.name.toLowerCase()} ${player.pieceName.toLowerCase()}`, snapshot.counts[index] || 0);
    stat.style.setProperty("--player-color", player.color);
    stat.classList.add("player-stat");
    return stat;
  });
  elements.summaryStats.replaceChildren(placementStat, ...playerStats);
}

function updateSequence(snapshot) {
  const nodes = snapshot.players.map((player, index) => {
    const line = document.createElement("p");
    const label = document.createElement("span");
    const terms = snapshot.sequenceTerms[index] || [];
    label.className = "sequence-label";
    label.style.color = player.color;
    label.textContent = `${player.name} ${player.pieceName}:`;
    line.append(label, document.createTextNode(terms.join(", ")));
    return line;
  });
  elements.sequenceList.replaceChildren(...nodes);
}

function updateRecent(snapshot) {
  const recent = snapshot.recent.slice().reverse();
  elements.placementList.replaceChildren(
    ...recent.map((placement) => {
      const player = snapshot.players[placement.playerIndex];
      const item = document.createElement("li");
      const dot = document.createElement("span");
      const playerText = document.createElement("span");
      const detail = document.createElement("span");
      dot.className = "dot";
      dot.style.background = player.color;
      playerText.className = "placement-player";
      playerText.textContent = player.symbol;
      detail.textContent = `#${placement.turnNumber} i=${placement.index} (${placement.x}, ${placement.y})`;
      item.append(dot, playerText, detail);
      return item;
    })
  );
}

function createStat(labelText, value, valueId = "") {
  const stat = document.createElement("span");
  const valueNode = document.createElement("strong");
  if (valueId) {
    valueNode.id = valueId;
  }
  valueNode.textContent = Number(value || 0).toLocaleString();
  stat.append(valueNode, document.createTextNode(` ${labelText}`));
  return stat;
}

function resizeCanvas() {
  const rect = elements.board.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.floor(rect.width * dpr));
  const height = Math.max(1, Math.floor(rect.height * dpr));

  if (elements.board.width !== width || elements.board.height !== height) {
    elements.board.width = width;
    elements.board.height = height;
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function isDenseResult(result) {
  return Boolean(result?.mode === "dense" && result.board && result.tileColors);
}

function prepareDensePreview(result) {
  if (!isDenseResult(result) || result.previewCanvas) {
    return result?.previewCanvas || null;
  }

  const { board } = result;
  const preview = document.createElement("canvas");
  preview.width = board.size;
  preview.height = board.size;
  const previewCtx = preview.getContext("2d", { alpha: false });
  const imageData = previewCtx.createImageData(board.size, board.size);
  const data = imageData.data;
  const palette = result.players.map((player) => cssColorToRgb(player.color));

  data.fill(255);
  for (let offset = 0; offset < result.tileColors.length; offset += 1) {
    const colorIndex = result.tileColors[offset] - 1;
    if (colorIndex < 0) {
      continue;
    }
    const rgb = palette[colorIndex];
    const pixel = offset * 4;
    data[pixel] = rgb[0];
    data[pixel + 1] = rgb[1];
    data[pixel + 2] = rgb[2];
    data[pixel + 3] = 255;
  }

  previewCtx.putImageData(imageData, 0, 0);
  result.previewCanvas = preview;
  result.previewPalette = palette;
  return preview;
}

function cssColorToRgb(color) {
  if (!cssColorToRgb.context) {
    cssColorToRgb.context = document.createElement("canvas").getContext("2d");
  }
  const parser = cssColorToRgb.context;
  parser.fillStyle = "#000000";
  parser.fillStyle = color;
  const normalized = parser.fillStyle;
  if (normalized.startsWith("#")) {
    const hex = normalized.slice(1);
    const value = Number.parseInt(hex.length === 3 ? hex.replace(/(.)/g, "$1$1") : hex.slice(0, 6), 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  }
  const match = normalized.match(/\d+(\.\d+)?/g);
  if (!match) {
    return [0, 0, 0];
  }
  return match.slice(0, 3).map((part) => clamp(Math.round(Number(part)), 0, 255));
}

function drawBoard() {
  resizeCanvas();
  const snapshot = state.activeSnapshot || emptySnapshot();
  const layout = boardLayout(snapshot);
  const { width, height, bounds, originX, originY, cellSize } = layout;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#f7fafc";
  ctx.fillRect(0, 0, width, height);

  if (isDenseResult(state.activeResult)) {
    drawDenseBoard(state.activeResult, bounds, originX, originY, cellSize, width, height);
    return;
  }

  drawGrid(bounds, originX, originY, cellSize);

  if (elements.showSpiral.checked) {
    drawSpiral(snapshot, bounds, originX, originY, cellSize);
  }

  if (elements.showAttacks.checked && state.activeResult && state.tileIndexReady) {
    drawAttackOverlay(state.activeResult, bounds, originX, originY, cellSize, visibleWorldBounds(bounds, originX, originY, cellSize, width, height));
  }

  if (state.activeResult) {
    drawPieces(state.activeResult, bounds, originX, originY, cellSize, width, height);
  }

  if (elements.showIndexes.checked && cellSize >= 18 && state.activeResult) {
    drawIndexes(state.activeResult, bounds, originX, originY, cellSize, width, height);
  }
}

function boardLayout(snapshot) {
  const rect = elements.board.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  const bounds = paddedBounds(snapshot.bounds);
  const cols = bounds.maxX - bounds.minX + 1;
  const rows = bounds.maxY - bounds.minY + 1;
  const baseCellSize = Math.min(Math.max(20, width - 44) / cols, Math.max(20, height - 44) / rows);
  const cellSize = Math.max(1.2, baseCellSize * state.zoom);
  const boardWidth = cols * cellSize;
  const boardHeight = rows * cellSize;
  const fitOriginX = (width - boardWidth) / 2;
  const fitOriginY = (height - boardHeight) / 2;

  return {
    bounds,
    cellSize,
    fitOriginX,
    fitOriginY,
    height,
    originX: fitOriginX + state.panX,
    originY: fitOriginY + state.panY,
    width,
  };
}

function paddedBounds(bounds) {
  const padding = elements.showAttacks.checked ? 3 : 2;
  return {
    maxX: bounds.maxX + padding,
    maxY: bounds.maxY + padding,
    minX: bounds.minX - padding,
    minY: bounds.minY - padding,
  };
}

function drawGrid(bounds, originX, originY, cellSize, fillBoard = true) {
  const cols = bounds.maxX - bounds.minX + 1;
  const rows = bounds.maxY - bounds.minY + 1;
  if (fillBoard) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(originX, originY, cols * cellSize, rows * cellSize);
  }

  if (cellSize < 6) {
    return;
  }

  ctx.strokeStyle = "#dce4ea";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let col = 0; col <= cols; col += 1) {
    const x = originX + col * cellSize;
    ctx.moveTo(x, originY);
    ctx.lineTo(x, originY + rows * cellSize);
  }
  for (let row = 0; row <= rows; row += 1) {
    const y = originY + row * cellSize;
    ctx.moveTo(originX, y);
    ctx.lineTo(originX + cols * cellSize, y);
  }
  ctx.stroke();
}

function drawDenseBoard(result, bounds, originX, originY, cellSize, width, height) {
  const cols = bounds.maxX - bounds.minX + 1;
  const rows = bounds.maxY - bounds.minY + 1;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(originX, originY, cols * cellSize, rows * cellSize);
  drawDensePatternBitmap(result, bounds, originX, originY, cellSize, width, height);

  const visible = visibleWorldBounds(bounds, originX, originY, cellSize, width, height);
  if (elements.showAttacks.checked) {
    drawDenseAttackOverlay(result, bounds, originX, originY, cellSize, visible);
  }
  if (elements.showSpiral.checked) {
    drawDenseTrace(result, bounds, originX, originY, cellSize, visible);
  }
  drawGrid(bounds, originX, originY, cellSize, false);
  if (elements.showIndexes.checked && cellSize >= 18) {
    drawDenseIndexes(result, bounds, originX, originY, cellSize, visible);
  }
}

function drawDensePatternBitmap(result, bounds, originX, originY, cellSize, width, height) {
  const preview = prepareDensePreview(result);
  if (!preview) {
    return;
  }

  const view = clampDenseView(result.board, visibleWorldBounds(bounds, originX, originY, cellSize, width, height));
  if (!view) {
    return;
  }

  const sourceX = view.minX - result.board.minX;
  const sourceY = result.board.maxY - view.maxY;
  const sourceWidth = view.maxX - view.minX + 1;
  const sourceHeight = view.maxY - view.minY + 1;
  const destX = originX + (view.minX - bounds.minX) * cellSize;
  const destY = originY + (bounds.maxY - view.maxY) * cellSize;

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    preview,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    destX,
    destY,
    sourceWidth * cellSize,
    sourceHeight * cellSize
  );
}

function drawDenseAttackOverlay(result, bounds, originX, originY, cellSize, visible) {
  const view = clampDenseView(result.board, visible);
  if (!view || (view.maxX - view.minX + 1) * (view.maxY - view.minY + 1) > 70000) {
    return;
  }

  for (let y = view.minY; y <= view.maxY; y += 1) {
    for (let x = view.minX; x <= view.maxX; x += 1) {
      const offset = denseResultOffset(result.board, x, y);
      if (result.tileColors[offset] || !result.attacked[offset]) {
        continue;
      }
      const playerIndex = firstBitIndex(result.attacked[offset]);
      ctx.fillStyle = result.players[playerIndex]?.attackColor || "rgba(34, 116, 165, 0.08)";
      const [left, top] = cellCorner(x, y, bounds, originX, originY, cellSize);
      ctx.fillRect(left + 1, top + 1, Math.max(1, cellSize - 2), Math.max(1, cellSize - 2));
    }
  }
}

function drawDenseTrace(result, bounds, originX, originY, cellSize, visible) {
  if (cellSize < 5) {
    return;
  }

  const view = clampDenseView(result.board, visible);
  if (!view || (view.maxX - view.minX + 1) * (view.maxY - view.minY + 1) > 40000) {
    return;
  }

  ctx.strokeStyle = cellSize < 14 ? "rgba(34, 116, 165, 0.24)" : "rgba(34, 116, 165, 0.34)";
  ctx.lineWidth = Math.max(1, Math.min(4, cellSize * 0.08));
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();

  for (let y = view.minY; y <= view.maxY; y += 1) {
    for (let x = view.minX; x <= view.maxX; x += 1) {
      const index = spiralIndexForCoord(x, y);
      if (index >= result.board.maxIndex) {
        continue;
      }
      const next = spiralCoord(index + 1);
      if (!inDenseResultBoard(result.board, next.x, next.y)) {
        continue;
      }
      const [startX, startY] = cellCenter(x, y, bounds, originX, originY, cellSize);
      const [endX, endY] = cellCenter(next.x, next.y, bounds, originX, originY, cellSize);
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
    }
  }

  ctx.stroke();
}

function drawDenseIndexes(result, bounds, originX, originY, cellSize, visible) {
  const view = clampDenseView(result.board, visible);
  if (!view || (view.maxX - view.minX + 1) * (view.maxY - view.minY + 1) > 6000) {
    return;
  }

  const maxRing = Math.max(Math.abs(view.minX), Math.abs(view.maxX), Math.abs(view.minY), Math.abs(view.maxY));
  const largestVisibleLabel = (2 * maxRing + 1) * (2 * maxRing + 1) - 1;
  const fontSize = clamp(Math.floor(cellSize * 0.28), 9, 18);
  ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
  if (ctx.measureText(String(largestVisibleLabel)).width > cellSize * 0.72) {
    return;
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let y = view.minY; y <= view.maxY; y += 1) {
    for (let x = view.minX; x <= view.maxX; x += 1) {
      const offset = denseResultOffset(result.board, x, y);
      const value = result.tileColors[offset];
      const [centerX, centerY] = cellCenter(x, y, bounds, originX, originY, cellSize);
      ctx.fillStyle = value ? "#ffffff" : "#607080";
      ctx.fillText(String(spiralIndexForCoord(x, y)), centerX, centerY + 0.5);
    }
  }
}

function drawSpiral(snapshot, bounds, originX, originY, cellSize) {
  const maxIndex = Math.min(maxScannedIndexEstimate(snapshot.completed), 10000);
  if (maxIndex < 2 || cellSize < 4) {
    return;
  }

  const cursor = new SpiralPreviewCursor();
  ctx.strokeStyle = "rgba(34, 116, 165, 0.32)";
  ctx.lineWidth = Math.max(1, Math.min(3, cellSize * 0.08));
  ctx.beginPath();
  let started = false;
  for (let index = 0; index <= maxIndex; index += 1) {
    cursor.next();
    if (!inBounds(cursor, bounds)) {
      continue;
    }
    const [x, y] = cellCenter(cursor.x, cursor.y, bounds, originX, originY, cellSize);
    if (!started) {
      ctx.moveTo(x, y);
      started = true;
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
}

function maxScannedIndexEstimate(completed) {
  return Math.max(64, completed * 3);
}

class SpiralPreviewCursor {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.index = -1;
    this.directionIndex = 0;
    this.sideLength = 1;
    this.stepInSide = 0;
    this.sidesAtLength = 0;
    this.directions = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  }

  next() {
    if (this.index === -1) {
      this.index = 0;
      return;
    }
    const direction = this.directions[this.directionIndex];
    this.x += direction[0];
    this.y += direction[1];
    this.index += 1;
    this.stepInSide += 1;
    if (this.stepInSide === this.sideLength) {
      this.stepInSide = 0;
      this.directionIndex = (this.directionIndex + 1) % this.directions.length;
      this.sidesAtLength += 1;
      if (this.sidesAtLength === 2) {
        this.sidesAtLength = 0;
        this.sideLength += 1;
      }
    }
  }
}

function drawPieces(result, bounds, originX, originY, cellSize, width, height) {
  const visible = visibleWorldBounds(bounds, originX, originY, cellSize, width, height);
  const indices = visiblePlacementIndices(result, visible);
  for (const index of indices) {
    drawPieceAt(result, index, bounds, originX, originY, cellSize);
  }
}

function drawIndexes(result, bounds, originX, originY, cellSize, width, height) {
  const visible = visibleWorldBounds(bounds, originX, originY, cellSize, width, height);
  const indices = visiblePlacementIndices(result, visible);
  ctx.fillStyle = "rgba(96, 112, 128, 0.78)";
  ctx.font = `650 ${Math.max(8, cellSize * 0.22)}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  for (const index of indices) {
    const [x, y] = cellCenter(result.xs[index], result.ys[index], bounds, originX, originY, cellSize);
    ctx.fillText(String(result.indices[index]), x, y + cellSize * 0.48);
  }
}

function drawPieceAt(result, index, bounds, originX, originY, cellSize) {
  const playerIndex = result.playerIds[index];
  const definition = result.players[playerIndex];
  const [x, y] = cellCenter(result.xs[index], result.ys[index], bounds, originX, originY, cellSize);

  if (cellSize < 4) {
    const [left, top] = cellCorner(result.xs[index], result.ys[index], bounds, originX, originY, cellSize);
    ctx.fillStyle = definition.color;
    ctx.fillRect(left, top, Math.max(1, cellSize), Math.max(1, cellSize));
    return;
  }

  ctx.beginPath();
  ctx.fillStyle = definition.color;
  ctx.arc(x, y, Math.max(1.7, cellSize * 0.34), 0, Math.PI * 2);
  ctx.fill();

  if (cellSize >= 16) {
    const symbolSize = Math.max(7, Math.min(cellSize * 0.38, (cellSize * 0.72) / definition.symbol.length));
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 ${symbolSize}px ui-sans-serif, system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(definition.symbol, x, y + 0.5);
  }
}

function visiblePlacementIndices(result, visible) {
  if (!state.tileIndexReady) {
    const limit = Math.min(result.xs.length, 12000);
    return Array.from({ length: limit }, (_, index) => index);
  }

  const indices = [];
  const minTileX = Math.floor(visible.minX / TILE_CELLS);
  const maxTileX = Math.floor(visible.maxX / TILE_CELLS);
  const minTileY = Math.floor(visible.minY / TILE_CELLS);
  const maxTileY = Math.floor(visible.maxY / TILE_CELLS);
  for (let tileX = minTileX; tileX <= maxTileX; tileX += 1) {
    for (let tileY = minTileY; tileY <= maxTileY; tileY += 1) {
      const bucket = state.tileIndex.get(`${tileX},${tileY}`);
      if (bucket) {
        indices.push(...bucket);
      }
    }
  }
  return indices;
}

function drawAttackOverlay(result, bounds, originX, originY, cellSize, visible) {
  const sourceBounds = {
    maxX: visible.maxX + 5,
    maxY: visible.maxY + 5,
    minX: visible.minX - 5,
    minY: visible.minY - 5,
  };
  const sources = visiblePlacementIndices(result, sourceBounds);
  for (const placementIndex of sources) {
    const player = result.players[result.playerIds[placementIndex]];
    ctx.fillStyle = player.attackColor;
    for (const [dx, dy] of player.leaperOffsets) {
      fillAttackCell(result.xs[placementIndex] + dx, result.ys[placementIndex] + dy, bounds, originX, originY, cellSize, visible);
    }
    for (const vector of player.riderVectors) {
      drawRiderAttackRay(result.xs[placementIndex], result.ys[placementIndex], vector, bounds, originX, originY, cellSize, visible);
    }
  }
}

function drawRiderAttackRay(startX, startY, vector, bounds, originX, originY, cellSize, visible) {
  const maxSteps = Math.min(vector.maxSteps || 512, 512);
  for (let step = 1; step <= maxSteps; step += 1) {
    const x = startX + vector.dx * step;
    const y = startY + vector.dy * step;
    if (pastVisibleBounds(x, y, vector.dx, vector.dy, visible)) {
      break;
    }
    fillAttackCell(x, y, bounds, originX, originY, cellSize, visible);
    if (state.occupiedIndex.has(simulationEngine.packCoord(x, y))) {
      break;
    }
  }
}

function fillAttackCell(x, y, bounds, originX, originY, cellSize, visible) {
  if (!inBounds({ x, y }, visible) || state.occupiedIndex.has(simulationEngine.packCoord(x, y))) {
    return;
  }
  const [left, top] = cellCorner(x, y, bounds, originX, originY, cellSize);
  ctx.fillRect(left + 1, top + 1, Math.max(1, cellSize - 2), Math.max(1, cellSize - 2));
}

function pastVisibleBounds(x, y, dx, dy, visible) {
  return (
    (dx > 0 && x > visible.maxX) ||
    (dx < 0 && x < visible.minX) ||
    (dy > 0 && y > visible.maxY) ||
    (dy < 0 && y < visible.minY)
  );
}

function visibleWorldBounds(bounds, originX, originY, cellSize, width, height) {
  return {
    maxX: Math.ceil((width - originX) / cellSize + bounds.minX) + 2,
    maxY: Math.ceil(bounds.maxY - (0 - originY) / cellSize) + 2,
    minX: Math.floor((0 - originX) / cellSize + bounds.minX) - 2,
    minY: Math.floor(bounds.maxY - (height - originY) / cellSize) - 2,
  };
}

function cellCorner(x, y, bounds, originX, originY, cellSize) {
  const col = x - bounds.minX;
  const row = bounds.maxY - y;
  return [originX + col * cellSize, originY + row * cellSize];
}

function cellCenter(x, y, bounds, originX, originY, cellSize) {
  const [left, top] = cellCorner(x, y, bounds, originX, originY, cellSize);
  return [left + cellSize / 2, top + cellSize / 2];
}

function inBounds(cell, bounds) {
  return cell.x >= bounds.minX && cell.x <= bounds.maxX && cell.y >= bounds.minY && cell.y <= bounds.maxY;
}

function clampDenseView(board, view) {
  const minX = clamp(view.minX, board.minX, board.maxX);
  const maxX = clamp(view.maxX, board.minX, board.maxX);
  const minY = clamp(view.minY, board.minY, board.maxY);
  const maxY = clamp(view.maxY, board.minY, board.maxY);
  if (minX > maxX || minY > maxY) {
    return null;
  }
  return { maxX, maxY, minX, minY };
}

function denseResultOffset(board, x, y) {
  return (board.maxY - y) * board.size + (x - board.minX);
}

function inDenseResultBoard(board, x, y) {
  return x >= board.minX && x <= board.maxX && y >= board.minY && y <= board.maxY;
}

function firstBitIndex(mask) {
  return Math.max(0, Math.log2(mask & -mask));
}

function ringForSpiralIndex(index) {
  return Math.ceil((Math.sqrt(index + 1) - 1) / 2);
}

function spiralCoord(index) {
  if (index === 0) {
    return { x: 0, y: 0 };
  }

  const ring = ringForSpiralIndex(index);
  const start = (2 * ring - 1) * (2 * ring - 1);
  const side = 2 * ring;
  const offset = index - start;

  if (offset < side) {
    return { x: ring, y: -ring + 1 + offset };
  }
  if (offset < 2 * side) {
    return { x: ring - 1 - (offset - side), y: ring };
  }
  if (offset < 3 * side) {
    return { x: -ring, y: ring - 1 - (offset - 2 * side) };
  }
  return { x: -ring + 1 + (offset - 3 * side), y: -ring };
}

function spiralIndexForCoord(x, y) {
  if (x === 0 && y === 0) {
    return 0;
  }

  const ring = Math.max(Math.abs(x), Math.abs(y));
  const start = (2 * ring - 1) * (2 * ring - 1);
  const side = 2 * ring;

  if (x === ring && y >= -ring + 1) {
    return start + y + ring - 1;
  }
  if (y === ring) {
    return start + side + (ring - 1 - x);
  }
  if (x === -ring) {
    return start + 2 * side + (ring - 1 - y);
  }
  return start + 3 * side + (x + ring - 1);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function boardPointFromEvent(event) {
  const rect = elements.board.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function viewportCenterPoint() {
  const rect = elements.board.getBoundingClientRect();
  return { x: rect.width / 2, y: rect.height / 2 };
}

function changeZoomAt(point, factor, shouldUpdate = true) {
  const snapshot = state.activeSnapshot || emptySnapshot();
  const before = boardLayout(snapshot);
  const nextZoom = clamp(state.zoom * factor, MIN_ZOOM, MAX_ZOOM);
  if (nextZoom === state.zoom) {
    return;
  }

  const boardX = (point.x - before.originX) / before.cellSize;
  const boardY = (point.y - before.originY) / before.cellSize;
  state.zoom = nextZoom;
  const after = boardLayout(snapshot);
  state.panX = point.x - boardX * after.cellSize - after.fitOriginX;
  state.panY = point.y - boardY * after.cellSize - after.fitOriginY;
  if (shouldUpdate) {
    drawBoard();
  }
}

function panBy(dx, dy, shouldUpdate = true) {
  state.panX += dx;
  state.panY += dy;
  if (shouldUpdate) {
    drawBoard();
  }
}

function resetView() {
  state.zoom = 1;
  state.panX = 0;
  state.panY = 0;
  drawBoard();
}

function pointerGesture() {
  const points = [...pointerState.activePointers.values()];
  if (!points.length) {
    return null;
  }
  const center = points.reduce(
    (accumulator, point) => ({ x: accumulator.x + point.x / points.length, y: accumulator.y + point.y / points.length }),
    { x: 0, y: 0 }
  );
  if (points.length < 2) {
    return { center, distance: 0 };
  }
  const [first, second] = points;
  return { center, distance: Math.hypot(second.x - first.x, second.y - first.y) };
}

function syncPointerCursor() {
  elements.board.classList.toggle("is-panning", pointerState.activePointers.size > 0);
}

function animate(time) {
  if (!state.playing) {
    return;
  }
  if (!state.lastPlayTime) {
    state.lastPlayTime = time;
  }
  const elapsed = Math.min(250, time - state.lastPlayTime);
  state.lastPlayTime = time;
  state.stepCarry += (elapsed / 1000) * Number(elements.speedRange.value);
  const stepsToAdd = Math.floor(state.stepCarry);
  if (stepsToAdd > 0) {
    state.stepCarry -= stepsToAdd;
    setTargetSteps(state.targetSteps + stepsToAdd);
  }
  state.animationFrame = requestAnimationFrame(animate);
}

function togglePlayback() {
  state.playing = !state.playing;
  setIconButton(elements.playPause, state.playing ? "pause" : "play", state.playing ? "Pause" : "Play");
  if (state.playing) {
    state.lastPlayTime = 0;
    state.animationFrame = requestAnimationFrame(animate);
  } else {
    cancelAnimationFrame(state.animationFrame);
  }
}

function validateAgainstOeisPrefix() {
  const config = {
    players: buildPlayersFromQueue(["knight", "knight"]),
    progressEvery: 1000,
    targetSteps: 160,
  };
  const game = simulationEngine.createGame(config);
  game.runToTarget(config.targetSteps);
  const result = game.finalResult();
  const blackTerms = Array.from(result.indices)
    .filter((_, index) => result.playerIds[index] === 0)
    .sort((a, b) => a - b)
    .slice(0, OEIS_A392177_PREFIX.length);
  const ok = OEIS_A392177_PREFIX.every((term, index) => blackTerms[index] === term);
  if (!ok) {
    console.warn("OEIS A392177 prefix mismatch", blackTerms);
  }
}

elements.stepsRange.addEventListener("input", () => setTargetSteps(Number(elements.stepsRange.value)));
elements.stepsNumber.addEventListener("input", () => setTargetSteps(Number(elements.stepsNumber.value)));
elements.backStep.addEventListener("click", () => setTargetSteps(state.targetSteps - 1));
elements.forwardStep.addEventListener("click", () => setTargetSteps(state.targetSteps + 1));
elements.playPause.addEventListener("click", togglePlayback);
elements.speedRange.addEventListener("input", () => {
  elements.speedValue.value = `${elements.speedRange.value}/s`;
});
elements.presetButtons.forEach((button) => {
  button.addEventListener("click", () => setTargetSteps(Number(button.dataset.steps)));
});
elements.openPieceDrawer.addEventListener("click", () => setPieceDrawerOpen(elements.pieceDrawer.hidden));
elements.openPresetDrawer.addEventListener("click", () => setPresetDrawerOpen(true));
elements.openAdvancedDrawer.addEventListener("click", () => setAdvancedDrawerOpen(true));
elements.closePieceDrawer.addEventListener("click", () => setPieceDrawerOpen(false));
elements.closePresetDrawer.addEventListener("click", () => setPresetDrawerOpen(false));
elements.closeAdvancedDrawer.addEventListener("click", () => setAdvancedDrawerOpen(false));
elements.hideUi.addEventListener("click", () => setUiHidden(true));
elements.revealUi.addEventListener("click", () => setUiHidden(false));
elements.pieceDrawerBackdrop.addEventListener("click", closeDrawers);
elements.pieceDetailToggle.addEventListener("toggle", syncPieceDetailMode);
elements.sheetHandle?.addEventListener("pointerdown", startSheetGesture);
elements.sheetHandle?.addEventListener("pointermove", moveSheetGesture);
elements.sheetHandle?.addEventListener("pointerup", endSheetGesture);
elements.sheetHandle?.addEventListener("pointercancel", endSheetGesture);
elements.sheetHandle?.addEventListener("lostpointercapture", endSheetGesture);
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeDrawers();
    if (state.uiHidden) {
      setUiHidden(false);
    }
  }
  if (!shouldIgnoreGlobalShortcut(event) && event.key.toLowerCase() === "h") {
    setUiHidden(!state.uiHidden);
  }
});

elements.showAttacks.addEventListener("change", drawBoard);
elements.showSpiral.addEventListener("change", drawBoard);
elements.showIndexes.addEventListener("change", drawBoard);
elements.clearQueue.addEventListener("click", () => {
  state.queue = [];
  handleQueueChanged();
});
elements.resetQueue.addEventListener("click", () => {
  state.queue = DEFAULT_QUEUE.slice();
  handleQueueChanged();
});
addDropHandlers(elements.queueDropZone);

elements.board.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    const deltaScale = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 0.045 : 0.0018;
    changeZoomAt(boardPointFromEvent(event), Math.exp(-event.deltaY * deltaScale));
  },
  { passive: false }
);

elements.board.addEventListener("dblclick", (event) => {
  event.preventDefault();
  changeZoomAt(boardPointFromEvent(event), ZOOM_STEP);
});

elements.board.addEventListener("pointerdown", (event) => {
  if (event.button !== 0 && event.pointerType === "mouse") {
    return;
  }
  event.preventDefault();
  elements.board.setPointerCapture(event.pointerId);
  pointerState.activePointers.set(event.pointerId, boardPointFromEvent(event));
  pointerState.gesture = pointerGesture();
  syncPointerCursor();
});

elements.board.addEventListener("pointermove", (event) => {
  if (!pointerState.activePointers.has(event.pointerId)) {
    return;
  }
  event.preventDefault();
  const previousPoint = pointerState.activePointers.get(event.pointerId);
  const nextPoint = boardPointFromEvent(event);
  pointerState.activePointers.set(event.pointerId, nextPoint);
  if (pointerState.activePointers.size === 1 && previousPoint) {
    panBy(nextPoint.x - previousPoint.x, nextPoint.y - previousPoint.y);
    pointerState.gesture = pointerGesture();
    return;
  }
  const nextGesture = pointerGesture();
  if (pointerState.gesture && nextGesture) {
    panBy(nextGesture.center.x - pointerState.gesture.center.x, nextGesture.center.y - pointerState.gesture.center.y, false);
    if (pointerState.gesture.distance > 0 && nextGesture.distance > 0) {
      changeZoomAt(nextGesture.center, nextGesture.distance / pointerState.gesture.distance, false);
    }
    drawBoard();
  }
  pointerState.gesture = nextGesture;
});

function endBoardPointer(event) {
  pointerState.activePointers.delete(event.pointerId);
  pointerState.gesture = pointerGesture();
  syncPointerCursor();
}

elements.board.addEventListener("pointerup", endBoardPointer);
elements.board.addEventListener("pointercancel", endBoardPointer);
elements.board.addEventListener("lostpointercapture", endBoardPointer);
elements.zoomOut.addEventListener("click", () => changeZoomAt(viewportCenterPoint(), 1 / ZOOM_STEP));
elements.zoomIn.addEventListener("click", () => changeZoomAt(viewportCenterPoint(), ZOOM_STEP));
elements.fitBoard.addEventListener("click", resetView);
window.addEventListener("resize", drawBoard);

hydrateIconButtons();
renderPalette();
renderPresets();
renderQueue();
updatePresetButtons();
setControlSheetExpanded(true);
validateAgainstOeisPrefix();
scheduleSimulation(0);
