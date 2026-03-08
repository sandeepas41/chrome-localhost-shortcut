# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chrome extension (Manifest V3) for quick access to localhost URLs via keyboard shortcuts.

**Trigger:** `Cmd+Shift+L` (Mac) / `Ctrl+Shift+L` (Windows/Linux) opens a popup with numbered URL list.

## Architecture

- `manifest.json` - Extension config, permissions (tabs, storage), command definitions
- `background.js` - Service worker that opens popup on keyboard shortcut
- `popup.html` - Popup UI structure
- `popup.js` - URL list management, keyboard navigation, storage operations
- `popup.css` - Dark theme styling

## User Flow

1. Press `Cmd+Shift+L` → popup appears
2. Press number key `1-9` → opens corresponding URL in new tab
3. Or use arrow keys / `j`/`k` to navigate, `Enter` to open
4. Press `a` or `+` to add new URL
5. Press `e` to edit selected URL
6. Press `d` or `Backspace` to delete

## Storage

URLs are stored in `chrome.storage.sync` and sync across devices. Default URL: `http://localhost:10000/login`

## Development

1. Open `chrome://extensions/` in Chrome
2. Enable "Developer mode"
3. Click "Load unpacked" and select this directory
4. After code changes, click the refresh icon on the extension card

To customize the global shortcut: `chrome://extensions/shortcuts`
