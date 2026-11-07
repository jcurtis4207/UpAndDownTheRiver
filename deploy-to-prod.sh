#!/bin/bash
set -e

# disable emulation
jq '.runInEmulator = false' site/firebase-config.json > config.tmp
mv config.tmp site/firebase-config.json

# deploy on firebase
firebase deploy --only hosting
