const { ChannelType, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../utils/database');
const config = require('../config/config.json');
const { buildTicketEmbed } = require('../utils/embeds');
const { controlRows } = require('./buttons');

async function handleModal(interaction) {
  if (!interaction.customId.startsWith('ticket:intake:')) return false;
  const categoryId = interaction.customId.split(':')[2];
  const category = (config.categories || []).find(c => c.id === categoryId);
  if (!category) return interaction.reply({ content: 'This ticket category is no longer available.', ephemeral: true });
  const existing = db.findByUser(interaction.guildId, interaction.user.id);
  if (existing) return interaction.reply({ content: `You already have an open ticket: <#${existing.channelId}>.`, ephemeral: true });
  await interaction.deferReply({ ephemeral: true });
  const ticketId = db.nextId();
  const answers = {};
  for (const q of category.questions || [{ id: 'topic' }, { id: 'details' }, { id: 'identifier' }]) answers[q.id] = interaction.fields.getTextInputValue(q.id) || '';
  const number = String(ticketId).padStart(4, '0');
  let channel;
  const permissionOverwrites = [
    { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] }
  ];
  if (config.supportRoleId) permissionOverwrites.push({ id: config.supportRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages] });
  if (config.mode === 'thread') {
    const parent = await interaction.guild.channels.fetch(config.intakeChannelId).catch(() => null);
    if (!parent?.isTextBased()) return interaction.editReply({ content: 'The configured intake channel is unavailable.' });
    channel = await parent.threads.create({ name: `${category.slug || category.id}-${number}`, type: ChannelType.PrivateThread, invitable: false, reason: `Ticket #${number}` });
    await channel.members.add(interaction.user.id).catch(() => {});
    if (config.supportRoleId) await channel.send({ content: `<@&${config.supportRoleId}>` }).catch(() => {});
  } else {
    channel = await interaction.guild.channels.create({ name: `ticket-${number}`, type: ChannelType.GuildText, parent: category.channelCategoryId || config.categoryId, permissionOverwrites, topic: `Ticket #${number} | ${category.name} | ${interaction.user.tag}` });
  }
  const ticket = { id: ticketId, guildId: interaction.guildId, channelId: channel.id, userId: interaction.user.id, categoryId, categoryName: category.name, answers, createdAt: new Date().toISOString(), closedAt: null, claimedBy: null };
  await db.setTicket(ticket);
  await channel.send({ content: `<@${interaction.user.id}>`, allowedMentions: { users: [interaction.user.id] } });
  const message = await channel.send({ embeds: [buildTicketEmbed(ticket)], components: controlRows() });
  await message.pin().catch(() => {});
  await interaction.editReply({ content: `Ticket created: <#${channel.id}>` });
  return true;
}
module.exports = { handleModal };
