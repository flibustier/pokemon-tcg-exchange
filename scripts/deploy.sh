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

yarn build

cd dist

git add -A
git commit -m $cdate

git push git@github.com:flibustier/pokemon-tcg-exchange.git gh-pages

cd -
