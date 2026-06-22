#!/usr/bin/env bash
# PostToolUse(Edit|Write|MultiEdit): auto-fix lint on the file just edited.
# Non-blocking — only surfaces UNFIXABLE issues back to Claude as context.

input=$(cat)
f=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')
[ -z "$f" ] && exit 0
[ -f "$f" ] || exit 0

case "$f" in
  *.vue | *.ts | *.js | *.tsx | *.jsx) ;;
  *) exit 0 ;;
esac

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

out=$(npx eslint --fix --max-warnings=0 "$f" 2>&1)
status=$?

if [ "$status" -ne 0 ]; then
  msg=$(printf 'eslint still reports issues in %s after --fix (manual fix needed):\n%s' "$f" "$out")
  jq -cn --arg m "$msg" '{hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:$m}}'
fi
exit 0
