# Qasr Al Mabrook - AI-Assisted Development Protocol

## 1. Purpose

This project may be developed using multiple AI-assisted tools, including Cursor, Codex, Copilot, Lovable, Kiro or similar tools.

No single tool should be the source of project knowledge.

The repository documentation is the source of truth.

## 2. Required Reading Before Coding

An agent should read:

1. `docs/product.md`
2. `docs/tech.md`
3. `docs/architecture.md`
4. `docs/patterns.md`
5. Relevant `specs/.../requirements.md`
6. Relevant `specs/.../design.md`
7. `specs/.../tasks.md`
8. `docs/project-state.md`

Then inspect the actual code.

## 3. Before Changing Architecture

If a requested implementation conflicts with:

- Database design
- Technology decisions
- Security requirements
- Established patterns

the agent must stop and explain the conflict before silently changing architecture.

## 4. Task Execution

Work on the smallest logical task.

For each task:

1. Understand acceptance criteria.
2. Identify affected files.
3. Implement.
4. Test.
5. Review for regressions.
6. Update task status.
7. Update project state.

## 5. Completion Criteria

A task is complete only when:

- Code exists.
- Acceptance criteria are satisfied.
- Relevant tests/checks pass.
- No known blocking issue remains.

## 6. Documentation Updates

When implementation changes an architectural decision, update the appropriate document.

Do not leave important decisions only in chat.

## 7. Session Resume

At the beginning of a new session:

1. Read project state.
2. Identify last completed task.
3. Identify current in-progress task.
4. Inspect code changes.
5. Continue from the documented next step.

## 8. AI Behavior Rules

Agents must:

- Avoid unnecessary rewrites.
- Avoid changing the stack without approval.
- Avoid introducing unnecessary dependencies.
- Avoid fake placeholder backend behavior.
- Avoid claiming work is complete without verification.
- Preserve existing functionality.
- Prefer secure server-side implementation.
- Preserve responsive/RTL/accessibility requirements.

## 9. Human Approval Required

Require explicit human approval before:

- Changing database architecture.
- Changing authentication architecture.
- Adding major infrastructure.
- Introducing a paid third-party service.
- Adding pricing/payment functionality.
- Changing public URL structure.
- Changing the approved technology stack.
