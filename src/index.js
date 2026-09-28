require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, GatewayIntentBits, Partials, REST, Routes, Collection } = require('discord.js');
const db = require('./utils/database');
const automation = require('./utils/automation');
const { handleButton } = require('./interactions/buttons');
const { handleSelect } = require('./interactions/selectMenus');
const { handleModal } = require('./interactions/modals');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel]
});
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'))) {
  const command = require(path.join(commandsPath, file));
  if (command?.data?.name) client.commands.set(command.data.name, command);
}

async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  const body = [...client.commands.values()].map(command => command.data.toJSON());
  const route = process.env.GUILD_ID ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID) : Routes.applicationCommands(process.env.CLIENT_ID);
  await rest.put(route, { body });
}

client.once('ready', async () => {
  await registerCommands();
  automation.restore(client);
  console.log(`Pauze Tickets logged in as ${client.user.tag}`);
  console.log(`Loaded ${db.activeTickets().filter(ticket => !ticket.closedAt).length} active tickets.`);
});

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

client.on('messageCreate', message => {
  if (message.author.bot || !message.guild) return;
  const ticket = db.findByChannel(message.channel.id);
  if (ticket) automation.touch(client, ticket);
});

client.on('channelDelete', async channel => {
  const ticket = db.findByChannel(channel.id);
  if (!ticket) return;
  ticket.closedAt = new Date().toISOString();
  ticket.closeReason = 'Channel deleted';
  ticket.status = 'closed';
  await db.setTicket(ticket);
  await db.addAudit({ guildId: ticket.guildId, ticketId: ticket.id, action: 'channel_deleted', actorId: client.user?.id || null, metadata: { channelId: channel.id } });
});

process.on('unhandledRejection', error => console.error('[unhandledRejection]', error));
process.on('uncaughtException', error => console.error('[uncaughtException]', error));
async function shutdown() { await db.save(); client.destroy(); process.exit(0); }
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) throw new Error('DISCORD_TOKEN and CLIENT_ID are required.');
client.login(process.env.DISCORD_TOKEN);
