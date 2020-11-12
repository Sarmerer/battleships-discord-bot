const { getUserFromMention } = require("../utils");
const { MessageEmbed } = require("discord.js");
const { prefix, bot_id: botID } = require("../config.json");
const Player = require("./player");

const CONFIG = {};
CONFIG.WIN_SCORE = 20;
CONFIG.MAP_SIZE = 10;

module.exports = class Game {
  /**
   * @param {Object} message
   * @param {String} opponent
   */
  constructor(message, mention) {
    let rival = getUserFromMention(message, mention);
    if (!rival || rival.bot) {
      message
        .reply(`Usage: ${prefix}play @someone`)
        .then((m) => m.delete({ timeout: 5000 }))
        .catch(console.log);
      return { error: "no opponent mentioned" };
    }
    let author = message.author;
    rival = rival.user;

    this._p1 = new Player(author.id, author.username, author.discriminator);
    this._p2 = new Player(rival.id, rival.username, rival.discriminator);
    this._message = message;

    console.log(
      `New game has been started! Players: ${this._p1.name} and ${this._p2.name}`
    );
  }
  start() {
    this._p1.map = this.generateMap();
    this._p2.map = this.generateMap();
    this._p1.mapWithFog = this.generateEmptyMap();
    this._p2.mapWithFog = this.generateEmptyMap();

    this._p1turn = Math.random() <= 0.5;
    console.log(
      `${(this._p1turn ? this._p1 : this._p2).name} makes the first turn`
    );

    this.createChannelFor(0)
      .then((chan) => {
        chan
          .send(this.generateEmbed(this._p1.map, this._p2.mapWithFog))
          .then((embed) => {
            this.p1embed = embed;
            this.p1collector = chan.createMessageCollector(
              (m) => m.author.id == this._p1.id
            );
            this.p1collector.on("collect", (m) => {
              if (m.content == "sp") {
                this.p1collector.stop();
                this.p2collector.stop();
              }
              if (!this._p1turn) return;
              this.shoot(m);
              m.delete();
            });
            this.p1collector.on("end", (_collected) => {
              if (this.winner)
                setTimeout(() => {
                  chan.delete();
                }, 60000);
              else chan.delete();
            });
          })
          .catch(console.log);
      })
      .catch((error) => {
        return { error: error };
      });

    this.createChannelFor(1)
      .then((chan) => {
        chan
          .send(this.generateEmbed(this._p2.map, this._p1.mapWithFog))
          .then((embed) => {
            this.p2embed = embed;
            this.p2collector = chan.createMessageCollector(
              (m) => m.author.id == this._p2.id
            );
            this.p2collector.on("collect", (m) => {
              if (m.content == "sp") {
                this.p1collector.stop();
                this.p2collector.stop();
              }
              if (this._p1turn) return;
              this.shoot(m);
              m.delete();
            });
            this.p2collector.on("end", (_collected) => {
              if (this.winner)
                setTimeout(() => {
                  chan.delete();
                }, 60000);
              else chan.delete();
            });
          })
          .catch(console.log);
      })
      .catch((error) => {
        return { error: error };
      });
  }

  end() {
    this.p1embed
      .edit(this.generateEmbed(this._p1.map, this._p2.map, { end: true }))
      .catch(console.log);
    this.p2embed
      .edit(this.generateEmbed(this._p2.map, this._p1.map, { end: true }))
      .catch(console.log);

    this.p1collector.stop();
    this.p2collector.stop();
  }

  shoot(message) {
    let victimMap = this._p1turn ? this._p2.map : this._p1.map;
    let victimMapFromShooterView = this._p1turn
      ? this._p2.mapWithFog
      : this._p1.mapWithFog;

    let input = message.content.toLowerCase().replace(/\s+/g, "").split("");
    let target = {
      x: input[1].charCodeAt() - 48,
      y: input[0].charCodeAt() - 97,
    };
    if (between(target.x, 0, 9) & between(target.y, 0, 9)) {
      let shootResult = 1;
      if (victimMap[target.x][target.y] == 1) {
        shootResult = 2;
        this._p1turn ? this._p1.addScore() : this._p2.addScore();
      } else {
        shootResult = 3;
        this._p1turn = !this._p1turn;
      }

      victimMap[target.x][target.y] = shootResult;
      victimMapFromShooterView[target.x][target.y] = shootResult;

      this.p1embed
        .edit(this.generateEmbed(this._p1.map, this._p2.mapWithFog))
        .catch(console.log);
      this.p2embed
        .edit(this.generateEmbed(this._p2.map, this._p1.mapWithFog))
        .catch(console.log);

      if (this._p1.score == CONFIG.WIN_SCORE) {
        this.winner = this._p1.name;
        return this.end();
      }
      if (this._p2.score == CONFIG.WIN_SCORE) {
        this.winner = this._p2.name;
        return this.end();
      }
    }

    function between(x, min, max) {
      return x >= min && x <= max;
    }
  }

  generateEmbed(playerMap, opponentMap, options = { end: false }) {
    let embed = new MessageEmbed()
      .setColor("#0099ff")
      .setTitle("You")
      .setDescription(this.mapToString(playerMap))
      .addField("Opponent", this.mapToString(opponentMap));

    options.end
      ? embed.addField(
          `${this.winner} is a winner!`,
          "This channel will be deleted in a minute"
        )
      : embed.setFooter(
          `${this._p1turn ? this._p1.name : this._p2.name}'s turn`
        );
    return embed;
  }

  async createChannelFor(player) {
    let playerID = player == 0 ? this._p1.id : this._p2.id;
    let chanName =
      player == 0
        ? `${this._p1.name}-${this._p1.discriminator}`
        : `${this._p2.name}-${this._p2.discriminator}`;
    let parent = this._message.guild.channels.cache.find(
      (c) => c.name.toLowerCase() == "battleships"
    );
    return this._message.guild.channels
      .create(chanName, {
        parent: parent,
        permissionOverwrites: [
          {
            id: this._message.guild.roles.everyone,
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
