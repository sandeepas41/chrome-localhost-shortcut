# Localhost Shortcut

Chrome extension for quick access to localhost URLs via keyboard shortcuts.

## Why?

When developing locally, you end up with a bunch of localhost URLs across different ports — admin panels, frontends, APIs, docs. Switching between them means typing `localhost:XXXX` in the address bar every time. This extension gives you a single keyboard shortcut to open any of them instantly.

It gets worse with **git worktrees**. Each worktree runs on its own port, so `admin` might be on `:25000`, `:25001`, `:25002` depending on the branch. That's a lot of URLs to manage. So we added **URL grouping** — group related URLs under a parent, and they appear in a side preview panel without cluttering the main list.

## Usage

1. Press `Cmd+Shift+L` (Mac) or `Ctrl+Shift+L` (Windows/Linux)
2. Press a number key `1-9` to open that URL in a new tab
3. Or use arrow keys / `j`/`k` to navigate, `Enter` to open

### Keyboard Shortcuts

| Key | Action |
|---|---|
| `1-9` | Open URL by number |
| `j` / `k` / `↑` / `↓` | Navigate list |
| `Enter` | Open selected URL |
| `→` | Enter group children (preview panel) |
| `←` / `Esc` | Back to main list |
| `a` / `+` | Add new URL |
| `c` | Add child URL to selected item |
| `e` | Edit selected URL |
| `d` / `Backspace` | Delete selected URL |
| `Esc` | Close popup |

### URL Grouping

Any URL can become a group. Press `c` to add a child URL. When you focus a group, its children appear in a preview panel to the right. Press `→` to navigate into the children, `Enter` to open one.

Useful for worktree setups where the same service runs on multiple ports.

## Install

1. Clone this repo
2. Open `chrome://extensions/` in Chrome
3. Enable **Developer mode**
4. Click **Load unpacked** and select this directory

To customize the shortcut: `chrome://extensions/shortcuts`

## Storage

URLs are stored in `chrome.storage.sync` and sync across your Chrome devices.
