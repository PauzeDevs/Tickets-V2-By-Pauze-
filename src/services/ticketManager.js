const { ChannelType, PermissionFlagsBits } = require('discord.js');
const config = require('../config/config.json');
const db = require('../utils/database');
const { ticketEmbed } = require('../utils/embeds');
const { controls } = require('../utils/components');
async function createTicket(interaction, category, answers) {
  const existing = db.activeTickets().find(t => t.userId === interaction.user.id && t.guildId === interaction.guildId);
  if (existing) throw new Error(`You already have an active ticket: <#${existing.channelId}>`);
  const id = db.nextTicketId();
  const cat = config.categories.find(c => c.value === category);
  const ticket = { id, guildId: interaction.guildId, userId: interaction.user.id, userTag: interaction.user.tag, category, categoryLabel: cat?.label || category, categoryEmoji: cat?.emoji || 'support', topic: answers.topic, description: answers.description, identifier: answers.identifier || '', createdAt: new Date().toISOString(), claimedBy: null, channelId: null };
  let channel;
  if (config.mode === 'thread') {
    const intake = await interaction.guild.channels.fetch(config.intakeChannelId);
    channel = await intake.threads.create({ name: `ticket-${String(id).padStart(4,'0')}`, type: ChannelType.PrivateThread, invitable: false, reason: `Ticket #${id}` });
    await channel.members.add(interaction.user.id);
    const role = await interaction.guild.roles.fetch(config.supportRoleId); if (role) for (const member of role.members.values()) await channel.members.add(member.id).catch(()=>{});
  } else {
    const parent = await interaction.guild.channels.fetch(config.ticketCategoryId);
    channel = await interaction.guild.channels.create({ name:`ticket-${String(id).padStart(4,'0')}`, type:ChannelType.GuildText, parent:parent.id, permissionOverwrites:[
      { id:interaction.guild.roles.everyone.id, deny:[PermissionFlagsBits.ViewChannel] },
      { id:interaction.user.id, allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ReadMessageHistory,PermissionFlagsBits.AttachFiles] },
      { id:config.supportRoleId, allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ReadMessageHistory,PermissionFlagsBits.ManageMessages] }
    ] });
  }
  ticket.channelId = channel.id; db.setTicket(ticket);
  await channel.send({ content:`<@${interaction.user.id}>`, embeds:[ticketEmbed(ticket)], components:[controls(id)] });
  return ticket;
}
function canStaff(member) { return member.permissions.has(PermissionFlagsBits.ManageChannels) || config.staffRoleIds.includes(member.roles.highest?.id) || member.roles.cache.has(config.supportRoleId); }
module.exports = { createTicket, canStaff };
