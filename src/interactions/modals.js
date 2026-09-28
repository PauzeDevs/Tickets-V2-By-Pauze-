const { ChannelType, PermissionFlagsBits } = require('discord.js');
const db = require('../utils/database');
const config = require('../config/config.json');
const { buildTicketEmbed } = require('../utils/embeds');
const { controlRows } = require('./buttons');
async function handleModal(interaction) {
  if (!interaction.customId.startsWith('ticket:intake:')) return false;
  const categoryId = interaction.customId.split(':')[2];
  const category = (config.categories || []).find(c => (c.id || c.value) === categoryId);
  if (!category) return interaction.reply({ content: 'This ticket category is no longer available.', ephemeral: true });
  const existing = db.findByUser(interaction.guildId, interaction.user.id);
  if (existing) return interaction.reply({ content: `You already have an open ticket: <#${existing.channelId}>.`, ephemeral: true });
  await interaction.deferReply({ ephemeral: true });
  const ticketId = db.nextId();
  const questions = category.questions?.length ? category.questions : [{ id: 'topic' }, { id: 'details' }, { id: 'identifier' }];
  const answers = {}; for (const q of questions) answers[q.id] = interaction.fields.getTextInputValue(q.id) || '';
  const number = String(ticketId).padStart(4, '0');
  const permissionOverwrites = [{ id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] }, { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] }];
  const supportRoles = [...new Set([...(config.staffRoleIds || []), config.supportRoleId].filter(id => id && !id.startsWith('REPLACE_')))];
  for (const roleId of supportRoles) permissionOverwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages] });
  let channel;
  if (config.mode === 'thread') {
    const parent = await interaction.guild.channels.fetch(config.intakeChannelId).catch(() => null);
    if (!parent?.isTextBased()) return interaction.editReply({ content: 'The configured intake channel is unavailable.' });
    channel = await parent.threads.create({ name: `${category.value || category.id}-${number}`, type: ChannelType.PrivateThread, invitable: false, reason: `Ticket #${number}` });
    await channel.members.add(interaction.user.id).catch(() => {});
  } else {
    const parentId = category.channelCategoryId || config.ticketCategoryId;
    channel = await interaction.guild.channels.create({ name: `ticket-${number}`, type: ChannelType.GuildText, parent: parentId?.startsWith('REPLACE_') ? undefined : parentId, permissionOverwrites, topic: `Ticket #${number} | ${category.label || category.name} | ${interaction.user.tag}` });
  }
  const ticket = { id: ticketId, guildId: interaction.guildId, channelId: channel.id, userId: interaction.user.id, categoryId: category.value || category.id, categoryName: category.label || category.name, answers, createdAt: new Date().toISOString(), closedAt: null, claimedBy: null };
  await db.setTicket(ticket);
  await channel.send({ content: `<@${interaction.user.id}>`, allowedMentions: { users: [interaction.user.id] } });
  const message = await channel.send({ embeds: [buildTicketEmbed(ticket)], components: controlRows() }); await message.pin().catch(() => {});
  await interaction.editReply({ content: `Ticket created: <#${channel.id}>` }); return true;
}
module.exports = { handleModal };
