const { prefix } = require("./config.json");

module.exports = {
  parseMessage(message) {
    if (!message) return;
    if (message.content.substring(0, prefix.length) != prefix)
      return { args: [], command: "" };
    const split = message.content.slice(prefix.length).trim().split(/ +/);
    let command = split.shift();
    let args = split;
    return { args: args, command: command };
  },
};
