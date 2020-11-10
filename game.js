const { getUserFromMention } = require("./utils");
const { MessageEmbed } = require("discord.js");
const { prefix, bot_id: botID } = require("./config.json");

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

    console.log(
      `New game has been started! Players: ${this.playerOneName} and ${this.playerTwoName}`
    );
  }
  start() {
    let p1map = this.generateMap();
    let p2map = this.generateMap();
    let p1mapFromP2view = this.generateEmptyMap();
    let p2mapFromP1View = p1mapFromP2view;

    let p1collector;
    let p2collector;

    this.createChannelFor(
      this.playerOne,
      this.playerOneName,
      this.playerTwoName
    )
      .then((chan) => {
        this.sendMapEmbed(chan, p1map, p2mapFromP1View);

        p1collector = chan.createMessageCollector(
          (m) => m.author.id == this.playerOne
        );
        p1collector.on("collect", (m) => {
          console.log(this.playerOneName + " says: " + m.content);
          if (m.content == "sp") {
            p1collector.stop();
            p2collector.stop();
          }
        });
        p1collector.on("end", (collected) => {
          chan.delete();
        });
      })
      .catch((error) => {
        return { error: error };
      });
    this.createChannelFor(
      this.playerTwo,
      this.playerTwoName,
      this.playerOneName
    )
      .then((chan) => {
        this.sendMapEmbed(chan, p2map, p1mapFromP2view);

        p2collector = chan.createMessageCollector(
          (m) => m.author.id == this.playerTwo
        );
        p2collector.on("collect", (m) => {
          console.log(this.playerTwoName + " says: " + m.content);
        });
        p2collector.on("end", (_collected) => {
          chan.delete();
        });
      })
      .catch((error) => {
        return { error: error };
      });
  }

  async sendMapEmbed(chan, playerMap, opponentMap) {
    return chan
      .send(
        new MessageEmbed()
          .setColor("#0099ff")
          .setTitle("You")
          .setDescription(this.mapToString(playerMap))
          .addField("Opponent", this.mapToString(opponentMap))
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
    let base = [];
    for (let i = 0; i < 11; i++) {
      let tmp = [];
      for (let j = 0; j < 11; j++) {
        if (i == 0 && j > 0) tmp.push(j - 1);
        if (j == 0 && i > 0) tmp.push(i - 1);
      }
      if (i > 0)
        map ? tmp.push(...map[i - 1]) : tmp.push(0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
      base.push(tmp);
    }
    let res = "";
    for (let i = 0; i < 11; i++) {
      for (let j = 0; j < 11; j++) {
        let cell = base[i][j];
        if (j == 0 && i > 0) res += nums[cell];
        else if (i == 0 && j > 0)
          res += ":regional_indicator_" + String.fromCharCode(96 + j) + ":";
        else
          res += cell == 1 ? "🔳" : cell == 2 ? "🟥" : cell == 3 ? "❌" : "⬛";
      }
      res += "\n";
    }

    return res;
  }

  generateMap() {
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
    let map = this.generateEmptyMap();
    segments.forEach((s) => {
      map[s.y][s.x] = 1;
    });
    return map;

    function rand(min, max) {
      let rand = min + Math.random() * (max - min);
      return Math.round(rand);
    }
  }
  generateEmptyMap() {
    let map = [];
    for (let i = 0; i < 10; i++) {
      let tmp = [];
      for (let j; j < 10; j++) {
        tmp.push(0);
      }
      map.push(tmp);
    }
    return map;
  }
};
