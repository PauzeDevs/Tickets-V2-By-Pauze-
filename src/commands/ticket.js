const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../utils/database');
const config = require('../config/config.json');
const staff = member => member.permissions.has(PermissionFlagsBits.ManageGuild) || member.permissions.has(PermissionFlagsBits.ManageChannels) || (config.supportRoleId && member.roles.cache.has(config.supportRoleId)) || (config.staffRoleIds || []).some(id => member.roles.cache.has(id));
module.exports = {
  data: new SlashCommandBuilder().setName('ticket').setDescription('Manage the current support ticket')
    .addSubcommand(s => s.setName('add').setDescription('Add a user').addUserOption(o => o.setName('user').setDescription('User').setRequired(true)))
    .addSubcommand(s => s.setName('remove').setDescription('Remove a user').addUserOption(o => o.setName('user').setDescription('User').setRequired(true)))
    .addSubcommand(s => s.setName('rename').setDescription('Rename the ticket').addStringOption(o => o.setName('name').setDescription('New ticket name').setRequired(true).setMaxLength(90)))
    .addSubcommand(s => s.setName('transfer').setDescription('Transfer ticket access').addUserOption(o => o.setName('user').setDescription('Support user')).addRoleOption(o => o.setName('role').setDescription('Support role'))),
  async execute(i) {
    if (!staff(i.member)) return i.reply({ content: 'You do not have permission to manage tickets.', ephemeral: true });
    const ticket = db.findByChannel(i.channelId); if (!ticket) return i.reply({ content: 'This channel is not an active ticket.', ephemeral: true });
    const sub = i.options.getSubcommand(); const user = i.options.getUser('user'); const role = i.options.getRole('role');
    if (sub === 'rename') { const name = i.options.getString('name').replace(/[^a-zA-Z0-9-_ ]/g, '').trim(); if (!name) return i.reply({ content: 'Invalid ticket name.', ephemeral: true }); await i.channel.setName(name.slice(0, 90)); return i.reply({ content: 'Ticket renamed.' }); }
    if (sub === 'add') { if (i.channel.isThread()) await i.channel.members.add(user.id); else await i.channel.permissionOverwrites.edit(user.id, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true }); return i.reply({ content: `Added ${user} to the ticket.` }); }
    if (sub === 'remove') { if (user.id === ticket.userId) return i.reply({ content: 'The ticket creator cannot be removed.', ephemeral: true }); if (i.channel.isThread()) await i.channel.members.remove(user.id).catch(() => {}); else await i.channel.permissionOverwrites.delete(user.id).catch(() => {}); return i.reply({ content: `Removed ${user} from the ticket.` }); }
    if (!user && !role) return i.reply({ content: 'Provide a user or role.', ephemeral: true });
    if (user) { if (i.channel.isThread()) await i.channel.members.add(user.id); else await i.channel.permissionOverwrites.edit(user.id, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true }); ticket.claimedBy = user.id; }
    if (role && !i.channel.isThread()) await i.channel.permissionOverwrites.edit(role.id, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true });
    await db.setTicket(ticket); return i.reply({ content: 'Ticket access transferred.' });
  }
};
