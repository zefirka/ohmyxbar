#!/bin/bash

NODE=$(which node)
PWD="$(dirname "$0")/cli.js"
$($NODE $PWD $1)
