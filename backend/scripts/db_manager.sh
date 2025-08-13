#!/bin/bash
# netwrkdb

# Path to database file
# UPLOAD_FOLDER=var/uploads

# Stop on errors
set -Eeuxo pipefail

# Sanity check command line options
usage() {
echo "Usage: $0 (create|destroy|reset|dump)"
}

if [ $# -ne 1 ]; then
usage
exit 1
fi

# Parse command line options
case $1 in
"empty")
    if psql -lqt | grep netwrk; then
    echo "Error: database already exists"
    exit 1
    fi
    createdb --echo netwrk
    psql --echo-errors -d netwrk -f sql/schema.sql
    # mkdir -p ${UPLOAD_FOLDER}
    ;;

"create")
    $0 empty
    psql --echo-errors -d netwrk -f sql/data.sql
    # psql -d netwrk -a -f sql/
    # python3 netwrkapp/populate_db.py
    # cp sql/uploads/* ${UPLOAD_FOLDER}/
    ;;

"destroy")
    dropdb --echo netwrk
    # rm -rf ${UPLOAD_FOLDER}
    ;;

"reset")
    $0 destroy
    $0 create
    ;;

"dump")
    TABLES=`psql -d netwrk -c '\x' -c '\dt' | grep Name | awk '{print $3}'`
    for TABLE in ${TABLES}; do
    psql -d netwrk -c "\x" -c "SELECT * FROM ${TABLE}"
    echo
    done
    ;;

"random")
    SHUF=shuf
    # If shuf is not on this machine, try to use gshuf instead
    if ! type shuf 2> /dev/null; then
    SHUF=gshuf
    fi
    DB_FILENAME=var/netwrk.sqlite3
    FILENAMES="122a7d27ca1d7420a1072f695d9290fad4501a41.jpg
            ad7790405c539894d25ab8dcf0b79eed3341e109.jpg
            9887e06812ef434d291e4936417d125cd594b38a.jpg
            2ec7cf8ae158b3b1f40065abfb33e81143707842.jpg"
    for i in `seq 1 100`; do
    # echo $FILENAMES      print string
    # shuf -n1             select one random line from multiline input
    # awk '{$1=$1;print}'  trim leading and trailing whitespace

    # Use '${SHUF}' instead of 'shuf'
    FILENAME=`echo "$FILENAMES" | ${SHUF} -n1 | awk '{$1=$1;print}'`
    OWNER="awdeorio"
    psql -d netwrk -c "INSERT INTO posts(filename, owner) VALUES('${FILENAME}','${OWNER}');"
    done
    ;;

*)
    usage
    exit 1
    ;;
esac