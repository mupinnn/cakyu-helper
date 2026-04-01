# Cakyu Class Helper

A helpful tools for Cakranians daily classes chores like filling feedback form :)

## Development

This project is built on top of monorepo powered by Turborepo with these packages:

| Package                | Description                                                                                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@cakyu-helper/cli`    | A CLI app to scrape student schedule from SIAKAD (academic information system) by providing their study program, email, and password. The scraped schedules will saved to JSON file. |
| `@cakyu-helper/shared` | Shared things between packages.                                                                                                                                                      |
| `@cakyu-helper/api`    | A Hono app that as an API to provide the scraped schedules. It uses Hono RPC, so it's type-safe.                                                                                     |
| `@cakyu-helper/web`    | A React app that serve the UI and consume `@cakyu-helper/api`. Showing schedules and prefilled link generator for the feedback form.                                                 |

If you're using Nix and `nix-direnv`, just run `direnv allow` and everything will be setup. If not,
make sure Bun at least v1.3.3 in your system.

Next, copy every `.env.example` inside each package to `.env`. For `apps/cli/.env`'s `SIAKAD_URL`, you guys
Cakranians would know the value.

### Commands

#### General commands

| Command         | Description                                                                |
| --------------- | -------------------------------------------------------------------------- |
| `bun run dev`   | Run the development server for `@cakyu-helper/api` and `@cakyu-helper/web` |
| `bun run build` | Build `@cakyu-helper/api` as compiled binary and `@cakyu-helper/web`       |

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

## Contributing

As per now there's no automated way to contribute because of the limitation of our SIAKAD and the current implementation,
if you're really want to add your schedule to represent your class, you can run this project locally, and made a PR of the newly
added schedules file.

I'm still figuring out the safest way for you guys to contribute without saving your credentials which is very vulnerable.
