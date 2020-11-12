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
   */
  set map(map) {
    this._map = map;
  }
  /**
   * @param {Array<Array<Number>>} map
   */
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

  addScore() {  
    this._score++;
  }
};
