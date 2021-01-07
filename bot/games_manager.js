module.exports = class GamesManager {
  constructor() {
    this._games = [];
  }
  /**
   *  @param {Number} p1
   *  @param {Number} p2
   */
  push(p1, p2) {
    this._games.push(p1, p2);
  }
  /**
   * @param {Number} player
   */
  splice(player) {
    let gameIndex = this._games.indexOf(`${player}`);
    this._games.splice(gameIndex, 1);
  }
  inGame(player) {
    return this._games.includes(player);
  }
};
