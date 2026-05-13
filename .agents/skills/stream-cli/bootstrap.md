# Bootstrap - `stream` CLI

Read this module when the **`stream` executable** is missing or broken. The CLI gate in [`preflight.md`](preflight.md) is the mandatory first step for tracks A, B, C, and E - never skip the CLI check before scaffold, `stream api`, or SDK wiring. Track D (docs search) does not need the CLI; if the user only wants documentation, route them to Track D instead of installing.

## Install the `stream` CLI

1. **Check** whether `stream` is available: `command -v stream` and `stream --version`. **If both succeed, skip** this install section - just run **`stream auth login`** if the next command fails with auth.
2. If the CLI **is missing or fails**, explain briefly:
   - **What:** The official **Stream CLI** - dashboard auth (PKCE), OpenAPI-driven `stream api`, and `.env` helpers.
   - **Why:** Workflows need it for auth, org/app setup, and API calls.
   - **Provenance:** The installer is published by GetStream. Point the user to **section What the installer does** below if they want to review it before approving.
3. **Ask the user once** for approval to install the CLI.
4. If **yes**, run:
   ```bash
   curl -sSL https://getstream.io/cli/install.sh | bash
   ```
5. If the user **declines**, avoid mutating CLI commands; offer read-only help from **`sdk.md`** where possible.

---

## What the installer does

Share this section with any user (or security reviewer) who wants to know what `curl ... install.sh | bash` actually runs before they approve step 3. Everything below is verifiable against the published script.

### The two URLs

| URL | Contents | Purpose |
|---|---|---|
| `https://getstream.io/cli/install.sh` | ~130-line Bash script (source: GetStream) | Downloads and installs the binary. Shown in full below. |
| `https://getstream.io/cli/latest.json` | JSON: `{ "version": "<semver>", "binaries": { ... } }` | Advertises the current CLI version and per-platform binary names. The installer does **not** read this file - it's a manifest for release tooling and cache busting. |

### What `install.sh` does (in order)

1. **Sets `set -euo pipefail`** - aborts on any error, undefined variable, or broken pipe. No silent failure.
2. **Prints a banner** explaining it installs the terminal binary only, and that the agent skill pack is separate.
3. **Guards the platform** - currently refuses to run unless `uname -s/-m` reports `Darwin/arm64` (macOS Apple Silicon). Any other platform exits immediately with an error.
4. **Prints the install plan** - target path (`/usr/local/bin/stream` by default), warns that `sudo` may be required.
5. **Prompts for interactive confirmation** on a TTY - `Continue? [Y/n]`. Declining exits without touching the system.
6. **Downloads two files** to a `mktemp -d` scratch directory that is removed on exit:
   - `https://getstream.io/cli/releases/<version>/stream-darwin-arm64.bin` - the binary.
   - `https://getstream.io/cli/releases/<version>/stream-darwin-arm64.bin.sha256` - the expected checksum.
7. **Verifies the SHA-256** of the downloaded binary against the `.sha256` file. Mismatch -> hard abort (`die "checksum mismatch"`), nothing is installed.
8. **Installs** the verified binary to `STREAM_INSTALL_BIN_DIR` (default `/usr/local/bin`), using `sudo install` only when writing to `/usr/local/bin` requires it.
9. **Prints follow-up commands** (`stream auth login`, `stream --help`) and an uninstall pointer (`stream uninstall`).

### Properties worth noting for review

- **No postinstall network calls.** Once the binary is in place, `install.sh` exits. It doesn't phone home, doesn't write outside `BIN_DIR` and a tempdir, doesn't touch `~/.ssh`, shell rc files, or environment files.
- **No `.env` access.** The installer never reads or writes any `.env`. `STREAM_API_KEY` / `STREAM_API_SECRET` are populated later, explicitly, by `stream env` inside a project directory.
- **Checksum-gated binary.** The installer refuses to place a binary whose SHA-256 doesn't match the published `.sha256`. MITM'ing the binary without also compromising the `.sha256` endpoint fails closed.
- **TTY confirmation.** Piping from `curl` does not bypass the prompt - the script reads from `/dev/tty` when available.
- **Scoped platform.** A single supported target (macOS Apple Silicon) at time of writing, so behavior is deterministic across users.
- **Environment overrides** (all documented in the script header):
  - `STREAM_INSTALL_BIN_DIR` - alternate install directory.
  - `STREAM_INSTALL_CURL_FLAGS` - extra `curl` flags.
  - `STREAM_PACK_VERSION` - pin a specific version segment.
  - `STREAM_CLI_INSTALL_BASE_URL` - point at a staging CDN / internal mirror.

### For reviewers who want to audit before running

Inspect the script without executing:

```bash
curl -fsSL https://getstream.io/cli/install.sh -o /tmp/stream-install.sh
less /tmp/stream-install.sh    # read it
bash /tmp/stream-install.sh    # run it after reading
```

Or pin to a known version and verify the binary yourself:

```bash
VER=0.1.0
BASE=https://getstream.io/cli/releases/$VER
curl -fsSL "$BASE/stream-darwin-arm64.bin"        -o stream
curl -fsSL "$BASE/stream-darwin-arm64.bin.sha256" -o stream.sha256
shasum -a 256 -c stream.sha256   # must print "OK"
```

If either step fails, **do not** install - report it and we'll investigate.
