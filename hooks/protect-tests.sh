#!/bin/bash
# protect-tests.sh — PreToolUse hook for Edit/Write/MultiEdit
# Blocks changes that delete or disable tests instead of fixing code.
#
# Install: add to ~/.claude/settings.json under hooks.PreToolUse:
#   { "matcher": "Edit|Write|MultiEdit",
#     "hooks": [{ "type": "command",
#                 "command": "~/.claude/hooks/protect-tests.sh" }] }

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Only check test files
[[ "$FILE_PATH" =~ (test_[^/]*\.py|_test\.py|\.test\.[jt]sx?|\.spec\.[jt]sx?|/tests/|/__tests__/) ]] || exit 0

if [[ "$TOOL_NAME" == "Edit" || "$TOOL_NAME" == "MultiEdit" ]]; then
  OLD=$(echo "$INPUT" | jq -r '.tool_input.old_string // empty')
  NEW=$(echo "$INPUT" | jq -r '.tool_input.new_string // empty')

  # Detect adding skip/xfail decorators where there were none
  SKIP_PATTERN='@pytest\.mark\.(skip|xfail)|@unittest\.skip|\.skip\(|xit\(|xdescribe\(|it\.skip|test\.skip|\.only\('
  if echo "$NEW" | grep -qiE "$SKIP_PATTERN"; then
    if ! echo "$OLD" | grep -qiE "$SKIP_PATTERN"; then
      echo "BLOCKED: Adding skip/xfail to a test. Fix the code that made it fail, don't disable the test."
      exit 2
    fi
  fi

  # Detect removing all assertions from a block
  ASSERT_PATTERN='assert[^i]|expect\(|\.should|\.toBe|\.toEqual|\.toHave|\.toMatch|\.toThrow|\.toContain|assertEqual|assertTrue|assertFalse|assertRaises|assertIn'
  OLD_ASSERTS=$(echo "$OLD" | grep -ciE "$ASSERT_PATTERN" || true)
  NEW_ASSERTS=$(echo "$NEW" | grep -ciE "$ASSERT_PATTERN" || true)
  if [[ $OLD_ASSERTS -gt 1 && $NEW_ASSERTS -eq 0 ]]; then
    echo "BLOCKED: Removing all assertions from test block. Fix the code, don't gut the test."
    exit 2
  fi

  # Detect deleting test functions entirely (replacement is empty or trivially small)
  TEST_FN_PATTERN='def test_|async def test_|it\(|test\(|describe\('
  OLD_FNS=$(echo "$OLD" | grep -ciE "$TEST_FN_PATTERN" || true)
  NEW_FNS=$(echo "$NEW" | grep -ciE "$TEST_FN_PATTERN" || true)
  if [[ $OLD_FNS -ge 2 && $NEW_FNS -eq 0 ]]; then
    echo "BLOCKED: Deleting multiple test functions. If tests are genuinely obsolete, explain why — don't silently remove them."
    exit 2
  fi

  # Detect commenting out assertions
  if echo "$NEW" | grep -qiE '^\s*#\s*(assert|expect|self\.assert)' ; then
    if ! echo "$OLD" | grep -qiE '^\s*#\s*(assert|expect|self\.assert)'; then
      echo "BLOCKED: Commenting out assertions. Fix the code, don't hide the test."
      exit 2
    fi
  fi
fi

if [[ "$TOOL_NAME" == "Write" ]]; then
  CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // empty')

  # For full file writes, check if the file has suspiciously few test functions
  TEST_COUNT=$(echo "$CONTENT" | grep -ciE 'def test_|async def test_|it\(|test\(' || true)
  SKIP_COUNT=$(echo "$CONTENT" | grep -ciE '@pytest\.mark\.(skip|xfail)|@unittest\.skip|\.skip\(' || true)

  if [[ $TEST_COUNT -gt 0 && $SKIP_COUNT -gt 0 ]]; then
    SKIP_RATIO=$((SKIP_COUNT * 100 / TEST_COUNT))
    if [[ $SKIP_RATIO -gt 50 ]]; then
      echo "WARNING: Over 50% of tests in this file are skipped/xfailed ($SKIP_COUNT/$TEST_COUNT). Fix the code, don't mass-skip tests."
      exit 2
    fi
  fi
fi

exit 0
