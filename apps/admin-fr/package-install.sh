#!/bin/sh

PASS=""

# parse arguments
while [ "$#" -gt 0 ]; do
  case "$1" in
    --pass|-p)
      if [ -z "$2" ]; then
        echo "Error: missing value for $1"
        exit 1
      fi
      PASS="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1, use --pass or -p"
      exit 1
      ;;
  esac
done

# run your command
echo "Entering Sudo mode for installing NPM packages........ 🟢🟢🟢"
echo "1. Installing PM2 ⚙️" 
echo "$PASS" | sudo -S npm i -g pm2 && echo "Installation Status ✅" || echo "Installation Status ❌"
echo "2. Installing serve ⚙️"
echo "$PASS" | sudo -S npm i -g serve && echo "Installation Status ✅" || echo "Installation Status ❌"
