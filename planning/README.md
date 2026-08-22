# Planning board

Lightweight, file-based project board. One project, epics, tasks — plain JSON validated against the schemas in `schemas/`.

## Layout

- `schemas/common.schema.json` — shared defs (ids, priority, status enums, timestamps). Referenced by the other three, not used standalone.
- `schemas/project.schema.json`, `schemas/epic.schema.json`, `schemas/task.schema.json` — one schema per entity.
- `data/project.json` — a single Project object.
- `data/epics.json` — array of Epic objects.
- `data/tasks.json` — array of Task objects, each pointing at its `epic_id`.

Tasks reference their epic (`epic_id`); epics don't list their tasks back — one direction of truth, so a task moving between epics is a one-line edit, not two.

## IDs

`EPIC-<n>` / `TASK-<n>`, sequential, never reused even if a ticket is dropped. Project id is a slug (`hockey-analytics-dashboard`).

## Workflow

Both epics and tasks share one status lifecycle: `backlog` → `todo` → `in_progress` → `blocked` → `done`. A `blocked` epic/task should carry a `blocked_reason` explaining what it's waiting on.

## Editing

There's no app reading this yet — it's edited directly as JSON (by hand or by Claude) and is the source of truth for "what's next," replacing ad-hoc backlog notes in `docs/PLANNING.md`. Validate after editing (schema validation plus a referential-integrity check — task `epic_id` exists, epic `project_id` matches — that JSON Schema alone can't express):

```
pip install jsonschema referencing --break-system-packages   # once
python3 planning/validate.py
```
