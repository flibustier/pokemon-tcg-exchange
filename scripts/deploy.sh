#!/usr/bin/env sh

# First time before you deploy, you need to manually init the gh-pages branch

# yarn build
# cd dist
# git init
# git switch -c gh-pages

# then you can launch this script

# abort on errors
set -e

cdate=$(date +"%m-%d-%Y")

yarn build-only

cd dist

# Remove images that are now hosted on the CDN to keep the gh-pages branch light
rm -rf images/cards-by-set

git add -A
git commit -m $cdate

git push git@github.com:flibustier/pokemon-tcg-exchange.git gh-pages

cd -
