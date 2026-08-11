#!/bin/sh

ENV_FILE=""

# parse arguments
while [ "$#" -gt 0 ]; do
  case "$1" in
    --env-file|-ef)
      if [ -z "$2" ]; then
        echo "Error: missing value for $1"
        exit 1
      fi
      ENV_FILE="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1, use --env-file or -ef"
      exit 1
      ;;
  esac
done

# validate
if [ -z "$ENV_FILE" ]; then
  echo "Error: --env-file | -ef is required"
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: env file '$ENV_FILE' not found"
  exit 1
fi

# load env file
set -a
. "$ENV_FILE"
set +a

# run your command
echo "Starting server on port $PORT serving $PUBLIC_DIR"
serve -s "$PUBLIC_DIR" -l "$PORT"
