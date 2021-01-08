// Load dependencies
const { Client, MessageEmbed } = require("discord.js");
const client = new Client();

const Game = require("./game");
const GamesManager = require("./games_manager");
const { prefix, token } = require("./config.json");
const presets = require("./presets.json");
const { parseMessage } = require("./utils");

let gamesManager = new GamesManager();

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
  if (command === "fight") {
    if (message.deletable) message.delete();

    if (gamesManager.inGame(message.author.id))
      return message
        .reply(`you are already in a fight, finish it first`)
        .then((m) => {
          if (m.deletable) m.delete({ timeout: 5000 });
        })
        .catch(console.log);

    let preset = presets[args[1]?.toLowerCase()] || presets.casual;
    let game = new Game(message, args[0], gamesManager, preset);
    if (game.error) return;
    game.start();
    if (gamesManager.push(...game.players()));
  }
});

client.login(token);
