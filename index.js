// Load dependencies
const { Client, MessageEmbed } = require("discord.js");
const client = new Client();

const Game = require("./game");
const { prefix, token } = require("./config.json");
const { parseMessage } = require("./utils");

client.once("ready", () => {
  console.log(`${client.user.username} ready!`);
  client.user.setActivity(`${prefix}help`, {
    type: "LISTENING",
  });
});
client.on("warn", console.log);
client.on("error", console.error);

client.on("message", (message) => {
  if (message.author.bot || !message.guild) return;
  let { args, command } = parseMessage(message);
  if (command == "fight") {
    let game = new Game(message, args[0]);
    if (game.error) return;
    game.start();
  }
});

function startGame(message) {
  let map = generateMap();
  let you = mapToString(map);
  let embed;
  message.channel
    .send(
      new MessageEmbed().setColor("#0099ff").setTitle("You").setDescription(you)
    )
    .then((msg) => (embed = msg));

  // const filter = (m) => m.content.split("").length == 2;
  // const collector = message.channel.createMessageCollector(filter);

  // collector.on("collect", (m) => {
  //   let input = m.content.toLowerCase().split("");
  //   let target = [input[0].charCodeAt() - 96, input[1].charCodeAt() - 47];
  //   console.log(target);
  //   if (map[target[1]][target[0]] == 0) map[target[1]][target[0]] = 3;
  //   if (map[target[1]][target[0]] == 1) map[target[1]][target[0]] = 2;
  //   let newMap = mapToString(map);
  //   embed.edit(
  //     new MessageEmbed()
  //       .setColor("#0099ff")
  //       .setTitle("You")
  //       .setDescription(newMap)
  //   );
  //   m.delete();
  // });

  // collector.on("end", (collected) => {
  //   console.log(`Collected ${collected.size} items`);
  // });
  function mapToString(map) {
    const nums = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"];
    let base = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      [1],
      [2],
      [3],
      [4],
      [5],
      [6],
      [7],
      [8],
      [9],
      [10],
    ];
    let res = "";
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        base[i + 1][j + 1] = map[i][j];
      }
    }
    for (let i = 0; i < 11; i++) {
      for (let j = 0; j < 11; j++) {
        let cell = base[i][j];
        if (j == 0 && i >= 1) res += nums[i - 1];
        else if (i == 0 && j >= 1)
          res += ":regional_indicator_" + String.fromCharCode(96 + j) + ":";
        else
          res += cell == 1 ? "⬜" : cell == 2 ? "🟥" : cell == 3 ? "❌" : "⬛";
      }
      res += "\n";
    }
    return res;
  }

  function generateMap() {
    let map = [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ];
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
    segments.forEach((s) => {
      map[s.y][s.x] = 1;
    });
    // let log = "";
    // for (let i = 0; i < 10; i++) {
    //   for (let j = 0; j < 10; j++) {
    //     let cell = map[i][j];
    //     log +=
    //       cell == 1
    //         ? "⬜"
    //         : cell == 2
    //         ? "🟥"
    //         : cell == 3
    //         ? "❌"
    //         : cell == 4
    //         ? "🟧"
    //         : "⬛";
    //   }
    //   log += "\n";
    // }
    // console.log(log);
    return map;
  }

  function rand(min, max) {
    let rand = min + Math.random() * (max - min);
    return Math.round(rand);
  }
}

client.login(token);
