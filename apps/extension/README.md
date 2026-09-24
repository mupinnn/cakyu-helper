# Cakyu Helper extension

Chromium/Brave and Firefox extension that injects **Isi Feedback** on RISE session cards and prefills the lecture Google Form.

## Install

Download the latest release from [cakyu-helper.13121957.xyz](https://cakyu-helper.13121957.xyz) (or [GitHub Releases](https://github.com/mupinnn/cakyu-helper/releases)). Optionally verify the checksum:

```bash
sha256sum -c SHA256SUMS
```

### Chrome / Brave

1. Unzip the archive
2. Open `brave://extensions` or `chrome://extensions`
3. Enable **Developer mode**
4. **Load unpacked** → select the extracted folder (`cakyu-helper-vX.Y.Z`)

### Firefox

Firefox 140+ is required. Firefox unloads unsigned add-ons on restart. Use the Mozilla-signed `.xpi` from the release:

1. Download `cakyu-helper-vX.Y.Z.xpi`
2. Open `about:addons`
3. Gear menu → **Install Add-on From File…**
4. Select the `.xpi` and allow the installation

Signed builds auto-update from GitHub Releases via `firefox-updates.json`.

## Install from source

1. Build from the repo root:

```bash
nix develop -c bun install
nix develop -c bun run --filter @cakyu-helper/extension build
```

2. Chrome/Brave: open `brave://extensions` or `chrome://extensions`, enable **Developer mode**, **Load unpacked** → select `apps/extension/dist`

3. Firefox (temporary, gone after restart):

```bash
nix develop -c bun run --filter @cakyu-helper/extension firefox
```

Or open `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on** → select `apps/extension/dist/manifest.json`.

## Usage

1. Open a class session page on [RISE](https://rise.cakrawala.ac.id)
2. On a pertemuan card, click **Isi Feedback** (next to Isi Presensi)
3. Fill ratings; student identity is saved in the browser
4. Google Form opens with mapped fields prefilled

If the campus publishes a new form, paste the URL in the extension popup. Open the form, use **Map form** → **Auto-map** or click a question to bind it, then **Simpan**.

## Default mapping

Bundled from `src/shared/default-mapping.json` (Odd 2026/2027 Lectures Feedback Form). The same file is served at `/mappings/default.json` on the website. Regenerate from a form dump with:

```bash
nix develop -c bun run --filter @cakyu-helper/extension generate:mapping
```

## Firefox signing (maintainers)

Releases sign an **unlisted** XPI on [addons.mozilla.org](https://addons.mozilla.org/developers/). One-time setup:

1. Create a Firefox Add-on Developer account
2. Generate API credentials (JWT issuer + secret)
3. Add GitHub secrets `AMO_API_KEY` and `AMO_API_SECRET`

The gecko id `cakyu-helper@13121957.xyz` is frozen after the first sign. Do not change it.

If a release job times out on “Waiting for approval”, wait until the version is approved in the AMO dashboard, then re-run the Release workflow with that same version. Do not submit a new version just to get the Chrome zip out — GitHub never got a `v1.2.0` release, but AMO already has `1.2.0`.
