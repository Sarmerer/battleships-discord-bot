module.exports = class Game {
  /**
   * @param {Object} message
   * @param {Number} opponent
   */
  constructor(message) {
    message.reply("Your opponent is " + opponent);
    this.playerOne = message.author.id;
    this.playerTwo = opponent;
    // this.p1Map = p1Map;
    // this.p2Map = p2Map;
  }
  start() {
    console.log(this.playerOne, this.playerTwo);
  }
};
