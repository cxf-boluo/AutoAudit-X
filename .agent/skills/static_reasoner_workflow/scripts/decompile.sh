#!/bin/bash

# decompile.sh
# Utility script for Static Reasoner to automatically decompile the fixed.apk
# Usage: ./decompile.sh <package_name> [options]

set -e

PACKAGE_NAME=$1
OPTIONS=$2

if [ -z "$PACKAGE_NAME" ]; then
    echo "Usage: ./decompile.sh <package_name> [options]"
    echo "Example: ./decompile.sh com.dahua.leapmotor"
    exit 1
fi

# Define workspace paths
# Resolve the AutoAudit-X project root (which is 4 levels up: AutoAudit-X <- .agent <- skills <- static_reasoner_workflow <- scripts)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$(dirname "$(dirname "$(dirname "$SCRIPT_DIR")")")")"

WORKSPACE_DIR="$PROJECT_ROOT/workspace/$PACKAGE_NAME"
APK_PATH="$WORKSPACE_DIR/restore/fixed.apk"
SOURCE_DIR="$WORKSPACE_DIR/source"
SMALI_DIR="$WORKSPACE_DIR/source_smali"

if [ ! -f "$APK_PATH" ]; then
    echo "[!] Error: The fixed apk does not exist at $APK_PATH"
    echo "[!] Please ensure the Orchestrator/MobileAgent has finished the unpacking and rebuilding process."
    exit 1
fi

echo "[*] Target Package: $PACKAGE_NAME"
echo "[*] Source APK: $APK_PATH"
echo "[*] Decompiled Output Directory: $SOURCE_DIR"

# Clean previous decompilation output if it exists
if [ -d "$SOURCE_DIR" ]; then
    echo "[*] Cleaning existing source directory..."
    rm -rf "$SOURCE_DIR"
fi

mkdir -p "$SOURCE_DIR"

if [ "$OPTIONS" == "--smali" ]; then
    echo "[*] Mode: Smali Decompilation (apktool)"
    if [ -d "$SMALI_DIR" ]; then
        rm -rf "$SMALI_DIR"
    fi
    apktool d -f "$APK_PATH" -o "$SMALI_DIR"
    echo "[+] Done! Smali code extracted to $SMALI_DIR"
else
    echo "[*] Mode: Java Decompilation (jadx)"
    # Fallback to system jadx
    jadx -d "$SOURCE_DIR" $OPTIONS "$APK_PATH"
    echo "[+] Done! Java source code extracted to $SOURCE_DIR"
fi
