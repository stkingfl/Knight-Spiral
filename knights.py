from __future__ import annotations

import argparse
from dataclasses import dataclass
from itertools import islice
from typing import Iterable, Iterator

Coord = tuple[int, int]

KNIGHT_OFFSETS: tuple[Coord, ...] = (
    (2, 1),
    (1, 2),
    (-1, 2),
    (-2, 1),
    (-2, -1),
    (-1, -2),
    (1, -2),
    (2, -1),
)

OEIS_A392177_PREFIX = [
    0,
    2,
    5,
    9,
    11,
    15,
    20,
    21,
    30,
    31,
    36,
    40,
    42,
    47,
    48,
    50,
    56,
    61,
    65,
    67,
    69,
    70,
    71,
    75,
    76,
    81,
    83,
    85,
    87,
    89,
    93,
    99,
    109,
    110,
    111,
    112,
    116,
    117,
    126,
    132,
    133,
    138,
    144,
    148,
    150,
    152,
    154,
    156,
    161,
    162,
    176,
    180,
    182,
    187,
    193,
    197,
    199,
    201,
    203,
    205,
    207,
    208,
    209,
    211,
    213,
    214,
    219,
    229,
    231,
    233,
    235,
    237,
    238,
    239,
    243,
]

OEIS_A392178_PREFIX = [
    1,
    3,
    4,
    6,
    10,
    12,
    24,
    25,
    34,
    35,
    37,
    41,
    44,
    49,
    55,
    57,
    58,
    63,
    64,
    66,
    68,
    72,
    78,
    82,
    84,
    86,
    88,
    90,
    95,
    96,
    114,
    115,
    120,
    121,
    127,
    136,
    137,
    139,
    141,
    142,
    143,
    145,
    147,
    149,
    155,
    164,
    167,
    169,
    171,
    175,
    181,
    184,
    189,
    190,
    195,
    196,
    198,
    200,
    202,
    204,
    210,
    216,
    221,
    222,
    223,
    224,
    225,
    226,
    227,
    228,
    230,
    232,
    234,
    236,
]


@dataclass(frozen=True)
class PlayerRule:
    name: str
    symbol: str
    attack_offsets: tuple[Coord, ...] = KNIGHT_OFFSETS
    blocked_by: tuple[str, ...] | None = None


@dataclass(frozen=True)
class SpiralCell:
    index: int
    coord: Coord


@dataclass(frozen=True)
class Placement:
    turn_number: int
    player: str
    index: int
    coord: Coord


def square_spiral() -> Iterator[SpiralCell]:
    """Yield cells in the OEIS square spiral: 0 at (0, 0), then right/up/left/down."""
    x = y = 0
    index = 0
    yield SpiralCell(index, (x, y))

    directions = ((1, 0), (0, 1), (-1, 0), (0, -1))
    direction_index = 0
    side_length = 1

    while True:
        for _ in range(2):
            dx, dy = directions[direction_index % len(directions)]
            for _ in range(side_length):
                x += dx
                y += dy
                index += 1
                yield SpiralCell(index, (x, y))
            direction_index += 1
        side_length += 1


def spiral_cells_through(max_index: int) -> list[SpiralCell]:
    return list(islice(square_spiral(), max_index + 1))


class SpiralCursor:
    def __init__(self) -> None:
        self._cells = square_spiral()
        self.last_scanned_index = -1

    def __iter__(self) -> SpiralCursor:
        return self

    def __next__(self) -> SpiralCell:
        cell = next(self._cells)
        self.last_scanned_index = cell.index
        return cell


