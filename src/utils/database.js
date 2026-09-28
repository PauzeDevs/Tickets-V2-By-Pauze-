const fs = require('node:fs');
const path = require('node:path');
const file = path.join(__dirname, '../../data/tickets.json');

function load() {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return { nextId: 1, tickets: {}, ratings: {} }; }
}
function save(data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}
function nextTicketId() {
  const data = load(); const id = data.nextId++;
  save(data); return id;
}
function setTicket(ticket) {
  const data = load(); data.tickets[ticket.id] = ticket; save(data); return ticket;
}
function getTicket(id) { return load().tickets[id] || null; }
function removeTicket(id) { const data = load(); delete data.tickets[id]; save(data); }
function setRating(id, rating) { const data = load(); data.ratings[id] = rating; save(data); }
function getRating(id) { return load().ratings[id] || null; }
function activeTickets() { return Object.values(load().tickets); }
module.exports = { load, nextTicketId, setTicket, getTicket, removeTicket, setRating, getRating, activeTickets };
