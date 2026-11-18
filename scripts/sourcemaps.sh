#!/usr/bin/env sh

# Sends the source maps of dist/ to Bugsink (https://bug.cracking.ovh), then
# deletes them: they are not published with the site. Run after the build,
# before committing dist/ (deploy.sh does it).
#
# `inject` writes the same debug ID in each script and its map; the Sentry SDK
# sends that ID with an error, and Bugsink uses it to find the map. No release
# to manage.
#
# The token can only upload source maps to the pokemon-tcg project. It comes
# from SENTRY_AUTH_TOKEN if set, otherwise from the macOS Keychain. Without a
# token or sentry-cli, or when Bugsink can't be reached, the script only warns
# and the deploy goes on: errors are still reported, with minified stacks.

set -e

# The maps never reach the site, whatever happens below
trap "find dist -name '*.map' -delete" EXIT

warn() {
  echo "Warning: $1. Source maps not sent to Bugsink: the stacks of new errors will stay minified." >&2
}

cli=./node_modules/.bin/sentry-cli
if [ ! -x "$cli" ]; then
  warn "sentry-cli not found ($cli)"
  exit 0
fi

if [ -z "$SENTRY_AUTH_TOKEN" ]; then
  SENTRY_AUTH_TOKEN=$(security find-generic-password -s claude-bugsink -a pokemon-tcg-upload -w 2>/dev/null) || true
fi
if [ -z "$SENTRY_AUTH_TOKEN" ]; then
  warn "no upload token (SENTRY_AUTH_TOKEN, or claude-bugsink / pokemon-tcg-upload in the macOS Keychain)"
  exit 0
fi

SENTRY_DISABLE_UPDATE_CHECK=1
export SENTRY_AUTH_TOKEN SENTRY_DISABLE_UPDATE_CHECK

# Bugsink has no organisations: --org is required by sentry-cli but ignored
if ! $cli sourcemaps inject dist/assets ||
  ! $cli --url https://bug.cracking.ovh/ sourcemaps --org bugsinkhasnoorgs --project pokemon-tcg upload dist/assets; then
  warn "sending to Bugsink failed (see above)"
fi
