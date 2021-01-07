const shipNames = {
  1: "sloop",
  2: "patrol boat",
  3: "submarine",
  4: "carrier",
};

module.exports = class Ship {
  constructor(size, cells) {
    this._size = size;
    this._type = getType(size);
    this._cells = cells;
    this._sunk = false;
  }
};

function getType(size) {
  return size < 1 || size > 4 ? "undefined" : shipNames[size];
}
