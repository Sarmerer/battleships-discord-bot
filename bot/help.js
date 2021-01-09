const { prefix: p } = require("./config.json");

const gameHelp = `\`\`\`md
Game rules:
The rules are the same for all modes.
First player is being selected by random.
When player shoots he can hit opponents ship, in which case he will have another shot,
if he misses the turn goes to the second player.
Game ends when all the ships are destroyed.

You also may forfeit in any moment by sending ff to your channel

Game commands:
#Game commands can be used during matches in your private channels
ff - instantly finish the game
help - show How to Play guilde 

Tiles:
⬛ - empty cell
🔳 - ship
🆘 - ship when hit
🔥 - ship when destroyed
❌ - miss

How to shoot:
To make a turn send a message of two characters, where the first one is an latin letter (column), and the second one is a decimal number (row)
#examples:
A0 - ✔️
j1 - ✔️

1j - ❌
¯\\_(ツ)_/¯ - ❌
\`\`\``;

const botHelp = `\`\`\`md
? - optional argument
Commands:
${p}fight @user ?mode - start a fight with a user
#modes:
- causal - 10x10 map with 4 1x1, 3 2x1, 2 3x1 and 1 4x1 ships
- rapid - 4x4 map with 1 1x1 ship
#examples:
${p}fight @Sobuck - ✔️
${p}fight @Sobuck rapid - ✔️

${p}fight @user ?mode - ❌

${p}help - show this message

${gameHelp}

Still need help? Ask your question on our official server: https://discord.gg/JB94rhqmVA
\`\`\``;

module.exports = { botHelp, gameHelp };
