#!/usr/bin/env bash
# PostToolUse(Edit|Write|MultiEdit): warn on axi forbidden patterns in the edited
# file (see .claude-memory/rules-cheatsheet.md). Non-blocking — emits a context
# note so the convention violation is caught deterministically, not from memory.

input=$(cat)
f=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')
[ -z "$f" ] && exit 0
[ -f "$f" ] || exit 0

case "$f" in
  *.vue | *.ts | *.js | *.tsx | *.jsx) ;;
  *) exit 0 ;;
esac

warns=""
add() { warns="${warns}- $1\n"; }

grep -nE 'from "@/constants/' "$f" >/dev/null 2>&1 && add "deep @/constants subpath import — use the @/constants barrel"
grep -nE 'from "@/utils/constants/' "$f" >/dev/null 2>&1 && add "old @/utils/constants path — move the type into @/constants"
grep -nE ':[[:space:]]*any\b|as any\b' "$f" >/dev/null 2>&1 && add "any type — use a precise type, a generic, or unknown + narrowing"
grep -nE 'ref<.*\|[[:space:]]*null>\(null\)' "$f" >/dev/null 2>&1 && add "ref<T | null>(null) — use ref<T>() instead"
grep -nE '^[[:space:]]*// ' "$f" >/dev/null 2>&1 && add "// line comment — use /** ... */ JSDoc"
grep -nE '#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?\b' "$f" >/dev/null 2>&1 && add "raw hex color — use a Tailwind design token (tailwind-color-token skill)"
[ "$(grep -cE 'from "@/constants"' "$f")" -gt 1 ] && add "multiple @/constants imports — merge into one statement with inline type"

if [ -n "$warns" ]; then
  msg=$(printf 'axi convention check on %s:\n%b' "$f" "$warns")
  jq -cn --arg m "$msg" '{hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:$m}}'
fi
exit 0
