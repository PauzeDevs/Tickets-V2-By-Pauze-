const { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../utils/database');
const config = require('../config/config.json');
const emojis = require('../config/emojis.json');
const { buildTicketEmbed, color } = require('../utils/embeds');
const { controlRows } = require('./buttons');
const { createTranscript } = require('../utils/transcript');
const icon = key => { const v = emojis[key]; const m = String(v || '').match(/<a?:[^:]+:(\d+)>/); return m ? { id: m[1], animated: String(v).startsWith('<a:') } : undefined; };
async function handleIntake(interaction) {
  const categoryId = interaction.customId.split(':')[2]; const category = (config.categories || []).find(c => (c.id || c.value) === categoryId);
  if (!category) return interaction.reply({ content: 'This ticket category is no longer available.', ephemeral: true });
  const existing = db.findByUser(interaction.guildId, interaction.user.id); if (existing) return interaction.reply({ content: `You already have an open ticket: <#${existing.channelId}>.`, ephemeral: true });
  await interaction.deferReply({ ephemeral: true }); const ticketId = db.nextId();
  const questions = category.questions?.length ? category.questions : [{ id: 'topic' }, { id: 'details' }, { id: 'identifier' }]; const answers = {}; for (const q of questions) answers[q.id] = interaction.fields.getTextInputValue(q.id) || '';
  const number = String(ticketId).padStart(4, '0'); const permissionOverwrites = [{ id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] }, { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] }];
  const supportRoles = [...new Set([...(config.staffRoleIds || []), config.supportRoleId].filter(id => id && !id.startsWith('REPLACE_')))]; for (const roleId of supportRoles) permissionOverwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages] });
  let channel;
  if (config.mode === 'thread') { const parent = await interaction.guild.channels.fetch(config.intakeChannelId).catch(() => null); if (!parent?.isTextBased()) return interaction.editReply({ content: 'The configured intake channel is unavailable.' }); channel = await parent.threads.create({ name: `${category.value || category.id}-${number}`, type: ChannelType.PrivateThread, invitable: false, reason: `Ticket #${number}` }); await channel.members.add(interaction.user.id).catch(() => {}); }
  else { const parentId = category.channelCategoryId || config.ticketCategoryId; channel = await interaction.guild.channels.create({ name: `ticket-${number}`, type: ChannelType.GuildText, parent: parentId?.startsWith('REPLACE_') ? undefined : parentId, permissionOverwrites, topic: `Ticket #${number} | ${category.label || category.name} | ${interaction.user.tag}` }); }
  const ticket = { id: ticketId, guildId: interaction.guildId, channelId: channel.id, userId: interaction.user.id, categoryId: category.value || category.id, categoryName: category.label || category.name, answers, createdAt: new Date().toISOString(), closedAt: null, claimedBy: null };
  await db.setTicket(ticket); await channel.send({ content: `<@${interaction.user.id}>`, allowedMentions: { users: [interaction.user.id] } }); const message = await channel.send({ embeds: [buildTicketEmbed(ticket)], components: controlRows() }); await message.pin().catch(() => {}); await interaction.editReply({ content: `Ticket created: <#${channel.id}>` });
}
async function handleClose(interaction) {
  const ticket = db.getTicket(interaction.customId.split(':')[2]); if (!ticket || ticket.channelId !== interaction.channelId) return interaction.reply({ content: 'This ticket is no longer active.', ephemeral: true });
  const reason = interaction.fields.getTextInputValue('reason').trim(); await interaction.deferReply({ ephemeral: true }); const transcript = await createTranscript(interaction.channel, ticket); ticket.closedAt = new Date().toISOString(); ticket.closedBy = interaction.user.id; ticket.closeReason = reason; ticket.transcript = transcript.filename; await db.setTicket(ticket);
  const duration = Math.max(0, Date.now() - new Date(ticket.createdAt).getTime()); const durationText = `${Math.floor(duration / 3600000)}h ${Math.floor(duration / 60000) % 60}m`;
  const row = new ActionRowBuilder().addComponents(...[1, 2, 3, 4, 5].map(n => new ButtonBuilder().setCustomId(`ticket:rate:${ticket.id}:${n}`).setLabel(String(n)).setStyle(ButtonStyle.Secondary).setEmoji(icon('star'))));
  const creator = await interaction.client.users.fetch(ticket.userId).catch(() => null); if (creator) await creator.send({ embeds: [new EmbedBuilder().setColor(color()).setTitle(`Ticket #${String(ticket.id).padStart(4, '0')} closed`).setDescription(`Reason: ${reason}\nResolved by: <@${interaction.user.id}>\nDuration: ${durationText}`)], files: [{ attachment: Buffer.from(transcript.html), name: transcript.filename }], components: [row] }).catch(() => {});
  const logs = config.logsChannelId && !config.logsChannelId.startsWith('REPLACE_') ? await interaction.client.channels.fetch(config.logsChannelId).catch(() => null) : null; if (logs?.isTextBased()) await logs.send({ embeds: [new EmbedBuilder().setColor(color()).setTitle(`Ticket #${String(ticket.id).padStart(4, '0')} closed`).addFields({ name: 'Creator', value: `<@${ticket.userId}>`, inline: true }, { name: 'Resolved by', value: `<@${interaction.user.id}>`, inline: true }, { name: 'Duration', value: durationText, inline: true }, { name: 'Reason', value: reason.slice(0, 1024) })], files: [{ attachment: Buffer.from(transcript.html), name: transcript.filename }] });
  await interaction.editReply({ content: 'Ticket closed and transcript generated.' }); await interaction.channel.send({ embeds: [new EmbedBuilder().setColor(color()).setTitle('Ticket closed').setDescription('This ticket is now archived.')] }); if (config.deleteAfterCloseSeconds >= 0) setTimeout(() => interaction.channel.delete('Ticket closed').catch(() => {}), config.deleteAfterCloseSeconds * 1000);
}
async function handleModal(interaction) { if (interaction.customId.startsWith('ticket:intake:')) return handleIntake(interaction); if (interaction.customId.startsWith('ticket:closemodal:')) return handleClose(interaction); return false; }
module.exports = { handleModal };
