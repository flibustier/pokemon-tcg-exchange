#!/usr/bin/env sh

# Sends the source maps of dist/ to Bugsink (https://bug.cracking.ovh), then deletes them: they are
# not published with the site. Run after the build, before committing dist/ (deploy.sh does it).
#
# `inject` writes the same debug ID in each script and its map; the Sentry SDK sends that ID with
# an error, and Bugsink uses it to find the map. No release to manage.
#
# The token can only upload source maps to the pokemon-tcg project (macOS Keychain).

set -e

SENTRY_AUTH_TOKEN=$(security find-generic-password -s claude-bugsink -a pokemon-tcg-upload -w)
SENTRY_DISABLE_UPDATE_CHECK=1
export SENTRY_AUTH_TOKEN SENTRY_DISABLE_UPDATE_CHECK

cli=./node_modules/.bin/sentry-cli

$cli sourcemaps inject dist/assets
# Bugsink has no organisations: --org is required by sentry-cli but ignored
$cli --url https://bug.cracking.ovh/ sourcemaps --org bugsinkhasnoorgs --project pokemon-tcg upload dist/assets

find dist -name '*.map' -delete
