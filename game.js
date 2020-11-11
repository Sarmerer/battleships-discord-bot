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
    this.p1map = this.generateMap();
    this.p2map = this.generateMap();
    this.p1mapFromP2view = this.generateEmptyMap();
    this.p2mapFromP1view = this.generateEmptyMap();

    this.currentTurn = this.rand(0, 1);

    console.log(`First turn makes player ${this.currentTurn + 1}`);

    this.createChannelFor(
      this.playerOne,
      this.playerOneName,
      this.playerTwoName
    )
      .then((chan) => {
        this.sendMapEmbed(chan, this.p1map, this.p2mapFromP1view).then(
          (embed) => {
            this.p1embed = embed;
            this.p1collector = chan.createMessageCollector(
              (m) => m.author.id == this.playerOne
            );
            this.p1collector.on("collect", (m) => {
              if (this.currentTurn == 1) return;
              this.shoot(m);
              if (m.content == "sp") {
                this.p1collector.stop();
                this.p2collector.stop();
              }
              m.delete();
            });
            this.p1collector.on("end", (_collected) => {
              chan.delete();
            });
          }
        );
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
        this.sendMapEmbed(chan, this.p2map, this.p1mapFromP2view).then(
          (embed) => {
            this.p2embed = embed;
            this.p2collector = chan.createMessageCollector(
              (m) => m.author.id == this.playerTwo
            );
            this.p2collector.on("collect", (m) => {
              if (this.currentTurn == 0) return;
              this.shoot(m);
              if (m.content == "sp") {
                this.p1collector.stop();
                this.p2collector.stop();
              }
              m.delete();
            });
            this.p2collector.on("end", (_collected) => {
              chan.delete();
            });
          }
        );
      })
      .catch((error) => {
        return { error: error };
      });
  }

  shoot(message) {
    let shooterMap, victimMap;
    let shooterEmbed, victimEmbed;
    let victimMapFromShooterView, shooterMapFromVictimView;

    if (this.currentTurn == 0) {
      shooterMap = this.p1map;
      victimMap = this.p2map;
      shooterEmbed = this.p1embed;
      victimEmbed = this.p2embed;
      shooterMapFromVictimView = this.p1mapFromP2view;
      victimMapFromShooterView = this.p2mapFromP1view;
    } else {
      shooterMap = this.p2map;
      victimMap = this.p1map;
      shooterEmbed = this.p2embed;
      victimEmbed = this.p1embed;
      shooterMapFromVictimView = this.p2mapFromP1view;
      victimMapFromShooterView = this.p1mapFromP2view;
    }

    let input = message.content.toLowerCase().split("");
    let target = {
      x: input[1].charCodeAt() - 48,
      y: input[0].charCodeAt() - 97,
    };
    let shootResult = 1;
    if (target.x < 10 && target.y < 10 && target.x >= 0 && target.y >= 0) {
      if (victimMap[target.x][target.y] == 1) {
        shootResult = 2;
      } else {
        shootResult = 3;
      }
      victimMap[target.x][target.y] = shootResult;
      victimMapFromShooterView[target.x][target.y] = shootResult;
      shooterEmbed.edit(
        new MessageEmbed()
          .setColor("#0099ff")
          .setTitle("You")
          .setDescription(this.mapToString(shooterMap))
          .addField("Opponent", this.mapToString(victimMapFromShooterView))
      );
      victimEmbed.edit(
        new MessageEmbed()
          .setColor("#0099ff")
          .setTitle("You")
          .setDescription(this.mapToString(victimMap))
          .addField("Opponent", this.mapToString(shooterMapFromVictimView))
      );
    }
    this.currentTurn = this.currentTurn == 1 ? 0 : 1;
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
      if (i > 0) tmp.push(...map[i - 1]);
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
        segments: [],
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
    let map = this.generateEmptyMap();
    let borders = [];
    let segments = [];
    ships.forEach((ship) => {
      if (!ship.size) return;
      for (let i = 0; i < ship.amount; i++) {
        let shipSet = false;
        while (!shipSet) {
          let tempSegments = [];
          let tempBorders = [];
          let d = this.rand(0, 1);
          let x = this.rand(0, 9);
          let y = this.rand(0, 9);
          if (d == 0 && x + ship.size > 9) x = x - ship.size;
          if (d == 1 && y + ship.size > 9) y = y - ship.size;
          for (let j = 0; j < ship.size; j++) {
            let pt = d == 0 ? [y, x + j] : [y + j, x];
            if (
              segments.some((s) => s.y == pt[0] && s.x == pt[1]) ||
              borders.some((b) => b.y == pt[0] && b.x == pt[1])
            )
              break;
            tempSegments.push({ y: pt[0], x: pt[1], color: ship.size });
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
          if (tempSegments.length == ship.size) {
            segments.push(...tempSegments);
            borders.push(...tempBorders);
            shipSet = true;
          }
        }
      }
    });
    segments.forEach((s) => {
      map[s.y][s.x] = 1;
    });
    return map;
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

  rand(min, max) {
    let rand = min + Math.random() * (max - min);
    return Math.round(rand);
  }
};
