#!/bin/sh

SCRIPT=""
BUILD_STATUS=0

# parse arguments
while [ "$#" -gt 0 ]; do
  case "$1" in
    --script|-sc)
      if [ -z "$2" ]; then
        echo "Error: missing value for $1"
        exit 1
      fi
      SCRIPT="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1, use --script or -sc"
      exit 1
      ;;
  esac
done

# validate
if [ -z "$SCRIPT" ]; then
  echo "Error: --script | -sc is required"
  exit 1
fi

# load env file
echo "Installing NPM packages........ 🟢🟢🟢"
npm i && echo "Installation Status ✅" || echo "Installation Status ❌"
echo "Making directory for storing old build........"
mkdir -p old-dist && echo "Created old build directory ✅" || echo "Cannot create old build directory ❌" 
echo "Copying files to old build directory........"
cp -r "dist" "old-dist" && echo "Files copied successfully ✅" || echo "Failed to copy files ❌"
echo "Delete dist directory........"
rm -rf dist && echo "Dist directory deleted successfully ✅" || echo "Failed to delete dist directory ❌"
echo "Building packages using npm run $SCRIPT........ 🟢🟢🟢"
npm run "$SCRIPT" && BUILD_STATUS=1 || BUILD_STATUS=0

if [ $BUILD_STATUS -eq 1 ]; then
    echo "Build Status ✅"
    echo "Deleting old build........"
    rm -rf "old-dist" && echo "Old Dist directory deleted successfully ✅" || echo "Failed to delete old dist directory ❌"
else
    echo "Build Status ❌"

    echo "Reverting old build........"
    mkdir -p "dist" && echo "Created dist directory ✅" || echo "Cannot create dist directory ❌" 
    if cp -r "old-dist" "dist"; then
        echo "Files restored successfully ✅"
        echo "Deleting old build........"
        rm -rf "old-dist" && echo "Old Dist directory deleted successfully ✅" || echo "Failed to delete old dist directory ❌"
    else
        echo "Failed to restore files ❌"
    fi
fi