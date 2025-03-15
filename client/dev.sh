#!/bin/bash

# Start Vite server
npx vite --port=8008 &
vite_pid=$!

# Watch files with nodemon and run bun command on change
npx nodemon --watch src/lib/compiler/clientComponents/**/*.vue -e .vue --exec 'bun compileBuiltIns.ts' &
nodemon_pid=$!

# Kill both processes when the script is terminated
trap "kill $vite_pid $nodemon_pid" EXIT

# Wait for both processes to finish
wait $vite_pid
wait $nodemon_pid