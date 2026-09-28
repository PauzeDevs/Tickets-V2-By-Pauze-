const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../utils/database');
const { canStaff } = require('../services/ticketManager');
module.exports = { data:new SlashCommandBuilder().setName('ticket').setDescription('Manage the current ticket')
 .addSubcommand(s=>s.setName('add').setDescription('Add a user').addUserOption(o=>o.setName('user').setDescription('User').setRequired(true)))
 .addSubcommand(s=>s.setName('remove').setDescription('Remove a user').addUserOption(o=>o.setName('user').setDescription('User').setRequired(true)))
 .addSubcommand(s=>s.setName('rename').setDescription('Rename the ticket').addStringOption(o=>o.setName('name').setDescription('New name').setRequired(true).setMaxLength(80)))
 .addSubcommand(s=>s.setName('transfer').setDescription('Transfer the ticket').addUserOption(o=>o.setName('user').setDescription('User').setRequired(true))),
 async execute(interaction){ const ticket=db.activeTickets().find(t=>t.channelId===interaction.channelId); if(!ticket) return interaction.reply({content:'This channel is not an active ticket.',ephemeral:true}); if(!canStaff(interaction.member)) return interaction.reply({content:'You do not have ticket staff permissions.',ephemeral:true}); const sub=interaction.options.getSubcommand(); const user=interaction.options.getUser('user');
 if(sub==='add'){ await interaction.channel.permissionOverwrites.edit(user.id,{ViewChannel:true,SendMessages:true,ReadMessageHistory:true,AttachFiles:true}); return interaction.reply({content:`Added ${user}.`,ephemeral:true}); }
 if(sub==='remove'){ await interaction.channel.permissionOverwrites.delete(user.id).catch(()=>{}); return interaction.reply({content:`Removed ${user}.`,ephemeral:true}); }
 if(sub==='rename'){ await interaction.channel.setName(interaction.options.getString('name').toLowerCase().replace(/[^a-z0-9-]/g,'-').slice(0,90)); return interaction.reply({content:'Ticket renamed.',ephemeral:true}); }
 await interaction.channel.permissionOverwrites.edit(user.id,{ViewChannel:true,SendMessages:true,ReadMessageHistory:true}); ticket.claimedBy=user.id; db.setTicket(ticket); return interaction.reply({content:`Ticket transferred to ${user}.`,ephemeral:true}); } };
