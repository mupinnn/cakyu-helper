# Cakyu's SIAKAD Schedule to Google Calendar

Scrape all per semesters schedule from SIAKAD and add it to Google Calendar. Right now, this project is meant to
be run locally.

## Stacks

- Hono
- Puppeteer
- React
- TypeScript
- Google Calendar API

## Running locally

- Copy `.env.example` to `.env.local`
- Get your Google Calendar ID and set it into `.env.local`
- Prepare your Google Service Account, and save the file in `/api/credentials.json`
- Invite your service account email to your calendar
- Run `bun dev` and `bun dev:server`

## TODO

- [ ] Rate limit issue when bulk create
- [ ] Refactor and restructure

## What to improve

- Able to be used widely for other students. In other words, deployed.
  - Research how to use user's own credentials: email/pass or Google auth that the SIAKAD provided.
