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
    self.postMessage(
      { result, runId, type: "complete" },
      [result.indices.buffer, result.playerIds.buffer, result.xs.buffer, result.ys.buffer]
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

  class FastGame {
    constructor(config) {
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

  function createGame(config) {
    return new FastGame(config);
  }

  return { createGame, packCoord, unpackX, unpackY };
}
