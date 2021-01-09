// Load dependencies
const { Client, MessageEmbed } = require("discord.js");
const client = new Client();

const Game = require("./game");
const GamesManager = require("./games_manager");
const {
  prefix,
  token,
  home_server,
  home_server_matches_stat,
  home_server_servers_stat,
} = require("./config.json");
const { initLogger, log } = require("./logger");
const { parseMessage } = require("./utils");
const presets = require("./presets.json");
const { gameHelp, botHelp } = require("./help");

const lowdb = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const adapter = new FileSync("./bot/stats.json");

db = lowdb(adapter);
db.defaults({ matches_played: 0 }).write();

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
  if (command.toLowerCase() === "fight") {
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
    gamesManager.push(...game.players());
    db.update("matches_played", (n) => n + 1).write();
  }
  if (command.toLowerCase() === "help") {
    if (message.deletable) message.delete();
    message.channel.send(botHelp);
  }
});

client.on("guildCreate", (guild) => {
  let parent = guild.channels.cache.find(
    (c) => c.name.toLowerCase() === "battleships"
  );
  if (!parent)
    guild.channels
      .create("battleships", { type: "category" })
      .then((p) =>
        guild.channels
          .create("lobby", { parent: p })
          .then((c) => c.send(botHelp).catch(console.error))
          .catch(console.error)
      )
      .catch(console.error);
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
  let matchesChannel = guild.channels.cache.get(home_server_matches_stat);
  if (matchesChannel) {
    matchesChannel
      .edit({ name: `Fights: ${db.get("matches_played").value() || NaN}` })
      .catch((error) => log(error, { error: true }));
  }
}, 60 * 60 * 1000);

client.login(token);
