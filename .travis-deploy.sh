#!/bin/sh
set -e

# setup ssh-agent and provide the GitHub deploy key
eval "$(ssh-agent -s)"
#openssl aes-256-cbc -K $encrypted_fb17a912150b_key -iv $encrypted_fb17a912150b_iv -in ed25519.enc -out ed25519 -d
chmod 600 ed25519
ssh-add ed25519

# commit the assets in build/ to the gh-pages branch and push to GitHub using SSH
./node_modules/.bin/gh-pages -d dist/ -b gh-pages -r git@github.com:${TRAVIS_REPO_SLUG}.git

