const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../config/config.json');
const { hubEmbed } = require('../utils/embeds');
const { panelRow } = require('../utils/components');
module.exports = { data:new SlashCommandBuilder().setName('setup-panel').setDescription('Deploy the ticket support panel').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild), async execute(interaction){ await interaction.channel.send({ embeds:[hubEmbed()], components:[panelRow(config.categories)] }); await interaction.reply({content:'Support panel deployed.',ephemeral:true}); } };
