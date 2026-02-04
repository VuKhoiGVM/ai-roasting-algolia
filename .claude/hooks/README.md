# Claude Code Hooks - Scout Block

This directory contains the **Scout Block Hook** for Claude Code. This hook automatically blocks access to heavy directories to improve performance when using the `/scout` command.

## Overview

The Scout Block Hook prevents Claude Code from wasting time scanning large, unnecessary directories like `node_modules`, `.git`, build outputs, and cache folders.

| Hook | File | Type | Description |
|------|------|------|-------------|
| **Scout Block** | `scout-block.js` | Automated | Cross-platform hook blocking heavy directories (node_modules, .git, etc.) |

### Cross-Platform Support

The Scout Block Hook supports both Windows and Unix systems:

- **Windows**: Uses PowerShell (`scout-block.ps1`)
- **Linux/macOS/WSL**: Uses Bash (`scout-block.sh`)
- **Automatic detection**: `scout-block.js` dispatcher selects the correct implementation

No manual configuration needed - the Node.js dispatcher handles platform detection automatically.

## Setup

### Configuration

The hook is configured in `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "pattern": {
          "toolName": "Bash",
          "tool_input": {
            "command": "*scout*"
          }
        },
        "hooks": [
          {
            "type": "command",
            "command": "node ${CLAUDE_PROJECT_DIR}/.claude/hooks/scout-block.js"
          }
        ]
      }
    ]
  }
}
```

### Blocked Patterns

The hook blocks access to these directories:

- `node_modules/` - NPM dependencies
- `__pycache__/` - Python cache
- `.git/` - Git internal files
- `dist/` - Distribution builds
- `build/` - Build artifacts
- `.next/` - Next.js build output
- `.turbo/` - Turbopack cache
- `coverage/` - Test coverage reports
- `.env*` - Environment files (security)

### Requirements

- **Node.js >=18.0.0** (already required by this project)

## Usage

The hook runs automatically when you use the `/scout` command. No manual invocation is needed.

### Testing

**Linux/macOS/WSL:**
```bash
# Test that node_modules is blocked
echo '{"tool_input":{"command":"ls node_modules"}}' | node .claude/hooks/scout-block.js
# Should exit with code 2 and error message
```

**Windows PowerShell:**
```powershell
# Test that node_modules is blocked
echo '{"tool_input":{"command":"ls node_modules"}}' | node .claude\hooks\scout-block.js
# Should exit with code 2 and error message
```

## How It Works

1. When `/scout` command is executed, the PreToolUse hook triggers
2. `scout-block.js` dispatches to the appropriate platform script
3. The script parses the scout command to extract target directories
4. Checks if blocked patterns are present in the command
5. If blocked pattern found:
   - Returns error message explaining which directory is blocked
   - Exits with code 2 to prevent the scout command from running
6. If no blocked patterns found:
   - Exits with code 0 to allow the scout command to proceed

## Troubleshooting

### "Node.js not found"
- Install Node.js >=18.0.0 from [nodejs.org](https://nodejs.org)
- Verify installation: `node --version`

### Hook not blocking directories
- Verify `.claude/settings.json` has the correct hook configuration
- Check that the hook uses `node .claude/hooks/scout-block.js`
- Test manually with the test commands above

### Windows PowerShell execution policy errors
- Run: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`
- The dispatcher includes `-ExecutionPolicy Bypass` flag as fallback

### Scout still scans blocked directories
- Ensure the pattern match in settings.json includes `*scout*`
- Check that CLAUDE_PROJECT_DIR environment variable is set correctly

## Files

| File | Purpose |
|------|---------|
| `scout-block.js` | Node.js dispatcher - detects platform and runs appropriate script |
| `scout-block.sh` | Bash implementation for Unix systems (Linux/macOS/WSL) |
| `scout-block.ps1` | PowerShell implementation for Windows |
| `README.md` | This documentation file |

## Additional Resources

- [Claude Code Documentation](https://docs.claude.com/claude-code)
- [Claude Code Hooks Reference](https://docs.claude.com/claude-code/hooks)

---

**Last Updated:** 2025-01-30