class KnightSpiralGame:
    def __init__(self, players: Iterable[PlayerRule]) -> None:
        self.players = tuple(players)
        if len(self.players) < 2:
            raise ValueError("At least two players/colors are required.")

        names = [player.name for player in self.players]
        if len(set(names)) != len(names):
            raise ValueError("Player/color names must be unique.")

        self.players_by_name = {player.name: player for player in self.players}
        self.cursors = {player.name: SpiralCursor() for player in self.players}
        self.pieces = {player.name: set[Coord]() for player in self.players}
        self.attacked = {player.name: set[Coord]() for player in self.players}
        self.occupied: dict[Coord, str] = {}
        self.placements: list[Placement] = []
        self._next_player_index = 0

    def blocked_attackers_for(self, player: PlayerRule) -> tuple[str, ...]:
        if player.blocked_by is not None:
            return player.blocked_by
        return tuple(other.name for other in self.players if other.name != player.name)

    def is_legal(self, player: PlayerRule, coord: Coord) -> bool:
        if coord in self.occupied:
            return False
        return all(coord not in self.attacked[name] for name in self.blocked_attackers_for(player))

    def step(self) -> Placement:
        player = self.players[self._next_player_index]
        cursor = self.cursors[player.name]

        for cell in cursor:
            if self.is_legal(player, cell.coord):
                placement = self._place(player, cell)
                self._next_player_index = (self._next_player_index + 1) % len(self.players)
                return placement

        raise RuntimeError("The spiral generator should not terminate.")

    def run_turns(self, count: int) -> list[Placement]:
        return [self.step() for _ in range(count)]

    def run_until_index_finalized(self, max_index: int) -> None:
        while any(cursor.last_scanned_index < max_index for cursor in self.cursors.values()):
            self.step()

    def sequence_up_to(self, player_name: str, max_index: int) -> list[int]:
        self.run_until_index_finalized(max_index)
        return [
            cell.index
            for cell in spiral_cells_through(max_index)
            if self.occupied.get(cell.coord) == player_name
        ]

    def sequence_terms(self, player_name: str, count: int) -> list[int]:
        if count < 1:
            return []

        max_index = 128
        while True:
            terms = self.sequence_up_to(player_name, max_index)
            if len(terms) >= count:
                return terms[:count]
            max_index *= 2

    def render_board(self, max_index: int, use_color: bool = True) -> str:
        self.run_until_index_finalized(max_index)
        cells = spiral_cells_through(max_index)
        coords = [cell.coord for cell in cells]
        xs = [x for x, _ in coords]
        ys = [y for _, y in coords]
        by_coord = {cell.coord: cell.index for cell in cells}

        rows: list[str] = []
        for y in range(max(ys), min(ys) - 1, -1):
            pieces: list[str] = []
            for x in range(min(xs), max(xs) + 1):
                coord = (x, y)
                if coord not in by_coord:
                    pieces.append(" ")
                    continue
                owner = self.occupied.get(coord)
                if owner is None:
                    pieces.append(".")
                else:
                    player = self.players_by_name[owner]
                    pieces.append(colorize(player.symbol, owner, use_color))
            rows.append(" ".join(pieces))
        return "\n".join(rows)

    def _place(self, player: PlayerRule, cell: SpiralCell) -> Placement:
        self.occupied[cell.coord] = player.name
        self.pieces[player.name].add(cell.coord)

        x, y = cell.coord
        for dx, dy in player.attack_offsets:
            self.attacked[player.name].add((x + dx, y + dy))

        placement = Placement(
            turn_number=len(self.placements),
            player=player.name,
            index=cell.index,
            coord=cell.coord,
        )
        self.placements.append(placement)
        return placement


def colorize(text: str, player_name: str, use_color: bool) -> str:
    if not use_color:
        return text

    palette = {
        "Black": "\033[97m",
        "Red": "\033[31m",
        "Blue": "\033[34m",
        "Green": "\033[32m",
        "Yellow": "\033[33m",
        "Purple": "\033[35m",
        "Cyan": "\033[36m",
    }
    return f"{palette.get(player_name, '')}{text}\033[0m"


def make_oeis_game() -> KnightSpiralGame:
    return KnightSpiralGame(
        (
            PlayerRule("Black", "B"),
            PlayerRule("Red", "R"),
        )
    )


def check_oeis_prefixes() -> None:
    black_game = make_oeis_game()
    red_game = make_oeis_game()
    black_terms = black_game.sequence_terms("Black", len(OEIS_A392177_PREFIX))
    red_terms = red_game.sequence_terms("Red", len(OEIS_A392178_PREFIX))

    if black_terms != OEIS_A392177_PREFIX:
        raise AssertionError(f"A392177 mismatch:\n{black_terms}")
    if red_terms != OEIS_A392178_PREFIX:
        raise AssertionError(f"A392178 mismatch:\n{red_terms}")


def print_placements(count: int) -> None:
    game = make_oeis_game()
    for placement in game.run_turns(count):
        x, y = placement.coord
        print(
            f"{placement.turn_number:>4}: "
            f"{placement.player:<5} index={placement.index:<5} coord=({x}, {y})"
        )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Simulate the OEIS A392177/A392178 two-color knight spiral game."
    )
    parser.add_argument("--cells", type=int, default=288, help="spiral cells to show on the board")
    parser.add_argument("--terms", type=int, default=75, help="black sequence terms to print")
    parser.add_argument("--placements", type=int, default=0, help="placement-order rows to print")
    parser.add_argument("--check", action="store_true", help="verify known OEIS prefixes")
    parser.add_argument("--no-board", action="store_true", help="skip the board display")
    parser.add_argument("--no-color", action="store_true", help="disable ANSI color")
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    if args.check:
        check_oeis_prefixes()
        print("OEIS prefix check passed for A392177 and A392178.")

    if args.placements:
        print("\nPlacement order:")
        print_placements(args.placements)

    game = make_oeis_game()
    if args.terms:
        terms = game.sequence_terms("Black", args.terms)
        print(f"\nA392177 first {args.terms} terms:")
        print(", ".join(str(term) for term in terms))

    if not args.no_board:
        max_index = max(0, args.cells - 1)
        print(f"\nBoard after finalizing cells 0..{max_index}:")
        print("Legend: B = Black, R = Red, . = unoccupied")
        print(game.render_board(max_index, use_color=not args.no_color))


if __name__ == "__main__":
    main()
