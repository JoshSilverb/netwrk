#!/bin/bash

# Check if the user provided the number of loops as a command-line argument
if [ $# -ne 1 ]; then
    echo "Usage: $0 <num_loops>"
    exit 1
fi

# Get the number of loops from the command-line argument
num_loops=$1


# Loop 'num_loops' times
for ((i=1; i<=$num_loops; i++)); do
    # Generate random username and password
    username=$i
    password=$i

    # Make the curl request with the generated username and password
    curl -X POST -H "Content-Type: application/json" --data "{\"username\":\"$username\",\"password\":\"$password\"}" http://localhost:8000/user/new/

    echo "Loop iteration $i: Username=$username, Password=$password"
done