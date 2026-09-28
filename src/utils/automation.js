const db = require('./database');
const config = require('../config/config.json');
const timers = new Map();
function clear(ticketId) { const timer = timers.get(String(ticketId)); if (timer) clearTimeout(timer); timers.delete(String(ticketId)); }
function schedule(client, ticket) {
  clear(ticket.id);
  if (!ticket || ticket.closedAt || !config.automation?.autoClose?.enabled) return;
  const timeout = Number(config.automation.autoClose.inactivitySeconds || 0) * 1000;
  if (!timeout || timeout < 1000) return;
  const last = new Date(ticket.lastActivityAt || ticket.createdAt).getTime();
  const remaining = Math.max(1000, last + timeout - Date.now());
  const timer = setTimeout(async () => {
    const fresh = db.getTicket(ticket.id);
    if (!fresh || fresh.closedAt) return;
    const channel = await client.channels.fetch(fresh.channelId).catch(() => null);
    if (!channel) return;
    fresh.autoClosePending = true;
    fresh.status = 'awaiting-close';
    fresh.closeReason = config.automation.autoClose.reason || 'Automatically closed due to inactivity.';
    await db.setTicket(fresh);
    await channel.send({ content: 'This ticket has been inactive and is scheduled for automatic closure.' }).catch(() => {});
    const grace = Number(config.automation.autoClose.graceSeconds || 0);
    if (grace > 0) setTimeout(async () => { const latest = db.getTicket(fresh.id); if (!latest || latest.closedAt) return; await channel.delete('Automatic ticket closure').catch(() => {}); }, grace * 1000);
    else await channel.delete('Automatic ticket closure').catch(() => {});
    timers.delete(String(ticket.id));
  }, remaining);
  timers.set(String(ticket.id), timer);
}
function touch(client, ticket) { ticket.lastActivityAt = new Date().toISOString(); ticket.autoClosePending = false; ticket.status = ticket.claimedBy ? 'claimed' : 'open'; db.setTicket(ticket).catch(() => {}); schedule(client, ticket); }
function restore(client) { for (const ticket of db.activeTickets()) schedule(client, ticket); }
module.exports = { schedule, touch, restore, clear };
