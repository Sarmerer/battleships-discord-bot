module.exports = class Player {
  /**
   * @param {String} id
   * @param {String} name
   * @param {String} discriminator
   */
  constructor(id, name, discriminator) {
    this._id = id;
    this._name = name;
    this._discriminator = discriminator;
    this._score = 0;
  }
  /**
   * @param {Array<Array<Number>>} map
   * @param {Boolean} state
   * @param {Object} embed
   * @param {Object} collector
   * @param {Object} chan
   */
  set chan(chan) {
    this._chan = chan;
  }
  set collector(collector) {
    this._scorellector = collector;
  }
  set embed(embed) {
    this._embed = embed;
  }
  set turn(state) {
    this._turn = state;
  }
  set map(map) {
    this._map = map;
  }
  set mapWithFog(map) {
    this._mapWithFog = map;
  }

  get id() {
    return this._id;
  }
  get name() {
    return this._name;
  }
  get discriminator() {
    return this._discriminator;
  }
  get map() {
    return this._map;
  }
  get mapWithFog() {
    return this._mapWithFog;
  }
  get score() {
    return this._score;
  }
  get turn() {
    return this._turn;
  }
  get embed() {
    return this._embed;
  }
  get collector() {
    return this._scorellector;
  }
  get chan() {
    return this._chan;
  }

  addScore() {
    this._score++;
  }
};
