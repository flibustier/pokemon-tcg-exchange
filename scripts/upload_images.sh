#!/usr/bin/env sh

# Abort on errors
set -e

SOURCE_DIR="public/images/cards-by-set/"
REMOTE_HOST="nyx"
REMOTE_PATH="/srv/cdn/dracaufeu/images/cards-by-set/"
DESTINATION="$REMOTE_HOST:$REMOTE_PATH"

echo "Ensuring remote directory exists..."
ssh "$REMOTE_HOST" "mkdir -p $REMOTE_PATH"

echo "Syncing images from $SOURCE_DIR to $DESTINATION..."

# Using rsync directly for better performance and reliability.
# -a: archive mode (preserves permissions, symlinks, etc.)
# -v: verbose
# -z: compress during transfer
# --progress: show progress
rsync -avz --progress "$SOURCE_DIR" "$DESTINATION"

echo "Upload complete!"
