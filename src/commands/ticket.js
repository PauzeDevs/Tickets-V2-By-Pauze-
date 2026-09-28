const fs = require('node:fs');
const path = require('node:path');
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../utils/database');
const config = require('../config/config.json');
const configPath = path.join(__dirname, '../config/config.json');
const staff = member => member.permissions.has(PermissionFlagsBits.ManageGuild) || member.permissions.has(PermissionFlagsBits.ManageChannels) || (config.supportRoleId && member.roles.cache.has(config.supportRoleId)) || (config.staffRoleIds || []).some(id => member.roles.cache.has(id));
module.exports = {
  data: new SlashCommandBuilder().setName('ticket').setDescription('Manage tickets')
    .addSubcommand(s => s.setName('add').setDescription('Add a user').addUserOption(o => o.setName('user').setDescription('User').setRequired(true)))
    .addSubcommand(s => s.setName('remove').setDescription('Remove a user').addUserOption(o => o.setName('user').setDescription('User').setRequired(true)))
    .addSubcommand(s => s.setName('rename').setDescription('Rename the ticket').addStringOption(o => o.setName('name').setDescription('New ticket name').setRequired(true).setMaxLength(90)))
    .addSubcommand(s => s.setName('transfer').setDescription('Transfer ticket access').addUserOption(o => o.setName('user').setDescription('Support user')).addRoleOption(o => o.setName('role').setDescription('Support role')))
    .addSubcommand(s => s.setName('stats').setDescription('View ticket statistics'))
    .addSubcommand(s => s.setName('embed').setDescription('Customize a ticket embed').addStringOption(o => o.setName('target').setDescription('Embed to edit').setRequired(true).addChoices({ name: 'Panel', value: 'panel' }, { name: 'Ticket', value: 'ticket' })).addStringOption(o => o.setName('title').setDescription('Embed title')).addStringOption(o => o.setName('description').setDescription('Embed description')).addStringOption(o => o.setName('color').setDescription('Hex color, e.g. #5865F2')).addStringOption(o => o.setName('footer').setDescription('Footer text'))),
  async execute(i) {
    if (!staff(i.member)) return i.reply({ content: 'You do not have permission to manage tickets.', ephemeral: true });
    const sub = i.options.getSubcommand();
    if (sub === 'stats') { const s = db.stats(i.guildId); return i.reply({ content: `Tickets: ${s.total}\nOpen: ${s.open}\nClosed: ${s.closed}\nRatings: ${s.ratings}\nAverage rating: ${s.average.toFixed(2)}/5`, ephemeral: true }); }
    if (sub === 'embed') { const target = i.options.getString('target'); const embed = config.embeds[target] || {}; for (const key of ['title','description','color','footer']) { const value = i.options.getString(key); if (value !== null) embed[key] = value; } config.embeds[target] = embed; fs.writeFileSync(configPath, JSON.stringify(config, null, 2)); return i.reply({ content: `${target} embed configuration updated.`, ephemeral: true }); }
    const ticket = db.findByChannel(i.channelId); if (!ticket) return i.reply({ content: 'This channel is not an active ticket.', ephemeral: true });
    const user = i.options.getUser('user'); const role = i.options.getRole('role');
    if (sub === 'rename') { const name = i.options.getString('name').replace(/[^a-zA-Z0-9-_ ]/g, '').trim(); if (!name) return i.reply({ content: 'Invalid ticket name.', ephemeral: true }); await i.channel.setName(name.slice(0, 90)); return i.reply({ content: 'Ticket renamed.' }); }
    if (sub === 'add') { if (i.channel.isThread()) await i.channel.members.add(user.id); else await i.channel.permissionOverwrites.edit(user.id, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true }); return i.reply({ content: `Added ${user} to the ticket.` }); }
    if (sub === 'remove') { if (user.id === ticket.userId) return i.reply({ content: 'The ticket creator cannot be removed.', ephemeral: true }); if (i.channel.isThread()) await i.channel.members.remove(user.id).catch(() => {}); else await i.channel.permissionOverwrites.delete(user.id).catch(() => {}); return i.reply({ content: `Removed ${user} from the ticket.` }); }
    if (!user && !role) return i.reply({ content: 'Provide a user or role.', ephemeral: true });
    if (user) { if (i.channel.isThread()) await i.channel.members.add(user.id); else await i.channel.permissionOverwrites.edit(user.id, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true }); ticket.claimedBy = user.id; }
    if (role && !i.channel.isThread()) await i.channel.permissionOverwrites.edit(role.id, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true });
    await db.setTicket(ticket); return i.reply({ content: 'Ticket access transferred.' });
  }
};
