const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const db = require('../utils/database');
const { buildTicketEmbed, color } = require('../utils/embeds');
const { createTranscript } = require('../utils/transcript');
const config = require('../config/config.json');
const emojis = require('../config/emojis.json');
const icon = key => { const v = emojis[key]; const m = String(v || '').match(/<a?:[^:]+:(\d+)>/); return m ? { id: m[1], animated: String(v).startsWith('<a:') } : undefined; };
const staff = member => member.permissions.has(PermissionFlagsBits.ManageChannels) || member.permissions.has(PermissionFlagsBits.ManageGuild) || (config.supportRoleId && member.roles.cache.has(config.supportRoleId)) || (config.staffRoleIds || []).some(id => member.roles.cache.has(id));
async function handleButton(interaction) {
  const id = interaction.customId;
  if (id.startsWith('ticket:rate:')) { const [, , ticketId, score] = id.split(':'); const ticket = db.getTicket(ticketId); if (!ticket || ticket.userId !== interaction.user.id) return interaction.reply({ content: 'This rating is not available for your account.', ephemeral: true }); await db.setRating(ticketId, Number(score)); return interaction.update({ content: `Rating recorded: ${score}/5.`, embeds: [], components: [] }); }
  const ticket = db.findByChannel(interaction.channelId); if (!ticket) return false;
  if (!staff(interaction.member)) return interaction.reply({ content: 'You do not have permission to manage this ticket.', ephemeral: true });
  if (id === 'ticket:claim') { if (ticket.claimedBy && ticket.claimedBy !== interaction.user.id) return interaction.reply({ content: 'This ticket is already claimed by another staff member.', ephemeral: true }); ticket.claimedBy = interaction.user.id; await db.setTicket(ticket); await interaction.channel.setTopic(`Ticket #${String(ticket.id).padStart(4, '0')} | Claimed by ${interaction.user.tag}`).catch(() => {}); return interaction.update({ embeds: [buildTicketEmbed(ticket)], components: controlRows() }); }
  if (id === 'ticket:transcript') { await interaction.deferReply({ ephemeral: true }); const transcript = await createTranscript(interaction.channel, ticket); return interaction.editReply({ content: 'Transcript generated.', files: [{ attachment: Buffer.from(transcript.html), name: transcript.filename }] }); }
  if (id === 'ticket:close') { const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket:close:confirm').setLabel('Confirm').setStyle(ButtonStyle.Danger).setEmoji(icon('close')), new ButtonBuilder().setCustomId('ticket:close:cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary).setEmoji(icon('cancel'))); return interaction.update({ content: 'Confirm ticket closure.', components: [row] }); }
  if (id === 'ticket:close:cancel') return interaction.update({ content: '', components: controlRows(), embeds: [buildTicketEmbed(ticket)] });
  if (id === 'ticket:close:confirm') { const modal = new ModalBuilder().setCustomId(`ticket:closemodal:${ticket.id}`).setTitle('Close Ticket').addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('reason').setLabel('Closure Reason').setStyle(TextInputStyle.Paragraph).setMaxLength(1000).setRequired(true))); return interaction.showModal(modal); }
  return false;
}
function controlRows() { return [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket:claim').setLabel('Claim').setStyle(ButtonStyle.Secondary).setEmoji(icon('claim')), new ButtonBuilder().setCustomId('ticket:transcript').setLabel('Export').setStyle(ButtonStyle.Secondary).setEmoji(icon('transcript')), new ButtonBuilder().setCustomId('ticket:close').setLabel('Close').setStyle(ButtonStyle.Danger).setEmoji(icon('close')))]; }
module.exports = { handleButton, controlRows };
