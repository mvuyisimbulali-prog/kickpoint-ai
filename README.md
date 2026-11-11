# KickPoint AI

A personal soccer and tennis ticket generator. No accounts, no payments, no business - just a tool that scores matches and builds a ticket with the reasoning shown.

## Live

https://mvuyisimbulali-prog.github.io/kickpoint-ai/

## Files

- `index.html` - the page
- `styles.css` - all styling
- `engine.js` - the scoring engine: model probability, fair price, edge, risk filters, ticket builder
- `app.js` - the interface: generator form, ticket display, saved picks in browser storage

## The engine

Every fixture gets a set of markets. Each market receives:

- a **model probability**
- a **fair price** (1 / probability)
- an **edge** = (probability x price) - 1
- a **quality score**, used to rank selections against each other

`buildTicket({ sport, risk, count })` filters by the chosen risk profile, sorts by quality, takes at most one selection per fixture, and returns the ticket with its combined chance, combined price and a plain-language verdict.

Risk profiles:

| Profile | Minimum chance | Maximum price |
|---|---|---|
| Conservative | 64% | 2.10 |
| Balanced | 50% | 3.00 |
| Aggressive | 30% | 6.00 |

## Important

The fixture list in `engine.js` is **practice data**. The maths is real; the matches are not. Real analysis needs a licensed live match feed.

Nothing here predicts outcomes reliably and the site never claims a guaranteed win. Betting carries real financial risk. Adults 18+ only.
