#!/usr/bin/env python3
"""Validate planning/data/*.json against planning/schemas/*.json. Dev tool, not app code."""
import json
import sys
from pathlib import Path

from jsonschema import Draft202012Validator
from referencing import Registry, Resource

HERE = Path(__file__).parent
SCHEMAS = HERE / "schemas"
DATA = HERE / "data"


def load(path):
    return json.loads(path.read_text())


def build_registry():
    resources = []
    for schema_path in SCHEMAS.glob("*.json"):
        schema = load(schema_path)
        resources.append((schema["$id"], Resource.from_contents(schema)))
    return Registry().with_resources(resources)


def validate_one(schema_name, data, registry, label):
    schema = load(SCHEMAS / schema_name)
    validator = Draft202012Validator(schema, registry=registry)
    items = data if isinstance(data, list) else [data]
    errors = []
    for i, item in enumerate(items):
        for err in validator.iter_errors(item):
            errors.append(f"{label}[{i}]: {err.message} (path: {list(err.path)})")
    return errors


def check_references(project, epics, tasks):
    # Schema validation can't see across files — catch dangling foreign keys here.
    errors = []
    epic_ids = {e["id"] for e in epics}
    for e in epics:
        if e["project_id"] != project["id"]:
            errors.append(f"epic {e['id']}: project_id {e['project_id']!r} != {project['id']!r}")
    for t in tasks:
        if t["epic_id"] not in epic_ids:
            errors.append(f"task {t['id']}: epic_id {t['epic_id']!r} does not exist")
    return errors


def main():
    registry = build_registry()
    checks = [
        ("project.schema.json", DATA / "project.json", "project"),
        ("epic.schema.json", DATA / "epics.json", "epics"),
        ("task.schema.json", DATA / "tasks.json", "tasks"),
    ]
    all_errors = []
    for schema_name, data_path, label in checks:
        data = load(data_path)
        errors = validate_one(schema_name, data, registry, label)
        all_errors.extend(errors)
        print(f"{label}: {'OK' if not errors else f'{len(errors)} error(s)'}")

    ref_errors = check_references(
        load(DATA / "project.json"), load(DATA / "epics.json"), load(DATA / "tasks.json")
    )
    all_errors.extend(ref_errors)
    print(f"references: {'OK' if not ref_errors else f'{len(ref_errors)} error(s)'}")

    if all_errors:
        print("\n".join(all_errors))
        sys.exit(1)
    print("All planning data valid.")


if __name__ == "__main__":
    main()
