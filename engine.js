/* ------------------------------------------------------------------
   KickPoint engine - scores match options and builds a ticket.
   The maths is real. The fixture feed is practice data.
-------------------------------------------------------------------*/

const FIXTURES = [
  { id:'s1', sport:'soccer', league:'Premier League', home:'North London FC', away:'Riverside United',
    context:'Home side unbeaten in 5 at home; the visitor has conceded in 8 of 9 away games. The midfield matchup favours the home team.',
    form:[0.62,0.24,0.14], goals:2.9, homeAdv:0.05 },
  { id:'s2', sport:'soccer', league:'La Liga', home:'Capital Athletic', away:'Valencia Coast',
    context:'Both teams score regularly and neither keeps clean sheets. Expected goals for the fixture sit above 3.',
    form:[0.45,0.27,0.28], goals:3.4, homeAdv:0.03 },
  { id:'s3', sport:'soccer', league:'Serie A', home:'Torino Blue', away:'Rome Eagles',
    context:'Two of the most disciplined defences in the division, and recent meetings have produced few clear chances.',
    form:[0.40,0.34,0.26], goals:1.9, homeAdv:0.04 },
  { id:'s4', sport:'soccer', league:'Bundesliga', home:'Rhine City', away:'Bavaria South',
    context:'The away side is the stronger team but travels poorly, and the home press has forced high turnovers recently.',
    form:[0.33,0.26,0.41], goals:3.1, homeAdv:0.06 },
  { id:'s5', sport:'soccer', league:'Ligue 1', home:'Marseille Port', away:'Lyon Valley',
    context:'Low-scoring profile with a tight home defence and an away side missing its main striker.',
    form:[0.44,0.31,0.25], goals:2.1, homeAdv:0.05 },
  { id:'s6', sport:'soccer', league:'Eredivisie', home:'Amstel FC', away:'Rotterdam North',
    context:'The home team averages three goals at home and the visitor concedes from set pieces consistently.',
    form:[0.58,0.24,0.18], goals:3.6, homeAdv:0.04 },
  { id:'t1', sport:'tennis', league:'ATP 500', home:'L. Novak', away:'M. Santos',
    context:'Novak has won 8 of his last 10 on this surface and holds serve above 80% in recent matches.',
    form:[0.66,0.34], hold:[0.84,0.76] },
  { id:'t2', sport:'tennis', league:'WTA 1000', home:'A. Jordan', away:'K. Ito',
    context:'Both players hold serve well and their last three meetings all went beyond 21 games.',
    form:[0.52,0.48], hold:[0.79,0.78] },
  { id:'t3', sport:'tennis', league:'ATP 250', home:'D. Mensah', away:'R. Cole',
    context:'An evenly rated pair with a narrow head-to-head record, so the handicap protects against a close loss.',
    form:[0.51,0.49], hold:[0.77,0.80] },
  { id:'t4', sport:'tennis', league:'ATP Masters', home:'P. Adeyemi', away:'J. Fontaine',
    context:'Adeyemi returns well against big servers and has taken four of the last five sets between them.',
    form:[0.63,0.37], hold:[0.81,0.83] },
  { id:'t5', sport:'tennis', league:'WTA 500', home:'S. Petrov', away:'L. Marchetti',
    context:'Petrov is a heavy favourite with a large ranking gap and a strong record on this surface.',
    form:[0.72,0.28], hold:[0.85,0.71] }
];

