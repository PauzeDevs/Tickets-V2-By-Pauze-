const { EmbedBuilder } = require('discord.js');
const emojis = require('../config/emojis.json');
const icon = (key) => emojis[key] || '';
const ACCENT = 0x5865F2;
const DARK = 0x2B2D31;
function hubEmbed() {
  return new EmbedBuilder().setColor(DARK).setTitle('Support Center').setDescription('Select a category below to open a private support ticket.\n\nProvide accurate information in the intake form so the support team can resolve your request quickly.').setFooter({ text: 'Support • Pauze Tickets' });
}
function ticketEmbed(ticket) {
  return new EmbedBuilder().setColor(ACCENT).setTitle(`${icon(ticket.categoryEmoji)} Ticket #${String(ticket.id).padStart(4,'0')}`).setDescription('Your request has been received. A support member will assist you shortly.').addFields(
    { name: 'Creator', value: `<@${ticket.userId}>`, inline: true },
    { name: 'Category', value: ticket.categoryLabel, inline: true },
    { name: 'Opened', value: `<t:${Math.floor(new Date(ticket.createdAt).getTime()/1000)}:R>`, inline: true },
    { name: 'Topic', value: ticket.topic.slice(0,1024) || 'Not provided' },
    { name: 'Description', value: ticket.description.slice(0,1024) || 'Not provided' },
    ...(ticket.identifier ? [{ name: 'Identifier', value: ticket.identifier.slice(0,1024) }] : [])
  ).setFooter({ text: 'Use the controls below to manage this ticket.' });
}
module.exports = { hubEmbed, ticketEmbed, DARK, ACCENT, icon };
