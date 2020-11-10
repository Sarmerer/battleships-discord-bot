const { getUserFromMention } = require("./utils");
const { MessageEmbed } = require("discord.js");
const { prefix, bot_id: botID } = require("./config.json");
const { groupEnd } = require("console");

module.exports = class Game {
  /**
   * @param {Object} message
   * @param {String} opponent
   */
  constructor(message, mention) {
    let opponent = getUserFromMention(message, mention);
    if (!opponent || opponent.bot) {
      message
        .reply(`Usage: ${prefix}play @someone`)
        .then((m) => m.delete({ timeout: 5000 }))
        .catch(console.log);
      return { error: "no opponent mentioned" };
    }
    this.playerOne = message.author.id;
    this.playerOneName = `${message.author.username}-${message.author.discriminator}`;
    this.playerTwo = opponent.id;
    this.playerTwoName = `${opponent.user.username}-${opponent.user.discriminator}`;
    this.message = message;

    this.p1chan,
      this.p2chan,
      this.p1map,
      this.p2map,
      this.p1mapFromP2view,
      this.p2mapFromP1View;
  }
  async start() {
    this.p1chan = this.message.guild.channels.cache.get("775774257066147840"); //await this.createChannelFor(
    //   this.playerOne,
    //   this.playerOneName,
    //   this.playerTwoName
    // );
    this.p2chan = this.message.guild.channels.cache.get("775774282525442088"); //await this.createChannelFor(
    //   this.playerTwo,
    //   this.playerTwoName,
    //   this.playerOneName
    // );
    this.p1map = this.generateMap();
    this.p2map = this.generateMap();
    this.p1mapFromP2view = this.p2mapFromP1View = this.generateMap({
      empty: true,
    });

    this.p1chan
      .send(
        new MessageEmbed()
          .setColor("#0099ff")
          .setTitle("You")
          .setDescription(this.mapToString(this.p1map))
          .addField("Opponent", this.mapToString(this.p2mapFromP1View))
      )
      .catch(console.log);
    this.p2chan
      .send(
        new MessageEmbed()
          .setColor("#0099ff")
          .setTitle("You")
          .setDescription(this.mapToString(this.p2map))
          .addField("Opponent", this.mapToString(this.p1mapFromP2View))
      )
      .catch(console.log);
  }

  async createChannelFor(playerID, playerName, opponentName) {
    let parent = this.message.guild.channels.cache.get("773858485167194153");
    return this.message.guild.channels
      .create(playerName, {
        parent: parent,
        reason: `to start a game with ${opponentName}`,
        permissionOverwrites: [
          {
            id: this.message.guild.roles.everyone,
            deny: ["VIEW_CHANNEL"],
          },
          {
            id: playerID,
            allow: ["VIEW_CHANNEL"],
          },
          {
            id: botID,
            allow: ["VIEW_CHANNEL"],
          },
        ],
      })
      .catch(console.log);
  }

  mapToString(map) {
    const nums = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"];
    let base = new Array(11);
    for (let i = 0; i < 11; i++) {
      let tmp = [];
      for (let j = 0; j < 11; j++) {
        tmp.push(
          i == 0 && j > 0
            ? j - 1
            : j == 0 && i > 0
            ? i - 1
            : i > 0 && j > 0
            ? map[i - 1][j - 1]
            : 0
        );
      }
      base[i] = tmp;
    }

    console.log(base);

    let res;
    for (let i = 0; i < 11; i++) {
      for (let j = 0; j < 11; j++) {
        let cell = base[i][j];
        if (j == 0 && i > 0) res += nums[cell];
        else if (i == 0 && j >= 1)
          res += ":regional_indicator_" + String.fromCharCode(96 + j) + ":";
        else
          res += cell == 1 ? "🔳" : cell == 2 ? "🟥" : cell == 3 ? "❌" : "⬛";
      }
      res += "\n";
    }
    return res;
  }

  generateMap(options = { empty: false }) {
    if (options.empty) {
      let emptyMap = new Array(10);
      for (let i = 0; i < 10; i++) {
        emptyMap[i] = new Array(10);
      }
      return emptyMap;
    }
    let ships = [
      {
        size: 4,
        amount: 1,
      },
      {
        size: 3,
        amount: 2,
      },
      {
        size: 2,
        amount: 3,
      },
      {
        size: 1,
        amount: 4,
      },
    ];

    let segments = [];
    let borders = [];
    ships.forEach((ship) => {
      if (!ship.size) return;
      let shipSize = ship.size;
      let shipsAmountOfType = ship.amount;
      for (let i = 0; i < shipsAmountOfType; i++) {
        let shipSet = false;
        while (!shipSet) {
          let tempSegments = [];
          let tempBorders = [];
          let d = rand(0, 1);
          let x = rand(0, 9);
          let y = rand(0, 9);
          if (d == 0 && x + shipSize > 9) x = x - shipSize;
          if (d == 1 && y + shipSize > 9) y = y - shipSize;
          for (let j = 0; j < shipSize; j++) {
            let pt = d == 0 ? [y, x + j] : [y + j, x];
            if (
              segments.find((s) => s.y == pt[0] && s.x == pt[1]) ||
              borders.find((b) => b.y == pt[0] && b.x == pt[1])
            )
              break;
            tempSegments.push({ y: pt[0], x: pt[1], color: shipSize });
            tempBorders.push(
              { y: pt[0] - 1, x: pt[1] },
              { y: pt[0] + 1, x: pt[1] },
              { y: pt[0], x: pt[1] - 1 },
              { y: pt[0], x: pt[1] + 1 },
              { y: pt[0] - 1, x: pt[1] - 1 },
              { y: pt[0] + 1, x: pt[1] + 1 },
              { y: pt[0] + 1, x: pt[1] - 1 },
              { y: pt[0] - 1, x: pt[1] + 1 }
            );
          }
          if (tempSegments.length == shipSize) {
            segments.push(...tempSegments);
            borders.push(...tempBorders);
            shipSet = true;
          }
        }
      }
    });
    let map = new Array(10);
    for (let i = 0; i < 10; i++) {
      map[i] = new Array(10);
    }
    segments.forEach((s) => {
      map[s.y][s.x] = 1;
    });
    return map;

    function rand(min, max) {
      let rand = min + Math.random() * (max - min);
      return Math.round(rand);
    }
  }
};
