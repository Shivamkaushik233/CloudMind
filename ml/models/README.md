# Model artifacts

Per-environment model versions are recorded in SQL and stored under MODEL_STORE using generated IDs. XGBoost uses JSON; neural weights use NPZ with allow_pickle=False; Q-learning uses JSON. Keep the database and model volume backed up together. SageMaker source is in ml/Dockerfile and ml/sagemaker_train.py; scripts/launch_training.py prints a request unless --submit is explicitly given.
