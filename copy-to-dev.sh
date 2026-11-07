#!/bin/bash

rsync -arv --delete --no-o --no-g --no-perms site/ root@dev:/root/firebase/site
