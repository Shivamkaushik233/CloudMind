"""SageMaker container training entry point using the same evaluated local models."""
import json
import os
import shutil
from datetime import datetime
from pathlib import Path
from types import SimpleNamespace
from app.advanced_ml import train

def main():
    input_dir=Path(os.environ.get("SM_CHANNEL_TRAINING","/opt/ml/input/data/training"))
    rows=[]
    for path in sorted(input_dir.glob("*.jsonl")):
        for line in path.read_text().splitlines():
            record=json.loads(line)
            rows.append(SimpleNamespace(timestamp=datetime.fromisoformat(record["timestamp"].replace("Z","+00:00")).replace(tzinfo=None),rps=float(record["rps"])))
    params_path=Path("/opt/ml/input/config/hyperparameters.json")
    params=json.loads(params_path.read_text()) if params_path.exists() else {}
    output=Path(os.environ.get("SM_MODEL_DIR","/opt/ml/model"));output.mkdir(parents=True,exist_ok=True)
    artifact=output/"artifact"
    report=train(rows,params.get("algorithm","xgboost"),artifact,int(params.get("epochs",30)))
    print(json.dumps(report))
if __name__=="__main__":main()
