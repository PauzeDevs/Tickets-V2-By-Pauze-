const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const config = require('../config/config.json');

async function handleSelect(interaction) {
  if (!interaction.customId.startsWith('ticket:panel')) return false;
  const category = interaction.values[0];
  const entry = (config.categories || []).find(c => c.id === category);
  if (!entry) return interaction.reply({ content: 'That ticket category is not configured.', ephemeral: true });
  const modal = new ModalBuilder().setCustomId(`ticket:intake:${category}`).setTitle(`${entry.name} request`);
  const questions = entry.questions?.length ? entry.questions : [
    { id: 'topic', label: 'Short topic', style: 'Short', required: true, placeholder: 'Briefly describe the issue' },
    { id: 'details', label: 'Detailed description', style: 'Paragraph', required: true, placeholder: 'Provide the details we need to help you' },
    { id: 'identifier', label: 'ID / Gamertag / Email', style: 'Short', required: false, placeholder: 'Optional' }
  ];
  for (const q of questions.slice(0, 5)) {
    const input = new TextInputBuilder().setCustomId(q.id).setLabel(q.label).setStyle(q.style === 'Paragraph' ? TextInputStyle.Paragraph : TextInputStyle.Short).setRequired(q.required !== false);
    if (q.placeholder) input.setPlaceholder(q.placeholder);
    if (q.maxLength) input.setMaxLength(q.maxLength);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
  }
  await interaction.showModal(modal);
  return true;
}
module.exports = { handleSelect };
