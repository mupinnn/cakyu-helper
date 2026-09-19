# Cakyu Class Helper

A helpful tools for Cakranians daily classes chores like filling feedback form :)

## Development

This project is built on top of monorepo powered by Turborepo with these packages:

| Package                    | Description                                                                                                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@cakyu-helper/cli`        | A CLI app to scrape student schedule from SIAKAD (academic information system) by providing their study program, email, and password. The scraped schedules will saved to JSON file. |
| `@cakyu-helper/shared`     | Shared things between packages.                                                                                                                                                      |
| `@cakyu-helper/api`        | A Hono app that as an API to provide the scraped schedules. It uses Hono RPC, so it's type-safe.                                                                                     |
| `@cakyu-helper/web`        | Landing page, install notes, and hosted default Google Form mapping.                                                                                                                 |
| `@cakyu-helper/extension`  | Chromium/Brave extension: injects **Isi Feedback** on RISE session cards and prefills the lecture Google Form. Students can remap fields themselves.                                 |

If you're using Nix and `nix-direnv`, just run `direnv allow` and everything will be setup. If not,
make sure Bun at least v1.3.3 in your system.

Next, copy every `.env.example` inside each package to `.env`. For `apps/cli/.env`'s `SIAKAD_URL`, you guys
Cakranians would know the value.

### Commands

#### General commands

| Command         | Description                                                                |
| --------------- | -------------------------------------------------------------------------- |
| `bun run dev`   | Run the development server for `@cakyu-helper/api` and `@cakyu-helper/web` |
| `bun run build` | Build `@cakyu-helper/api`, `@cakyu-helper/web`, and `@cakyu-helper/extension` |

#### `@cakyu-helper/extension`

See [`apps/extension/README.md`](apps/extension/README.md). Load unpacked from `apps/extension/dist` in Chrome or Brave. The SIAKAD scraper is frozen; live class data now comes from RISE in the student’s browser.

#### `@cakyu-helper/web` commands

Run these commands inside `apps/web` directory or using Bun workspace filter feature from the root.

| Command       | Description                             |
| ------------- | --------------------------------------- |
| `bun ui:add`  | Add component from `shadcn/ui` registry |
| `bun lint`    | Run ESLint                              |
| `bun preview` | Run server to preview build result      |

#### `@cakyu-helper/cli` commands

Run these commands inside `apps/web` directory or using Bun workspace filter feature from the root.

| Command               | Description                                                                                                      |
| --------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `bun fetch:schedules` | Scrape schedule by providing study program and your credentials to login to SIAKAD (academic information system) |

## Deployment

Production deploys run through [parachute](https://github.com/mupinnn/parachute). Pushes to `main` (including merged schedule-update PRs) trigger GitHub Actions to build and push images to GHCR, then notify the parachute daemon over Tailscale.

The app is served at `https://cakyu-helper.13121957.xyz`. Only the `web` container is publicly routed; nginx proxies `/api/` to the internal API service.

### GitHub secrets

| Secret | Purpose |
| --- | --- |
| `PARACHUTE_URL` | Tailnet URL of the parachute daemon (e.g. `http://100.x.y.z:8787`) |
| `PARACHUTE_DEPLOY_TOKEN` | Bearer token matching `deploy_token` in parachute config |
| `TS_OAUTH_CLIENT_ID` | Tailscale OAuth client ID for ephemeral CI tailnet join |
| `TS_OAUTH_SECRET` | Tailscale OAuth secret |

These replace the old `SERVER_*`, `ENV_WEB`, and `ENV_API` secrets.

### Server setup (one-time)

Set the API CORS origin on the parachute host:

```bash
parachute secret set cakyu-helper CORS_ORIGIN='https://cakyu-helper.13121957.xyz'
```

### Cutover from the old SCP deploy

After the first successful parachute deploy:

1. Verify the site and `/api/schedules` work at `https://cakyu-helper.13121957.xyz`.
2. Tear down the old stack: `cd ~/deploy/cakyu-helper && docker compose -f docker-compose.prod.yml down`
3. Remove or disable any host-level reverse proxy that conflicts with Traefik on `:80`/`:443`.
4. Remove obsolete GitHub secrets (`SERVER_HOST`, `SERVER_USERNAME`, `SERVER_KEY`, `ENV_WEB`, `ENV_API`).

## Contributing

As per now there's no automated way to contribute because of the limitation of our SIAKAD and the current implementation,
if you're really want to add your schedule to represent your class, you can run this project locally, and made a PR of the newly
added schedules file.

I'm still figuring out the safest way for you guys to contribute without saving your credentials which is very vulnerable.
