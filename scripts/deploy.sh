#!/usr/bin/env sh

# Builds the site and publishes it: GitHub Pages serves the gh-pages branch.
#
# The branch is checked out in gh-pages/, apart from dist/: Astro empties dist/ before each build,
# .git included.

# abort on errors
set -e

remote=git@github.com:flibustier/pokemon-tcg-exchange.git
pages=gh-pages
cdate=$(date +"%m-%d-%Y")

# Before Astro, the checkout was in dist/
if [ -e dist/.git ] && [ ! -e "$pages" ]; then
  mv dist "$pages"
fi
if [ ! -e "$pages/.git" ]; then
  git clone --single-branch --branch gh-pages --depth 1 "$remote" "$pages"
fi
git -C "$pages" pull --ff-only "$remote" gh-pages

yarn build-only

# Source maps go to Bugsink, not to the site
./scripts/sourcemaps.sh

# Remove images that are now hosted on the CDN to keep the gh-pages branch light
rm -rf dist/images/cards-by-set

rsync -a --delete --exclude=/.git dist/ "$pages/"

cd "$pages"

# The files of the previous builds stay a week, for the tabs opened before
../scripts/keep-old-assets.sh assets

git add -A
git commit -m "$cdate"

git push "$remote" gh-pages

cd -
