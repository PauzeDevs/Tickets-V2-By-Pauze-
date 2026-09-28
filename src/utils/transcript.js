const { AttachmentBuilder } = require('discord.js');
function esc(value='') { return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'); }
async function generateTranscript(channel, ticket) {
  const messages = []; let before;
  while (messages.length < 5000) {
    const batch = await channel.messages.fetch({ limit:100, ...(before ? { before } : {}) });
    if (!batch.size) break;
    messages.push(...batch.values()); before = batch.last().id;
    if (batch.size < 100) break;
  }
  messages.reverse();
  const rows = messages.map(m => `<article class="msg"><img class="avatar" src="${esc(m.author.displayAvatarURL({extension:'png',size:64}))}"><div><div class="meta"><strong>${esc(m.author.tag)}</strong><span>${new Date(m.createdTimestamp).toLocaleString()}</span></div><div class="content">${esc(m.content || '')}${m.attachments.size ? `<div class="attachments">${[...m.attachments.values()].map(a=>`<a href="${esc(a.url)}">${esc(a.name || a.url)}</a>`).join('')}</div>` : ''}</div></div></article>`).join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Ticket #${ticket.id}</title><style>body{margin:0;background:#313338;color:#dbdee1;font:14px Arial,sans-serif}.wrap{max-width:1100px;margin:auto;padding:32px}.head{background:#2b2d31;padding:22px;border-radius:10px;margin-bottom:18px}.head h1{margin:0 0 8px;color:#fff}.msg{display:flex;gap:12px;padding:12px 4px;border-bottom:1px solid #3f4147}.avatar{width:40px;height:40px;border-radius:50%}.meta{display:flex;gap:10px;align-items:center}.meta strong{color:#fff}.meta span{color:#949ba4;font-size:12px}.content{margin-top:4px;white-space:pre-wrap;overflow-wrap:anywhere}.attachments{margin-top:8px;display:flex;flex-direction:column;gap:4px}.attachments a{color:#00a8fc}</style></head><body><main class="wrap"><header class="head"><h1>Ticket #${esc(ticket.id)}</h1><div>Creator: ${esc(ticket.userTag)} · Category: ${esc(ticket.categoryLabel)} · Opened: ${esc(ticket.createdAt)}</div></header>${rows}</main></body></html>`;
  return new AttachmentBuilder(Buffer.from(html,'utf8'), { name:`ticket-${String(ticket.id).padStart(4,'0')}.html` });
}
module.exports = { generateTranscript };
