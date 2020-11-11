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
    this.p1id = message.author.id;
    this.p1name = message.author.username;
    this.p1discriminator = message.author.discriminator;

    this.p2id = opponent.id;
    this.p2name = opponent.user.username;
    this.p2discriminator = opponent.user.discriminator;
    this.message = message;

    console.log(
      `New game has been started! Players: ${this.p1name} and ${this.p2name}`
    );
  }
  start() {
    this.p1map = this.generateMap();
    this.p2map = this.generateMap();
    this.p1mapFromP2view = this.generateEmptyMap();
    this.p2mapFromP1view = this.generateEmptyMap();

    this.p1score = 0;
    this.p2score = 0;
    this.winner;

    this.p1turn = Math.random() <= 0.5;
    console.log(`First turn makes player ${this.p1turn ? 1 : 2}`);

    this.createChannelFor(0)
      .then((chan) => {
        chan
          .send(this.generateEmbed(this.p1map, this.p2mapFromP1view))
          .then((embed) => {
            this.p1embed = embed;
            this.p1collector = chan.createMessageCollector(
              (m) => m.author.id == this.p1id
            );
            this.p1collector.on("collect", (m) => {
              if (m.content == "sp") {
                this.p1collector.stop();
                this.p2collector.stop();
              }
              if (!this.p1turn) return;
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
          .send(this.generateEmbed(this.p2map, this.p1mapFromP2view))
          .then((embed) => {
            this.p2embed = embed;
            this.p2collector = chan.createMessageCollector(
              (m) => m.author.id == this.p2id
            );
            this.p2collector.on("collect", (m) => {
              if (m.content == "sp") {
                this.p1collector.stop();
                this.p2collector.stop();
              }
              if (this.p1turn) return;
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
      .edit(this.generateEmbed(this.p1map, this.p2map, { end: true }))
      .catch(console.log);
    this.p2embed
      .edit(this.generateEmbed(this.p2map, this.p1map, { end: true }))
      .catch(console.log);

    this.p1collector.stop();
    this.p2collector.stop();
  }

  shoot(message) {
    let victimMap = this.p1turn ? this.p2map : this.p1map;
    let victimMapFromShooterView = this.p1turn
      ? this.p2mapFromP1view
      : this.p1mapFromP2view;

    let input = message.content.toLowerCase().replace(/\s+/g, "").split("");
    let target = {
      x: input[1].charCodeAt() - 48,
      y: input[0].charCodeAt() - 97,
    };
    if (between(target.x, 0, 9) & between(target.y, 0, 9)) {
      this.p1turn = !this.p1turn;
      let shootResult = 1;
      if (victimMap[target.x][target.y] == 1) {
        shootResult = 2;
        this.p1turn ? this.p1score++ : this.p2score++;
      } else {
        shootResult = 3;
      }

      victimMap[target.x][target.y] = shootResult;
      victimMapFromShooterView[target.x][target.y] = shootResult;

      this.p1embed
        .edit(this.generateEmbed(this.p1map, this.p2mapFromP1view))
        .catch(console.log);
      this.p2embed
        .edit(this.generateEmbed(this.p2map, this.p1mapFromP2view))
        .catch(console.log);

      if (this.p1score == 20) {
        this.winner = this.p1name;
        this.end();
      }
      if (this.p2score == 20) {
        this.winner = this.p2name;
        this.end();
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
      : embed.setFooter(`${this.p1turn ? this.p1name : this.p2name}'s turn`);
    return embed;
  }

  async createChannelFor(player) {
    let playerID = player == 0 ? this.p1id : this.p2id;
    let chanName =
      player == 0
        ? `${this.p1name}-${this.p1discriminator}`
        : `${this.p2name}-${this.p2discriminator}`;
    let parent = this.message.guild.channels.cache.get("773858485167194153");
    return this.message.guild.channels
      .create(chanName, {
        parent: parent,
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
