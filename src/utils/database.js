const fs = require('node:fs');
const path = require('node:path');

const file = path.join(__dirname, '../../data/tickets.json');
const empty = { nextId: 1, tickets: {}, ratings: {}, audit: [], settings: {}, counters: {} };
function ensure() { fs.mkdirSync(path.dirname(file), { recursive: true }); if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(empty, null, 2)); }
function load() { ensure(); try { const x = JSON.parse(fs.readFileSync(file, 'utf8')); return { ...empty, ...x, tickets: x.tickets || {}, ratings: x.ratings || {}, audit: Array.isArray(x.audit) ? x.audit : [], settings: x.settings || {}, counters: x.counters || {} }; } catch { fs.writeFileSync(file, JSON.stringify(empty, null, 2)); return structuredClone(empty); } }
let state = load(); let queue = Promise.resolve();
function save() { const body = JSON.stringify(state, null, 2); queue = queue.then(() => fs.promises.writeFile(file, body)); return queue; }
function nextId() { const id = state.nextId++; save(); return id; }
function setTicket(t) { state.tickets[String(t.id)] = t; return save(); }
function getTicket(id) { return state.tickets[String(id)] || null; }
function removeTicket(id) { delete state.tickets[String(id)]; return save(); }
function activeTickets() { return Object.values(state.tickets); }
function findByUser(guildId, userId) { return activeTickets().find(t => t.guildId === guildId && t.userId === userId && !t.closedAt); }
function findByChannel(channelId) { return activeTickets().find(t => t.channelId === channelId && !t.closedAt); }
function setRating(id, rating, comment = null) { state.ratings[String(id)] = { score: rating, comment, createdAt: new Date().toISOString() }; if (state.tickets[String(id)]) state.tickets[String(id)].rating = rating; return save(); }
function getRating(id) { return state.ratings[String(id)] || null; }
function stats(guildId) { const all = activeTickets().filter(t => t.guildId === guildId); const ratings = all.map(t => t.rating).filter(Number.isInteger); return { total: all.length, open: all.filter(t => !t.closedAt).length, closed: all.filter(t => t.closedAt).length, ratings: ratings.length, average: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0 }; }
function addAudit(entry) { state.audit.push({ ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, createdAt: new Date().toISOString() }); if (state.audit.length > 5000) state.audit.splice(0, state.audit.length - 5000); return save(); }
function getAudit(guildId, ticketId = null, limit = 50) { return state.audit.filter(e => e.guildId === guildId && (ticketId === null || String(e.ticketId) === String(ticketId))).slice(-limit).reverse(); }
function setGuildSettings(guildId, patch) { state.settings[guildId] = { ...(state.settings[guildId] || {}), ...patch }; return save(); }
function getGuildSettings(guildId) { return state.settings[guildId] || {}; }
function incrementCounter(guildId, key) { const counters = state.counters[guildId] || {}; counters[key] = (counters[key] || 0) + 1; state.counters[guildId] = counters; save(); return counters[key]; }
module.exports = { nextId, setTicket, getTicket, removeTicket, activeTickets, findByUser, findByChannel, setRating, getRating, stats, addAudit, getAudit, setGuildSettings, getGuildSettings, incrementCounter, save };
