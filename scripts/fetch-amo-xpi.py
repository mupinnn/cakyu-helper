#!/usr/bin/env python3
"""Download an already-signed unlisted XPI from addons.mozilla.org.

Exit codes:
  0  wrote the signed XPI
  2  this version exists on AMO but is not signed yet (awaiting review)
  3  this version is not on AMO (caller should submit with web-ext sign)
  1  request / auth / unexpected error
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid

AMO_API = "https://addons.mozilla.org/api/v5"


def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def amo_jwt(api_key: str, api_secret: str) -> str:
    now = int(time.time())
    header = b64url(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    payload = b64url(
        json.dumps(
            {
                "iss": api_key,
                "jti": str(uuid.uuid4()),
                "iat": now,
                "exp": now + 60 * 4,
            }
        ).encode()
    )
    signing_input = f"{header}.{payload}".encode()
    signature = hmac.new(api_secret.encode(), signing_input, hashlib.sha256).digest()
    return f"{header}.{payload}.{b64url(signature)}"


def amo_request(
    url: str,
    token: str,
    *,
    accept: str = "application/json",
) -> tuple[int, object | bytes]:
    request = urllib.request.Request(
        url,
        headers={
            "Authorization": f"JWT {token}",
            "Accept": accept,
            "User-Agent": "cakyu-helper-release",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            body = response.read()
            content_type = response.headers.get("Content-Type", "")
            if "application/json" in content_type:
                return response.status, json.loads(body.decode())
            return response.status, body
    except urllib.error.HTTPError as error:
        body = error.read()
        try:
            parsed = json.loads(body.decode())
        except json.JSONDecodeError:
            parsed = body.decode(errors="replace")
        return error.code, parsed


def addon_url(gecko_id: str, suffix: str = "") -> str:
    encoded_id = urllib.parse.quote(gecko_id, safe="")
    return f"{AMO_API}/addons/addon/{encoded_id}{suffix}"


def file_info_from_version(payload: object) -> dict:
    if not isinstance(payload, dict):
        return {}
    file_info = payload.get("file")
    if isinstance(file_info, dict):
        return file_info
    files = payload.get("files")
    if isinstance(files, list) and files and isinstance(files[0], dict):
        return files[0]
    return {}


def fetch_version(gecko_id: str, version: str, token: str) -> dict | None:
    status, payload = amo_request(
        addon_url(gecko_id, f"/versions/{urllib.parse.quote(version)}/"),
        token,
    )
    if status == 200 and isinstance(payload, dict):
        return payload
    if status not in {404, 401, 403}:
        print(f"AMO version detail returned {status}: {payload}", file=sys.stderr)

    status, payload = amo_request(
        addon_url(
            gecko_id,
            "/versions/?filter=all_with_unlisted&page_size=50",
        ),
        token,
    )
    if status in {401, 403}:
        raise RuntimeError(f"AMO rejected credentials ({status}): {payload}")
    if status == 404 or not isinstance(payload, dict):
        print(f"AMO versions list returned {status}: {payload}", file=sys.stderr)
        return None

    found = []
    url: str | None = None
    while True:
        for item in payload.get("results") or []:
            found.append(str(item.get("version")))
            if str(item.get("version")) == version:
                return item
        url = payload.get("next")
        if not url:
            break
        status, payload = amo_request(url, token)
        if status != 200 or not isinstance(payload, dict):
            break

    print(f"AMO versions visible with all_with_unlisted: {found or '(none)'}")
    return None


def main() -> int:
    api_key = os.environ.get("AMO_API_KEY", "")
    api_secret = os.environ.get("AMO_API_SECRET", "")
    version = os.environ.get("VERSION", "")
    dest = os.environ.get("XPI", "")
    gecko_id = os.environ.get("GECKO_ID", "")

    if not all([api_key, api_secret, version, dest, gecko_id]):
        print(
            "AMO_API_KEY, AMO_API_SECRET, VERSION, XPI, and GECKO_ID are required",
            file=sys.stderr,
        )
        return 1

    token = amo_jwt(api_key, api_secret)
    match = fetch_version(gecko_id, version, token)

    if match is None:
        print(f"AMO has no version {version}; will submit for signing")
        return 3

    file_info = file_info_from_version(match)
    file_url = file_info.get("url")
    signed = bool(file_info.get("is_mozilla_signed_extension"))
    file_status = file_info.get("status")
    channel = match.get("channel")

    if not file_url or not signed:
        print(
            f"AMO version {version} exists (channel={channel!r}, "
            f"file.status={file_status!r}, signed={signed}) but is not "
            "downloadable yet. Wait for approval, then re-run.",
            file=sys.stderr,
        )
        return 2

    print(
        f"Downloading signed XPI for {version} "
        f"(channel={channel}, status={file_status})"
    )
    status, body = amo_request(file_url, token, accept="*/*")
    if status != 200 or not isinstance(body, (bytes, bytearray)):
        print(f"Failed to download signed XPI ({status}): {body}", file=sys.stderr)
        return 1
    if len(body) < 100:
        print(f"Downloaded XPI looks empty ({len(body)} bytes)", file=sys.stderr)
        return 1

    os.makedirs(os.path.dirname(dest) or ".", exist_ok=True)
    with open(dest, "wb") as fh:
        fh.write(body)
    print(f"wrote {dest} ({len(body)} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
