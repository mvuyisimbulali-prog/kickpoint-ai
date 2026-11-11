const $ = function (s) { return document.querySelector(s); };
let current = null;

function pct(x) { return (x * 100).toFixed(1) + '%'; }
function money(x) { return Number(x).toFixed(2); }
function riskClass(p) { return p >= 0.68 ? 'low' : p >= 0.55 ? 'mid' : 'high'; }
function riskWord(p) { return p >= 0.68 ? 'LOW RISK' : p >= 0.55 ? 'BALANCED RISK' : 'HIGH RISK'; }

function render(ticket) {
  current = ticket;

  $('#summary').innerHTML = [
    '<div class="sum-cell"><small>RISK PROFILE</small><b>' + ticket.riskLabel + '</b></div>',
    '<div class="sum-cell"><small>SELECTIONS</small><b>' + ticket.picks.length + '</b></div>',
    '<div class="sum-cell"><small>COMBINED CHANCE</small><b>' + pct(ticket.combined) + '</b></div>',
    '<div class="sum-cell"><small>COMBINED PRICE</small><b>' + (ticket.picks.length ? money(ticket.totalOdds) : '-') + '</b></div>',
    '<div class="sum-cell"><small>AVERAGE EDGE</small><b>' + (ticket.avgEdge >= 0 ? '+' : '') + ticket.avgEdge.toFixed(1) + '%</b></div>'
  ].join('');

  if (!ticket.picks.length) {
    $('#result-title').textContent = 'Nothing qualified';
    $('#result-sub').textContent = 'A good generator is allowed to say no. Try Balanced, or allow both sports.';
    $('#picks').innerHTML = '<p class="empty">No selection passed the filters for that sport and risk level.</p>';
    return;
  }

  $('#result-title').textContent = ticket.riskLabel + ' ticket - ' + ticket.picks.length + ' pick' + (ticket.picks.length > 1 ? 's' : '');
  $('#result-sub').textContent = ticket.verdict;

  $('#picks').innerHTML = ticket.picks.map(function (p) {
    return '<article class="pick">' +
      '<header><span>' + p.league + ' - ' + (p.sport === 'tennis' ? 'TENNIS' : 'SOCCER') + '</span>' +
      '<span class="risk ' + riskClass(p.prob) + '">' + riskWord(p.prob) + '</span></header>' +
      '<h3>' + p.match + '</h3>' +
      '<p class="market">' + p.market + '</p>' +
      '<div class="pick-stats">' +
        '<div><small>MODEL CHANCE</small><b>' + pct(p.prob) + '</b></div>' +
        '<div><small>PRICE</small><b>' + money(p.odds) + '</b></div>' +
        '<div><small>FAIR PRICE</small><b>' + money(p.fairOdds) + '</b></div>' +
        '<div><small>EDGE</small><b class="' + (p.edge >= 0 ? 'pos' : 'neg') + '">' + (p.edge >= 0 ? '+' : '') + p.edge.toFixed(1) + '%</b></div>' +
      '</div>' +
      '<p class="why"><b>Why:</b> ' + p.context + '</p>' +
      '</article>';
  }).join('');
}

$('#generate').addEventListener('click', function () {
  const ticket = window.KickPoint.buildTicket({
    sport: $('#sport').value,
    risk: $('#risk').value,
    count: Number($('#count').value)
  });
  render(ticket);
  const sec = $('#result-section');
  sec.hidden = false;
  sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

/* Saved tickets live in this browser only - no account, no server. */
const KEY = 'kickpoint.tickets';
function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; }
}
function saveAll(list) { localStorage.setItem(KEY, JSON.stringify(list.slice(0, 20))); }

function renderHistory() {
  const list = load();
  if (!list.length) {
    $('#history').innerHTML = '<p class="empty">Nothing saved yet. Generate a ticket and save it to keep a record.</p>';
    return;
  }
  $('#history').innerHTML = list.map(function (t, i) {
    return '<article class="saved"><div>' +
      '<b>' + t.riskLabel + ' - ' + t.picks.length + ' pick' + (t.picks.length > 1 ? 's' : '') + '</b>' +
      '<span>' + new Date(t.createdAt).toLocaleString() + ' - combined ' + pct(t.combined) + ' - price ' + money(t.totalOdds) + '</span>' +
      '<ul>' + t.picks.map(function (p) { return '<li>' + p.market + ' <i>(' + p.match + ')</i></li>'; }).join('') + '</ul>' +
      '</div><button class="button ghost small" data-del="' + i + '">Remove</button></article>';
  }).join('');

  document.querySelectorAll('[data-del]').forEach(function (b) {
    b.addEventListener('click', function () {
      const l = load();
      l.splice(Number(b.dataset.del), 1);
      saveAll(l);
      renderHistory();
    });
  });
}

$('#save').addEventListener('click', function () {
  if (!current || !current.picks.length) return;
  const l = load();
  l.unshift(current);
  saveAll(l);
  renderHistory();
  const btn = $('#save');
  btn.textContent = 'Saved to My picks';
  setTimeout(function () { btn.textContent = 'Save this ticket to My picks'; }, 1800);
  $('#tracked').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

$('.menu-button').addEventListener('click', function (e) {
  const n = $('#nav-links');
  n.classList.toggle('open');
  e.currentTarget.setAttribute('aria-expanded', n.classList.contains('open'));
});

renderHistory();
