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
    message.delete();
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
}

client.login(token);
