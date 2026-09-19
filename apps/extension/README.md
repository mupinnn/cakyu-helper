# Cakyu Helper extension

Chromium/Brave extension that injects **Isi Feedback** on RISE session cards and prefills the lecture Google Form.

## Install (Load unpacked)

1. Build from the repo root:

```bash
nix develop -c bun install
nix develop -c bun run --filter @cakyu-helper/extension build
```

2. Open `brave://extensions` or `chrome://extensions`
3. Enable **Developer mode**
4. **Load unpacked** → select `apps/extension/dist`

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
