#!/bin/bash

# Script to copy Windows build to /mnt/g/WSL/win/inhibit-windows-events

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WINDOWS_DIR="/mnt/g/WSL/win/inhibit-windows-events"
TARGET_DIR="$PROJECT_ROOT/src-tauri/target/x86_64-pc-windows-gnu"
BUILD_TYPE="${1:-release}"  # Default to release, can pass 'debug' as first argument

echo -e "${BLUE}=== Copying Windows Build to G: Drive ===${NC}"

# Validate build type
if [[ "$BUILD_TYPE" != "release" && "$BUILD_TYPE" != "debug" ]]; then
    echo -e "${RED}Error: Build type must be 'release' or 'debug'${NC}"
    exit 1
fi

# Check if build exists
EXE_PATH="$TARGET_DIR/$BUILD_TYPE/inhibit-windows-events.exe"
if [[ ! -f "$EXE_PATH" ]]; then
    echo -e "${RED}Error: Windows executable not found at $EXE_PATH${NC}"
    echo -e "${YELLOW}Run: pnpm tauri build --target x86_64-pc-windows-gnu${NC}"
    exit 1
fi

# Check if destination directory is accessible
if [[ ! -d "/mnt/g" ]]; then
    echo -e "${RED}Error: /mnt/g is not mounted. Make sure G: drive is accessible from WSL2${NC}"
    exit 1
fi

# Create destination directory
echo -e "${BLUE}Creating destination directory...${NC}"
mkdir -p "$WINDOWS_DIR"

# Copy executable
echo -e "${BLUE}Copying executable ($BUILD_TYPE build)...${NC}"
cp "$EXE_PATH" "$WINDOWS_DIR/"
echo -e "${GREEN}✓ Copied: inhibit-windows-events.exe${NC}"

# Copy frontend assets (dist folder)
if [[ -d "$PROJECT_ROOT/dist" ]]; then
    echo -e "${BLUE}Copying frontend assets...${NC}"
    cp -r "$PROJECT_ROOT/dist" "$WINDOWS_DIR/"
    echo -e "${GREEN}✓ Copied: dist/ folder${NC}"
else
    echo -e "${YELLOW}Warning: dist/ folder not found. Frontend assets not copied.${NC}"
fi

# Copy any additional files if needed
ADDITIONAL_FILES=(
    "README.md"
    "package.json"
    "src-tauri/tauri.conf.json"
)

echo -e "${BLUE}Copying additional files...${NC}"
for file in "${ADDITIONAL_FILES[@]}"; do
    if [[ -f "$PROJECT_ROOT/$file" ]]; then
        # Create subdirectories if needed
        mkdir -p "$WINDOWS_DIR/$(dirname "$file")"
        cp "$PROJECT_ROOT/$file" "$WINDOWS_DIR/$file"
        echo -e "${GREEN}✓ Copied: $file${NC}"
    fi
done

# Show file info
echo -e "${BLUE}Build information:${NC}"
ls -lh "$EXE_PATH"
echo -e "${BLUE}Destination:${NC} $WINDOWS_DIR"

# Show Windows path equivalent
WINDOWS_PATH="G:\\WSL\\win\\inhibit-windows-events\\inhibit-windows-events.exe"
echo -e "${GREEN}Windows executable path:${NC} $WINDOWS_PATH"

echo -e "${GREEN}=== Copy completed successfully! ===${NC}"
echo -e "${YELLOW}You can now run the executable on Windows: $WINDOWS_PATH${NC}"