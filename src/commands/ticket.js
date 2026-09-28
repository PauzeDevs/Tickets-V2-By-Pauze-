const fs = require('node:fs');
const path = require('node:path');
const { SlashCommandBuilder, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const db = require('../utils/database');
const config = require('../config/config.json');
const configPath = path.join(__dirname, '../config/config.json');
const staff = member => member.permissions.has(PermissionFlagsBits.ManageGuild) || member.permissions.has(PermissionFlagsBits.ManageChannels) || (config.supportRoleId && member.roles.cache.has(config.supportRoleId)) || (config.staffRoleIds || []).some(id => member.roles.cache.has(id));
const save = () => fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);

module.exports = {
  data: new SlashCommandBuilder().setName('ticket').setDescription('Manage tickets and configure Pauze Tickets')
    .addSubcommand(s => s.setName('add').setDescription('Add a user').addUserOption(o => o.setName('user').setDescription('User').setRequired(true)))
    .addSubcommand(s => s.setName('remove').setDescription('Remove a user').addUserOption(o => o.setName('user').setDescription('User').setRequired(true)))
    .addSubcommand(s => s.setName('rename').setDescription('Rename the ticket').addStringOption(o => o.setName('name').setDescription('New ticket name').setRequired(true).setMaxLength(90)))
    .addSubcommand(s => s.setName('transfer').setDescription('Transfer ticket access').addUserOption(o => o.setName('user').setDescription('Support user')).addRoleOption(o => o.setName('role').setDescription('Support role')))
    .addSubcommand(s => s.setName('stats').setDescription('View ticket statistics'))
    .addSubcommand(s => s.setName('setup').setDescription('View ticket setup'))
    .addSubcommand(s => s.setName('settings').setDescription('View ticket settings'))
    .addSubcommand(s => s.setName('panel').setDescription('Manage the ticket panel').addStringOption(o => o.setName('action').setDescription('Action').setRequired(true).addChoices({name:'Preview',value:'preview'},{name:'Reset',value:'reset'})))
    .addSubcommand(s => s.setName('embed').setDescription('Open the Discord-native embed editor').addStringOption(o => o.setName('target').setDescription('Embed target').setRequired(true).addChoices({name:'Panel',value:'panel'},{name:'Ticket',value:'ticket'})))
    .addSubcommand(s => s.setName('category').setDescription('Manage ticket categories').addStringOption(o => o.setName('action').setDescription('Action').setRequired(true).addChoices({name:'List',value:'list'})))
    .addSubcommand(s => s.setName('form').setDescription('Manage intake forms').addStringOption(o => o.setName('action').setDescription('Action').setRequired(true).addChoices({name:'List',value:'list'})))
    .addSubcommand(s => s.setName('team').setDescription('Manage support teams').addStringOption(o => o.setName('action').setDescription('Action').setRequired(true).addChoices({name:'List',value:'list'})))
    .addSubcommand(s => s.setName('logs').setDescription('Configure ticket logs').addChannelOption(o => o.setName('channel').setDescription('Log channel')))
    .addSubcommand(s => s.setName('csat').setDescription('Configure CSAT').addBooleanOption(o => o.setName('enabled').setDescription('Enable CSAT').setRequired(true))),
  async execute(i) {
    const sub=i.options.getSubcommand();
    if(sub==='stats'){const s=db.stats(i.guildId);return i.reply({content:`Tickets: ${s.total}\nOpen: ${s.open}\nClosed: ${s.closed}\nRatings: ${s.ratings}\nAverage rating: ${s.average.toFixed(2)}/5`,ephemeral:true});}
    if(!staff(i.member))return i.reply({content:'You do not have permission to manage or configure tickets.',ephemeral:true});
    if(sub==='setup')return i.reply({content:`**Pauze Tickets Setup**\nMode: \`${config.mode}\`\nSupport role: ${config.supportRoleId?`<@&${config.supportRoleId}>`:'Not configured'}\nLogs: ${config.logsChannelId?`<#${config.logsChannelId}>`:'Not configured'}\nCategories: ${config.categories.length}\nMax open/user: ${config.maxOpenTicketsPerUser}\nCSAT: ${config.csat?.enabled===false?'Disabled':'Enabled'}`,ephemeral:true});
    if(sub==='settings')return i.reply({content:`**Ticket Settings**\nMode: \`${config.mode}\`\nAccent: \`${config.theme.accent}\`\nClose delay: ${config.deleteAfterCloseSeconds}s\nTranscripts: ${config.transcripts?.enabled===false?'Disabled':'Enabled'}\nCSAT: ${config.csat?.enabled===false?'Disabled':'Enabled'}`,ephemeral:true});
    if(sub==='category')return i.reply({content:config.categories.map(c=>`\`${c.value}\` — **${c.label}** — ${c.description} — ${c.questions.length} questions`).join('\n')||'No categories configured.',ephemeral:true});
    if(sub==='form')return i.reply({content:config.categories.map(c=>`**${c.label}**\n${c.questions.map(q=>`• ${q.label} — ${q.required?'required':'optional'}`).join('\n')}`).join('\n\n')||'No forms configured.',ephemeral:true});
    if(sub==='team')return i.reply({content:`**Support Team**\nPrimary: ${config.supportRoleId?`<@&${config.supportRoleId}>`:'Not configured'}\nAdditional: ${(config.staffRoleIds||[]).map(id=>`<@&${id}>`).join(', ')||'None'}`,ephemeral:true});
    if(sub==='logs'){const ch=i.options.getChannel('channel');if(ch){config.logsChannelId=ch.id;save();}return i.reply({content:`Ticket logs: ${ch?`<#${ch.id}>`:config.logsChannelId?`<#${config.logsChannelId}>`:'Not configured'}`,ephemeral:true});}
    if(sub==='csat'){config.csat=config.csat||{};config.csat.enabled=i.options.getBoolean('enabled');save();return i.reply({content:`CSAT is now **${config.csat.enabled?'enabled':'disabled'}**.`,ephemeral:true});}
    if(sub==='panel'){const a=i.options.getString('action');if(a==='reset'){config.embeds.panel={title:'Support Center',description:'Select a department below to create a private support ticket.',color:'#2B2D31',footer:'Pauze Tickets'};save();return i.reply({content:'Panel embed reset.',ephemeral:true});}const e=config.embeds.panel;return i.reply({content:`**Panel Preview**\n${e.title}\n${e.description}\nColor: ${e.color}\nFooter: ${e.footer||'None'}`,ephemeral:true});}
    if(sub==='embed'){const target=i.options.getString('target');const e=config.embeds[target]||{};const modal=new ModalBuilder().setCustomId(`ticket_embed_editor:${target}`).setTitle(`${target} embed editor`);const fields=[['title','Title',TextInputStyle.Short,e.title||''],['description','Description',TextInputStyle.Paragraph,e.description||''],['color','Hex Color',TextInputStyle.Short,e.color||'#5865F2'],['footer','Footer',TextInputStyle.Short,e.footer||'Pauze Tickets']];modal.addComponents(...fields.map(([id,label,style,value])=>new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId(id).setLabel(label).setStyle(style).setRequired(false).setValue(String(value).slice(0,style===TextInputStyle.Paragraph?4000:100))));return i.showModal(modal);}
    const ticket=db.findByChannel(i.channelId);if(!ticket)return i.reply({content:'This channel is not an active ticket.',ephemeral:true});
    const user=i.options.getUser('user'),role=i.options.getRole('role');
    if(sub==='rename'){const name=i.options.getString('name').replace(/[^a-zA-Z0-9-_ ]/g,'').trim();if(!name)return i.reply({content:'Invalid ticket name.',ephemeral:true});await i.channel.setName(name.slice(0,90));return i.reply({content:'Ticket renamed.'});}
    if(sub==='add'){if(i.channel.isThread())await i.channel.members.add(user.id);else await i.channel.permissionOverwrites.edit(user.id,{ViewChannel:true,SendMessages:true,ReadMessageHistory:true});return i.reply({content:`Added ${user} to the ticket.`});}
    if(sub==='remove'){if(user.id===ticket.userId)return i.reply({content:'The ticket creator cannot be removed.',ephemeral:true});if(i.channel.isThread())await i.channel.members.remove(user.id).catch(()=>{});else await i.channel.permissionOverwrites.delete(user.id).catch(()=>{});return i.reply({content:`Removed ${user} from the ticket.`});}
    if(!user&&!role)return i.reply({content:'Provide a user or role.',ephemeral:true});
    if(user){if(i.channel.isThread())await i.channel.members.add(user.id);else await i.channel.permissionOverwrites.edit(user.id,{ViewChannel:true,SendMessages:true,ReadMessageHistory:true});ticket.claimedBy=user.id;}
    if(role&&!i.channel.isThread())await i.channel.permissionOverwrites.edit(role.id,{ViewChannel:true,SendMessages:true,ReadMessageHistory:true});
    await db.setTicket(ticket);return i.reply({content:'Ticket access transferred.'});
  }
};
