"use strict";

const simulationEngine = createSimulationEngine();

self.onmessage = (event) => {
  const { config, runId } = event.data;

  try {
    const game = simulationEngine.createGame(config);
    game.runToTarget(
      config.targetSteps,
      (snapshot) => {
        self.postMessage({ runId, snapshot, type: "progress" });
      },
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
