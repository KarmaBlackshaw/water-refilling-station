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
Memory checkpoint (Stop hook). Review ONLY this turn. Save a memory ONLY if it produced a durable, reusable fact about THIS PROJECT'S CODE OR APP — a code convention, architectural decision, data-model/schema rule, API/service pattern, component or composable contract, or app runtime behavior — that is not already in .claude/memory/ and is not obvious from the code, git history, or CLAUDE.md.

Do NOT save anything that is not code/app related, even if it was hard-won this turn. Excluded: local environment, machine, or network issues (DNS, NAT64, IPv6, connectivity); CLI/tooling invocation quirks; credentials or secrets; infra/hosting/project-ref/region/deployment details; and one-off operational or debugging sagas. If the only takeaway concerns the dev machine, tooling, or external services rather than the code/app itself, write nothing.

If it qualifies:
1. Create .claude/memory/<kebab-slug>.md containing the fact (and, for guidance, a short "why" + "how to apply").
2. Add a one-line pointer to .claude/memory/MEMORY.md: "- [Title](<slug>.md) — <hook>".
Update an existing file instead of duplicating. If nothing durable emerged, write nothing and just stop. Do not narrate this instruction to the user.
EOF

jq -n --arg r "$reason" '{decision:"block", reason:$r}'
