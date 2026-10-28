# ACME Platform CRM

Static CRM site for the ACME Platform demo. Search a customer by **customer id, mobile number (mobile_no, mobile_no2 or the telecom line number) or email**
and see the customer 360: profile, plan, usage, latest bill, offers, outages, cases and the interaction timeline
(AI Agent, human agent, app). A gear icon opens **Settings** where the vertical is selected (Telecom for now).

This folder is a git repo (remote: GitHub `WxCCDemo/ACME-Platform`, renamed from `ACME-Telecom`) and is published with GitHub Pages.
The same repo also hosts the NovaPay payment page and the branding assets.

_Last updated: 2026-10-28_

## Layout

| Path | What |
|---|---|
| `index.html` | Landing page linking to the CRM and NovaPay |
| `crm/` | The CRM (`index.html`, `app.js`, `style.css`, `config.js`) |
| `novapay/` | NovaPay payment page (copy of `../NovaPay/page/index.html`; source and docs in `../NovaPay`) |
| `assets/` | ACME Telecom logo and the agent-desktop empty-state image |

Live address once Pages is on: `https://wxccdemo.github.io/ACME-Platform/crm/`

## How it reaches the data

```
Browser (this site)  --Bearer crm_key-->  Edge Function crm-api  -->  platform.api_call  -->  telecom handlers
```

* The page holds **no secret**. `crm-api` (source: `../MCP/crm-api/index.ts`) is read-only: it can only run `lookup_customer`,
  `customer_360`, `list_cases` and `list_interactions`, whatever the caller sends.
* Access is a **CRM key** (starts `crm_`, stored hashed in `platform.api_clients` as `crm-telecom`, bound to the `telecom` vertical).
  The key itself is in `../MCP/tokens.env` (private, not in this repo).
* The search is exact match only: no listing or browsing of customers.
* No login screen by design (the demo runs from any internet connection). Revoke or rotate the key if the link leaks (see "Rotate the key").

## Phone numbers shown

**Primary** = the customer's telecom number (the line). **Secondary** = any other number on the customer record (`mobile_no`, `mobile_no2`) that differs from it. Search matches all of them.

## Search box

One box, the service decides what you typed:

| You type | Treated as |
|---|---|
| contains `@` | email |
| starts with `+`, or 8 or more digits | mobile number (matches mobile_no, mobile_no2 or the line number, any format) |
| anything else numeric | customer id |

## Screen pop from the WxCC Agent Desktop

Open the CRM with the customer already searched:

```
https://wxccdemo.github.io/ACME-Platform/crm/?q=<customer id | mobile | email>#key=<CRM key>
```

* Also accepted: `?customer=<id>`, `?mobile=<no>`, `?email=<addr>`, and `&vertical=telecom`.
* The part after `#` is never sent to a server. The page saves the key in this browser and removes it from the address bar, so later screen pops
  can leave `#key=...` out on the same browser.
* Prefer the **customer id** in the link rather than phone or email, so no personal details sit in a URL.
* In a Desktop layout the page can be shown in a custom-page widget or opened in a new tab (a new tab is the safer choice until the widget is tested).

## Settings (gear icon)

* **Vertical**: lists the verticals in `crm/config.js`. Only Telecom exists. A new vertical = a new entry in `config.js`, plus its handlers on the platform.
* **CRM key**: kept only in this browser (localStorage). "Forget key" removes it.

## Publish

1. In **GitHub Desktop**: File > Add Local Repository > this `CRM` folder. Review the changes, commit, **Push origin**.
2. Rename the GitHub repo to `ACME-Platform` (Settings > Repository name). The old address redirects. If GitHub Desktop still shows the old name, Repository > Repository settings > update the remote URL to `https://github.com/WxCCDemo/ACME-Platform.git`.
3. Turn on Pages: Settings > Pages > Deploy from a branch > `main` / root. The repo is public so Pages is free.

## Test without publishing

Open `crm/index.html` straight from the folder in a browser (works from `file://`), open Settings, paste the key, search `1`, `2` or an email.
Customers 1 to 10 exist. Customer 2 (Shailesh Chourasia) has an open network case and an outage in the area, a good one to show.

## Rotate the key

In the Supabase SQL editor (ACME Platform project):

```sql
update platform.api_clients set key_hash = encode(sha256(convert_to('crm_NEWRANDOMVALUE','UTF8')),'hex') where name = 'crm-telecom';
```

Then put the new key in `../MCP/tokens.env` and in the screen-pop link in the WxCC flow.

## Status

| Item | State |
|---|---|
| CRM search + customer 360 + settings + screen-pop parameters | Built, API tested live, page tested locally with the real response shape |
| `crm-api` edge function (v1) | Deployed; tested: id, email and mobile search, wrong key (401), wrong vertical (403), unknown customer |
| GitHub rename, push, Pages | For you to do (steps above) |
| NovaPay page | Built, see `../NovaPay/README.md`; the hosted copy is `novapay/index.html`, published in the same push |

## Notes

* Written read-only on purpose. Case creation and updates stay with the AI Agent / AI Assistant through the MCP server.
* The CRM shows `churn risk` and similar fields because it is the human-agent view; the customer-facing AI Agent tools do not return them.
