#!/bin/bash
#
# run_netwrk
#
# Clean, build and start server


# Stop on errors, print commands
# See https://vaneyckt.io/posts/safer_bash_scripts_with_set_euxo_pipefail/
set -Eeuo pipefail
set -x

# Make sure database exists
if ! psql -lqt | grep -q netwrk; then
  ./bin/db_manager create
fi

# Stuff to run Flask server
export FLASK_ENV=development
FLASK_ENV=development
export FLASK_APP=netwrkapp
FLASK_APP=netwrkapp
flask run --host 0.0.0.0 --port 8000 --debug

