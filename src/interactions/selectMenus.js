const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const config = require('../config/config.json');
async function handleSelect(interaction) {
  if (interaction.customId !== 'ticket:panel') return false;
  const categoryId = interaction.values[0]; const entry = (config.categories || []).find(c => (c.id || c.value) === categoryId);
  if (!entry) return interaction.reply({ content: 'That ticket category is not configured.', ephemeral: true });
  const modal = new ModalBuilder().setCustomId(`ticket:intake:${categoryId}`).setTitle(`${entry.label || entry.name} request`);
  const questions = entry.questions?.length ? entry.questions : [{ id: 'topic', label: 'Short Topic', style: 'Short', required: true }, { id: 'details', label: 'Detailed Description', style: 'Paragraph', required: true }, { id: 'identifier', label: 'ID / Gamertag / Email', style: 'Short', required: false }];
  for (const q of questions.slice(0, 5)) { const input = new TextInputBuilder().setCustomId(q.id).setLabel(q.label).setStyle(q.style === 'Paragraph' ? TextInputStyle.Paragraph : TextInputStyle.Short).setRequired(q.required !== false); if (q.placeholder) input.setPlaceholder(q.placeholder); if (q.maxLength) input.setMaxLength(q.maxLength); modal.addComponents(new ActionRowBuilder().addComponents(input)); }
  await interaction.showModal(modal); return true;
}
module.exports = { handleSelect };
