#!/bin/bash

NODE=$(which node)

CLI_JS="$(dirname "$0")/cli.js"

if test -f "$CLI_JS"; then
    $NODE $CLI_JS $1
else
    CLI_JS="$(dirname "$0")/ohmyxbar-js"
    $CLI_JS $1
fi
