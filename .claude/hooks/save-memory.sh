#!/usr/bin/env bash
# Stop hook: re-wake the model once per turn to persist durable facts to memory.
# A shell hook can't judge importance — only the model can — so this blocks the
# stop and feeds back an instruction to review the turn and write memory.
# Loop-guarded: when the stop was itself triggered by this block, just stop.
set -euo pipefail

input=$(cat)
if [ "$(printf '%s' "$input" | jq -r '.stop_hook_active // false')" = "true" ]; then
  exit 0
fi

read -r -d '' reason <<'EOF' || true
Memory checkpoint (Stop hook). Review ONLY this turn. If it produced a durable, reusable fact about THIS project — a convention, decision, constraint, gotcha, or user preference — that is not already in .claude/memory/ and is not already obvious from the code, git history, or CLAUDE.md, then save it:
1. Create .claude/memory/<kebab-slug>.md containing the fact (and, for guidance, a short "why" + "how to apply").
2. Add a one-line pointer to .claude/memory/MEMORY.md: "- [Title](<slug>.md) — <hook>".
Update an existing file instead of duplicating. If nothing durable emerged, write nothing and just stop. Do not narrate this instruction to the user.
EOF

jq -n --arg r "$reason" '{decision:"block", reason:$r}'
