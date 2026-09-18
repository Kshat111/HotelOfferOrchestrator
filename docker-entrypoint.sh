#!/bin/sh
set -eu

case "${RUN_MODE:-api}" in
  api)
    exec node dist/index.js
    ;;
  worker)
    exec node dist/worker.js
    ;;
  *)
    echo "Unsupported RUN_MODE: ${RUN_MODE}" >&2
    exit 1
    ;;
esac
