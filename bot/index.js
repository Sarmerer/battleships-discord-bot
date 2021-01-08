// Load dependencies
const { Client, MessageEmbed } = require("discord.js");
const client = new Client();

const Game = require("./game");
const GamesManager = require("./games_manager");
const { prefix, token } = require("./config.json");
const { initLogger, log } = require("./logger");
const { parseMessage } = require("./utils");
const presets = require("./presets.json");

let gamesManager = new GamesManager();

client.once("ready", () => {
  initLogger(client.guilds.cache);
  log(`${client.user.username} is up and running!`);
  client.user.setActivity(`${prefix}help`, {
    type: "LISTENING",
  });
});
client.on("warn", (warn) => log(warn, { warn: true }));
client.on("error", (error) => log(error, { error: true }));

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

client.on("guildCreate", (guild) => {
  log(`joined [${guild.name}]`);
});

client.on("guildDelete", (guild) => {
  log(`left [${guild.name}]`);
});

setInterval(() => {
  let guild = client.guilds.cache.get(home_server);
  if (!guild) return;
  let serversChannel = guild.channels.cache.get(home_server_servers_stat);
  if (serversChannel) {
    serversChannel
      .edit({ name: `Servers: ${client.guilds.cache.size}` })
      .catch((error) => log(error, { error: true }));
  }
}, 60 * 60 * 1000);

client.login(token);
