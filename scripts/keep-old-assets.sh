#!/usr/bin/env sh

# Keeps the files of the previous builds online for a week after a deploy.
#
# Their names change with their content, so each build replaces the files of
# the one before. A tab opened before a deploy still needs them for the pages
# it has not shown yet, and so does a page whose HTML is still in the cache
# (GitHub Pages lets browsers keep it 10 minutes): without them, the page does
# not open, or stays blank.
#
# Run it in the gh-pages checkout, after the build, before `git add`:
#   keep-old-assets.sh <folder of the built files> [previous deploy, HEAD by default]
# The files kept are listed in old-assets.txt, each with the time (in seconds)
# it left the build.

set -e

folder=$1
previous=${2:-HEAD}
list=old-assets.txt
days=7

# first deploy: nothing to keep
git rev-parse -q --verify "$previous^{commit}" >/dev/null || exit 0

now=$(date +%s)
{
  # the files kept by the deploys before
  git show "$previous:$list" 2>/dev/null || true
  # the files of the previous deploy: those that this build does not have
  # leave it now
  git ls-tree -r --name-only "$previous" -- "$folder" | sed "s/^/$now /"
} |
  # each file once, with the time it left, if it was less than a week ago
  awk -v since=$((now - days * 86400)) '
    !($2 in left) || $1 < left[$2] { left[$2] = $1 }
    END { for (file in left) if (left[file] >= since) print left[file], file }
  ' |
  while read -r time file; do
    # a file built again is not an old one
    if [ ! -e "$file" ] && git cat-file -e "$previous:$file" 2>/dev/null; then
      echo "$time $file"
    fi
  done |
  sort -k2 >"$list"

if [ -s "$list" ]; then
  cut -d' ' -f2- "$list" | xargs git checkout "$previous" --
  echo "Kept $(wc -l <"$list" | tr -d ' ') files of the previous builds (see $list)"
else
  rm "$list"
fi
