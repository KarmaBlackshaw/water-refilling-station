#!/usr/bin/env bash
# Injects this repo's memory index (.claude/memory/MEMORY.md) into context.
# Used by SessionStart (once per chat) and UserPromptSubmit (every prompt).
# Per-fact .md files live alongside MEMORY.md and are read on demand.
# Arg $1 = hook event name (default: UserPromptSubmit).
set -euo pipefail

EVENT="${1:-UserPromptSubmit}"
INDEX="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}/.claude/memory/MEMORY.md"
[ -f "$INDEX" ] || exit 0

body=$(cat "$INDEX")
[ -z "$body" ] && exit 0

jq -n --arg e "$EVENT" --arg c "Repo memory (.claude/memory/ — read linked files when relevant):

$body" '{hookSpecificOutput:{hookEventName:$e,additionalContext:$c}}'
