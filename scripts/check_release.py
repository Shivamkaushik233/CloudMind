"""Validate a source ZIP before delivery, without extracting or executing it."""
import argparse
import ast
import json
from pathlib import Path, PurePosixPath
from zipfile import ZipFile


def check(path):
    with ZipFile(path) as archive:
        if archive.testzip():raise ValueError("ZIP integrity failure")
        names=archive.namelist()
        if len(names)!=len(set(names)):raise ValueError("Duplicate ZIP entries")
        blocked={".git",".venv","node_modules",".next",".secrets",".terraform","model-artifacts",".e2e","test-results"}
        for name in names:
            parts=PurePosixPath(name).parts
            if not parts or parts[0]!="CloudMind" or ".." in parts or blocked.intersection(parts):raise ValueError("Unexpected archive path: "+name)
            leaf=parts[-1]
            if leaf.startswith(".env") and leaf!=".env.example":raise ValueError("Private environment file")
            if name.endswith((".db",".tfstate",".pyc",".zip")):raise ValueError("Runtime artifact: "+name)
            content=archive.read(name)
            if name.endswith(".py"):ast.parse(content.decode("utf-8"),filename=name)
            if name.endswith(".json"):json.loads(content)
            if name.endswith(".sh") and b"\r" in content:raise ValueError("Shell script must use LF endings")
        required=["README.md","docs/VALIDATION.md","backend/core-api/entrypoint.sh","backend/core-api/requirements-ml.txt","frontend/package-lock.json","frontend/e2e/workflow.spec.ts","infrastructure/helm/cloudmind/Chart.yaml"]
        for name in required:
            if "CloudMind/"+name not in names:raise ValueError("Missing "+name)
        print(json.dumps({"archive":str(path),"files":len(names),"integrity":"passed","source_syntax":"passed","runtime_files_excluded":True}))

if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument("archive",type=Path);check(parser.parse_args().archive)
