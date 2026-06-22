#!/usr/bin/env bash
# SessionStart hook (this repo only).
# Injects this repo's memory index into context every new chat.
# Per-fact .md files live alongside MEMORY.md and are read on demand.
set -euo pipefail

INDEX="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}/.claude/memory/MEMORY.md"
[ -f "$INDEX" ] || exit 0

body=$(cat "$INDEX")
[ -z "$body" ] && exit 0

jq -n --arg c "Repo memory (.claude/memory/ — read linked files when relevant):

$body" '{hookSpecificOutput:{hookEventName:"SessionStart",additionalContext:$c}}'
