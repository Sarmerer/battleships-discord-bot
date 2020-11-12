// Load dependencies
const { Client, MessageEmbed } = require("discord.js");
const client = new Client();

const Game = require("./battleships/game");
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

client.login(token);
