const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const emojis = require('../config/emojis.json');
function emoji(key) { const value = emojis[key]; const match = String(value || '').match(/<a?:[^:]+:(\d+)>/); return match ? { id: match[1], animated: String(value).startsWith('<a:') } : undefined; }
function panelRow(categories) { return new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('ticket:panel').setPlaceholder('Select a support category').addOptions(categories.slice(0, 25).map(c => ({ label: c.label, value: c.value, description: c.description?.slice(0, 100), emoji: emoji(c.emoji) })).filter(o => o.emoji))); }
module.exports = { emoji, panelRow };
