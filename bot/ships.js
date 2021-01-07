const shipNames = {
  1: "sloop",
  2: "patrol boat",
  3: "submarine",
  4: "carrier",
};

module.exports = class Ships {
  constructor() {
    this._ships = [];
  }
  /**
   * @param {Number} size
   * @param {Array<Object>} cells
   * @param {Array<Object>} borders
   */
  newShip(size, cells, borders) {
    this._ships.push(new Ship(size, cells, borders));
  }

  sunk(x, y) {
    let cellIndex = this.findByCoords(x, y);
    if (cellIndex === -1) return [];
    this._ships[cellIndex]._cells.find(
      (c) => c.x === x && c.y === y
    ).sunk = true;
    if (this._ships[cellIndex].cells.every((c) => c.sunk))
      return this._ships[cellIndex].cells.map((c) => [c.x, c.y]);
    return [];
  }

  findByCoords(x, y) {
    for (let i = 0; i < this._ships.length; i++) {
      let ship = this._ships[i];
      if (ship.cells.some((s) => s.x === x && s.y === y)) {
        return i;
      }
    }
    return -1;
  }

  /**
   * @param {Number} x
   * @param {Number} y
   */
  collides(x, y) {
    return (
      this._ships.some((ship) =>
        ship.cells.some((s) => s.x === x && s.y === y)
      ) ||
      this._ships.some((ship) =>
        ship.borders.some((s) => s.x === x && s.y === y)
      )
    );
  }
  get all() {
    return this._ships;
  }
};

class Ship {
  constructor(size, cells, borders) {
    this._size = size;
    this._type = getType(size);
    this._cells = cells;
    this._borders = borders;
    this._sunk = false;
  }
  sunk() {}

  get cells() {
    return this._cells;
  }
  get borders() {
    return this._borders;
  }
}

function getType(size) {
  return size < 1 || size > 4 ? "undefined" : shipNames[size];
}
