require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, GatewayIntentBits, Partials, REST, Routes, Collection } = require('discord.js');
const config = require('./config/config.json');
const db = require('./utils/database');
const { handleButton } = require('./interactions/buttons');
const { handleSelect } = require('./interactions/selectMenus');
const { handleModal } = require('./interactions/modals');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent], partials: [Partials.Channel] });
client.commands = new Collection();
for (const file of fs.readdirSync(path.join(__dirname, 'commands')).filter(f => f.endsWith('.js'))) { const command = require(`./commands/${file}`); client.commands.set(command.data.name, command); }

async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  const body = [...client.commands.values()].map(c => c.data.toJSON());
  const route = process.env.GUILD_ID ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID) : Routes.applicationCommands(process.env.CLIENT_ID);
  await rest.put(route, { body });
}
client.once('ready', async () => { await registerCommands(); console.log(`Pauze Tickets logged in as ${client.user.tag}`); console.log(`Loaded ${db.activeTickets().filter(t => !t.closedAt).length} active tickets.`); });
client.on('interactionCreate', async interaction => {
  try {
    if (interaction.isChatInputCommand()) { const command = client.commands.get(interaction.commandName); if (command) return command.execute(interaction); }
    if (interaction.isStringSelectMenu()) return handleSelect(interaction);
    if (interaction.isModalSubmit()) return handleModal(interaction);
    if (interaction.isButton()) return handleButton(interaction);
  } catch (error) {
    console.error('[interaction]', error);
    const payload = { content: 'The interaction could not be completed. Please try again.', ephemeral: true };
    if (interaction.deferred || interaction.replied) await interaction.editReply(payload).catch(() => {}); else await interaction.reply(payload).catch(() => {});
  }
});
client.on('channelDelete', async channel => { const ticket = db.findByChannel(channel.id); if (ticket && !ticket.closedAt) { ticket.closedAt = new Date().toISOString(); ticket.closeReason = 'Channel deleted'; await db.setTicket(ticket); } });
process.on('unhandledRejection', error => console.error('[unhandledRejection]', error));
process.on('uncaughtException', error => console.error('[uncaughtException]', error));
async function shutdown() { await db.save(); client.destroy(); process.exit(0); }
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);
if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) throw new Error('DISCORD_TOKEN and CLIENT_ID are required.');
client.login(process.env.DISCORD_TOKEN);
