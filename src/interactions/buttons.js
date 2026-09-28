const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../utils/database');
const { buildTicketEmbed, color } = require('../utils/embeds');
const { createTranscript } = require('../utils/transcript');
const config = require('../config/config.json');
const emojis = require('../config/emojis.json');

const icon = key => emojis[key] || '';
const staff = member => member.permissions.has(PermissionFlagsBits.ManageChannels) || member.roles.cache.has(config.supportRoleId);

async function handleButton(interaction) {
  const id = interaction.customId;
  if (id.startsWith('ticket:open:')) return false;
  if (id.startsWith('ticket:rate:')) {
    const [, , ticketId, score] = id.split(':');
    const ticket = db.getTicket(ticketId);
    if (!ticket || ticket.userId !== interaction.user.id) return interaction.reply({ content: 'This rating is not available for your account.', ephemeral: true });
    await db.setRating(ticketId, Number(score));
    return interaction.update({ content: `Rating recorded: ${score}/5.`, embeds: [], components: [] });
  }
  const ticket = db.findByChannel(interaction.channelId);
  if (!ticket) return false;
  if (!staff(interaction.member)) return interaction.reply({ content: 'You do not have permission to manage this ticket.', ephemeral: true });

  if (id === 'ticket:claim') {
    if (ticket.claimedBy && ticket.claimedBy !== interaction.user.id) return interaction.reply({ content: 'This ticket is already claimed by another staff member.', ephemeral: true });
    ticket.claimedBy = interaction.user.id;
    await db.setTicket(ticket);
    await interaction.channel.setTopic(`Ticket #${String(ticket.id).padStart(4, '0')} | Claimed by ${interaction.user.tag}`).catch(() => {});
    return interaction.update({ embeds: [buildTicketEmbed(ticket)], components: controlRows() });
  }
  if (id === 'ticket:transcript') {
    await interaction.deferReply({ ephemeral: true });
    const transcript = await createTranscript(interaction.channel, ticket);
    return interaction.editReply({ content: 'Transcript generated.', files: [{ attachment: Buffer.from(transcript.html), name: transcript.filename }] });
  }
  if (id === 'ticket:close') {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket:close:confirm').setLabel('Confirm').setStyle(ButtonStyle.Danger).setEmoji(icon('close')),
      new ButtonBuilder().setCustomId('ticket:close:cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary).setEmoji(icon('cancel'))
    );
    return interaction.update({ content: 'Confirm ticket closure.', components: [row] });
  }
  if (id === 'ticket:close:cancel') return interaction.update({ content: '', components: controlRows(), embeds: [buildTicketEmbed(ticket)] });
  if (id === 'ticket:close:confirm') {
    await interaction.deferUpdate();
    const transcript = await createTranscript(interaction.channel, ticket);
    ticket.closedAt = new Date().toISOString(); ticket.closedBy = interaction.user.id; ticket.transcript = transcript.filename;
    await db.setTicket(ticket);
    const creator = await interaction.client.users.fetch(ticket.userId).catch(() => null);
    if (creator) {
      const row = new ActionRowBuilder().addComponents(...[1,2,3,4,5].map(n => new ButtonBuilder().setCustomId(`ticket:rate:${ticket.id}:${n}`).setLabel(String(n)).setStyle(ButtonStyle.Secondary).setEmoji(icon('star'))));
      await creator.send({ embeds: [new EmbedBuilder().setColor(color()).setTitle('Ticket closed').setDescription(`Ticket #${String(ticket.id).padStart(4, '0')} was closed by <@${interaction.user.id}>.`).setFooter({ text: 'Pauze Tickets' })], files: [{ attachment: Buffer.from(transcript.html), name: transcript.filename }], components: [row] }).catch(() => {});
    }
    await interaction.channel.send({ embeds: [new EmbedBuilder().setColor(color()).setTitle('Ticket closed').setDescription('This ticket has been archived and will be deleted shortly.')] });
    setTimeout(() => interaction.channel.delete('Ticket closed').catch(() => {}), config.deleteAfterCloseSeconds * 1000);
    return;
  }
  return false;
}

function controlRows() {
  return [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket:claim').setLabel('Claim').setStyle(ButtonStyle.Secondary).setEmoji(icon('claim')),
    new ButtonBuilder().setCustomId('ticket:transcript').setLabel('Export').setStyle(ButtonStyle.Secondary).setEmoji(icon('transcript')),
    new ButtonBuilder().setCustomId('ticket:close').setLabel('Close').setStyle(ButtonStyle.Danger).setEmoji(icon('close'))
  )];
}
module.exports = { handleButton, controlRows };