/* The markets available on one fixture. */
function optionsFor(f) {
  if (f.sport === 'tennis') {
    const pWin = f.form[0];
    const games = 20.5 + (1 - Math.max(f.hold[0], f.hold[1])) * 8;
    return [
      { label: f.home + ' to win', p: pWin, odds: 1 / Math.max(pWin - 0.02, 0.05), weight: 1.00 },
      { label: 'Over ' + games.toFixed(1) + ' games', p: 0.5 + (f.hold[0] + f.hold[1] - 1.55) * 0.8, odds: 1.90, weight: 1.05 },
      { label: f.home + ' to win 2-0', p: pWin * 0.55, odds: 2.60, weight: 0.90 },
      { label: 'Either player to win a set', p: 0.5 + Math.min(f.form[1], 0.44), odds: 1.60, weight: 0.85 }
    ];
  }
  const pH = f.form[0], pD = f.form[1], pA = f.form[2];
  return [
    { label: f.home + ' to win', p: pH + f.homeAdv, odds: 1 / Math.max(pH + f.homeAdv - 0.03, 0.05), weight: 1.00 },
    { label: 'Over 1.5 goals', p: 0.5 + (f.goals - 2.4) * 0.22, odds: 1.55, weight: 1.05 },
    { label: 'Under 3.5 goals', p: 0.5 + (3.0 - f.goals) * 0.20, odds: 1.65, weight: 1.05 },
    { label: 'Both teams to score', p: 0.52 + (f.goals - 2.7) * 0.13, odds: 1.75, weight: 0.95 },
    { label: f.away + ' or draw (double chance)', p: pD + pA + 0.06, odds: 1.45, weight: 0.90 }
  ];
}

/* Turn raw markets into scored selections. */
function scoreFixture(f) {
  return optionsFor(f).map((o, i) => {
    const p = Math.min(Math.max(o.p, 0.05), 0.94);
    const fairOdds = 1 / p;
    const edge = (p * o.odds - 1) * 100;
    const implied = (1 / o.odds) * 100;
    const quality = p * 100 * o.weight - Math.max(0, 55 - p * 100) * 0.35;
    return {
      key: f.id + '-' + i,
      fixtureId: f.id,
      sport: f.sport,
      league: f.league,
      match: f.home + ' vs ' + f.away,
      market: o.label,
      prob: p,
      odds: o.odds,
      fairOdds: fairOdds,
      implied: implied,
      edge: edge,
      quality: quality,
      context: f.context
    };
  });
}

const RISK = {
  low:  { minProb: 0.64, maxOdds: 2.10, label: 'Conservative' },
  mid:  { minProb: 0.50, maxOdds: 3.00, label: 'Balanced' },
  high: { minProb: 0.30, maxOdds: 6.00, label: 'Aggressive' }
};

/* Build one ticket. Returns its picks plus combined chance, price and a verdict. */
function buildTicket(opts) {
  opts = opts || {};
  const sport = opts.sport || 'both';
  const risk = opts.risk || 'mid';
  const count = opts.count || 3;
  const cfg = RISK[risk] || RISK.mid;

  const pool = FIXTURES
    .filter(function (f) { return sport === 'both' || f.sport === sport; })
    .reduce(function (all, f) { return all.concat(scoreFixture(f)); }, [])
    .filter(function (s) { return s.prob >= cfg.minProb && s.odds <= cfg.maxOdds; })
    .sort(function (a, b) { return b.quality - a.quality; });

  const picked = [];
  const used = {};
  for (let i = 0; i < pool.length; i++) {
    const s = pool[i];
    if (used[s.fixtureId]) continue;
    used[s.fixtureId] = true;
    picked.push(s);
    if (picked.length >= count) break;
  }

  let combined = 1, totalOdds = 1, edgeSum = 0;
  for (let i = 0; i < picked.length; i++) {
    combined *= picked[i].prob;
    totalOdds *= picked[i].odds;
    edgeSum += picked[i].edge;
  }
  const weakest = picked.length ? Math.min.apply(null, picked.map(function (s) { return s.prob; })) : 0;

  return {
    id: 'T' + String(Date.now()).slice(-6),
    createdAt: new Date().toISOString(),
    sport: sport,
    risk: risk,
    riskLabel: cfg.label,
    picks: picked,
    combined: picked.length ? combined : 0,
    totalOdds: picked.length ? totalOdds : 0,
    avgEdge: picked.length ? edgeSum / picked.length : 0,
    weakest: weakest,
    verdict: weakest >= 0.70
      ? 'The engine rates this as its safest shape. That still does not make it certain.'
      : weakest >= 0.60
        ? 'A reasonable ticket, but at least one leg carries noticeable risk.'
        : 'Every extra leg multiplies the risk. Treat this one as speculative.'
  };
}

window.KickPoint = { FIXTURES: FIXTURES, buildTicket: buildTicket, RISK: RISK };
