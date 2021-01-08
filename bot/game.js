const { getUserFromMention } = require("./utils");
const { MessageEmbed } = require("discord.js");
const { prefix, bot_id: botID } = require("./config.json");
const Player = require("./player");
const Ships = require("./ships");

const CFG = {};

CFG.CELL_EMPTY = 0;
CFG.CELL_SHIP = 1;
CFG.CELL_SHIP_HIT = 2;
CFG.CELL_MISS = 3;
CFG.CELL_SHIP_SUNK = 4;

module.exports = class Game {
  /**
   * @param {Object} message
   * @param {String} opponent
   * @param {gamesManager} gamesManager
   * @param {Object} preset
   */
  constructor(message, mention, gamesManager, preset) {
    let rival = getUserFromMention(message, mention);
    if (!rival || rival.bot) {
      message
        .reply(`Usage: ${prefix}play @someone`)
        .then((m) => {
          if (m.deletable) m.delete({ timeout: 5000 });
        })
        .catch(console.log);
      return { error: "no opponent mentioned" };
    }
    let author = message.author;
    rival = rival.user;

    this._p1 = new Player(author.id, author.username, author.discriminator);
    this._p2 = new Player(rival.id, rival.username, rival.discriminator);
    this._gamesManager = gamesManager;
    this._guild = message.guild;

    this._preset = preset;
    CFG.MAP_SIZE = preset.map_size;
    CFG.WIN_SCORE = preset.win_score;
  }
  players() {
    return [this._p1.id, this._p2.id];
  }
  start() {
    let map1 = this.generateMap();
    this._p1.map = map1[0];
    this._p1.ships = map1[1];

    let map2 = this.generateMap();
    this._p2.map = map2[0];
    this._p2.ships = map2[1];
    this._p1.mapWithFog = this.generateEmptyMap();
    this._p2.mapWithFog = this.generateEmptyMap();

    (Math.random() <= 0.5 ? this._p1 : this._p2).turn = true;
    console.log(
      `New game has been started! Players: ${this._p1.name} and ${
        this._p2.name
      } | ${(this._p1.turn ? this._p1 : this._p2).name} makes the first turn`
    );

    this.createChannelFor(this._p1);
    this.createChannelFor(this._p2);
  }

  end() {
    this._p1.embed
      .edit(this.generateEmbed(this._p1.map, this._p2.map, { end: true }))
      .catch(console.log);
    this._p2.embed
      .edit(this.generateEmbed(this._p2.map, this._p1.map, { end: true }))
      .catch(console.log);

    this._p1.collector.stop();
    this._p2.collector.stop();
  }

  shoot(message) {
    let rivalMap = (this._p1.turn ? this._p2 : this._p1).map;
    let rivalMapWithFog = (this._p1.turn ? this._p2 : this._p1).mapWithFog;
    let ships = this._p1.turn ? this._p2.ships : this._p1.ships;

    let input = message.content.toLowerCase().replace(/\s+/g, "").split("");
    let target = {
      x: input[1].charCodeAt() - 48,
      y: input[0].charCodeAt() - 97,
    };
    if (!between([target.x, target.y], 0, CFG.MAP_SIZE))
      return {
        error: "Available range: `A0 <= n <= J9`, where `n` is your target",
      };
    if (
      rivalMap[target.x][target.y] === CFG.CELL_SHIP_HIT ||
      rivalMap[target.x][target.y] === CFG.CELL_MISS
    )
      return {
        error: "You have already shot that cell, choose another one",
      };
    let shootResult = CFG.CELL_SHIP;
    if (rivalMap[target.x][target.y] === 1) {
      shootResult = CFG.CELL_SHIP_HIT;
      (this._p1.turn ? this._p1 : this._p2).addScore();
    } else {
      shootResult = CFG.CELL_MISS;
      this._p1.turn = !this._p1.turn;
      this._p2.turn = !this._p2.turn;
    }

    rivalMap[target.x][target.y] = shootResult;
    rivalMapWithFog[target.x][target.y] = shootResult;
    markSunk(ships.sunk(target.x, target.y));

    this._p1.embed
      .edit(this.generateEmbed(this._p1.map, this._p2.mapWithFog))
      .catch(console.log);
    this._p2.embed
      .edit(this.generateEmbed(this._p2.map, this._p1.mapWithFog))
      .catch(console.log);

    let winner =
      this._p1.score === CFG.WIN_SCORE
        ? this._p1.name
        : this._p2.score === CFG.WIN_SCORE
        ? this._p2.name
        : null;
    if (winner) {
      this.winner = winner;
      return this.end();
    }

    function markSunk(cells) {
      if (!cells.length) return;
      cells.forEach((c) => {
        rivalMap[c[0]][c[1]] = CFG.CELL_SHIP_SUNK;
        rivalMapWithFog[c[0]][c[1]] = CFG.CELL_SHIP_SUNK;
      });
    }

    function between(targets, min, max) {
      return targets.every((t) => t >= min && t <= max);
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
      : embed.setFooter(`${(this._p1.turn ? this._p1 : this._p2).name}'s turn`);
    return embed;
  }

  async createChannelFor(player) {
    let parent = this._guild.channels.cache.find(
      (c) => c.name.toLowerCase() === "battleships"
    );
    this._guild.channels
      .create(`${player.name}-${player.discriminator}`, {
        parent: parent,
        permissionOverwrites: [
          {
            id: this._guild.roles.everyone,
            deny: ["VIEW_CHANNEL"],
          },
          {
            id: player.id,
            allow: ["VIEW_CHANNEL"],
          },
          {
            id: botID,
            allow: ["VIEW_CHANNEL"],
          },
        ],
      })
      .then((chan) => {
        player.chan = chan;
        chan
          .send(this.generateEmbed(player.map, player.mapWithFog))
          .then((embed) => {
            player.embed = embed;
            player.collector = chan.createMessageCollector(
              (m) => m.author.id === player.id
            );
            player.collector.on("collect", (m) => {
              if (m.content === "sp") {
                this._p1.collector.stop();
                this._p2.collector.stop();
                return;
              }
              if (m.content.startsWith("> ")) {
                let opponentChan = (player.id === this._p1.id
                  ? this._p2
                  : this._p1
                ).chan;
                if (!opponentChan) return;
                opponentChan
                  .send(`${m.author.username} says: ${m.content.substr(2)}`)
                  .then((dm) => {
                    setTimeout(() => {
                      if (dm.deletable) dm.delete();
                    }, 10000);
                  });
                if (m.deletable) m.delete();
                return;
              }
              if (!player.turn) return;
              let outcome = this.shoot(m);
              if (outcome && outcome.error)
                m.reply(outcome.error).then((r) => {
                  if (r.deletable) r.delete({ timeout: 10000 });
                });
              if (m.deletable) m.delete();
            });
            player.collector.on("end", (_collected) => {
              if (this.winner)
                setTimeout(() => {
                  if (chan.deletable) chan.delete();
                }, 60000);
              else if (chan.deletable) chan.delete();
              this._gamesManager.splice(player.id);
            });
          })
          .catch(console.log);
      })
      .catch((error) => {
        return { error: error };
      });
  }

  mapToString(map) {
    const numsEmojis = [
      "0️⃣",
      "1️⃣",
      "2️⃣",
      "3️⃣",
      "4️⃣",
      "5️⃣",
      "6️⃣",
      "7️⃣",
      "8️⃣",
      "9️⃣",
    ];
    const cellEmojis = {
      [CFG.CELL_SHIP]: "🔳",
      [CFG.CELL_SHIP_HIT]: "🆘",
      [CFG.CELL_SHIP_SUNK]: "🔥",
      [CFG.CELL_MISS]: "❌",
      [CFG.CELL_EMPTY]: "⬛",
    };
    let base = [];
    for (let i = 0; i <= CFG.MAP_SIZE; i++) {
      let tmp = [];
      for (let j = 0; j <= CFG.MAP_SIZE; j++) {
        if (i === 0 && j > 0) tmp.push(j - 1);
        if (j === 0 && i > 0) tmp.push(i - 1);
      }
      if (i > 0) tmp.push(...map[i - 1]);
      base.push(tmp);
    }
    let res = "";
    for (let i = 0; i <= CFG.MAP_SIZE; i++) {
      for (let j = 0; j <= CFG.MAP_SIZE; j++) {
        let cell = base[i][j];
        if (j === 0 && i > 0) {
          res += numsEmojis[cell];
        } else if (i === 0 && j > 0) {
          res += ":regional_indicator_" + String.fromCharCode(96 + j) + ":";
        } else {
          res += cellEmojis[cell];
        }
      }
      res += "\n";
    }

    return res;
  }

  generateMap() {
    let preset = this._preset;
    let map = this.generateEmptyMap();
    let ships = new Ships();
    let borders = [];
    preset.ships.forEach((ship) => {
      if (!ship.size) return;
      for (let i = 0; i < ship.amount; i++) {
        let shipSet = false;
        while (!shipSet) {
          let tempSegments = [];
          let tempBorders = [];
          let d = this.rand(0, 1);
          let x = this.rand(0, CFG.MAP_SIZE - 1);
          let y = this.rand(0, CFG.MAP_SIZE - 1);
          if (d === 0 && x + ship.size > CFG.MAP_SIZE - 1) x = x - ship.size;
          if (d === 1 && y + ship.size > CFG.MAP_SIZE - 1) y = y - ship.size;
          for (let j = 0; j < ship.size; j++) {
            let pt = d === 0 ? [x + j, y] : [x, y + j];
            if (
              ships.collides(pt[0], pt[1]) ||
              borders.some((s) => s.x === pt[0] && s.y === pt[1])
            )
              break;
            tempSegments.push({ x: pt[0], y: pt[1], sunk: false });
            tempBorders.push(
              { x: pt[0] - 1, y: pt[1] },
              { x: pt[0] + 1, y: pt[1] },
              { x: pt[0], y: pt[1] - 1 },
              { x: pt[0], y: pt[1] + 1 },
              { x: pt[0] - 1, y: pt[1] - 1 },
              { x: pt[0] + 1, y: pt[1] + 1 },
              { x: pt[0] + 1, y: pt[1] - 1 },
              { x: pt[0] - 1, y: pt[1] + 1 }
            );
          }
          if (tempSegments.length === ship.size) {
            ships.newShip(ship.size, tempSegments);
            borders.push(...tempBorders);
            shipSet = true;
          }
        }
      }
    });
    ships.all
      .flatMap((s) => s.cells)
      .forEach((s) => {
        map[s.x][s.y] = CFG.CELL_SHIP;
      });

    return [map, ships];
  }
  generateEmptyMap() {
    return [...Array(CFG.MAP_SIZE)].map(() =>
      Array(CFG.MAP_SIZE).fill(CFG.CELL_EMPTY)
    );
  }

  rand(min, max) {
    let rand = min + Math.random() * (max - min);
    return Math.round(rand);
  }
};
