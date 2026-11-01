# Forecasting

Ridge is in `backend/core-api/app/intelligence.py`. XGBoost, LSTM and Transformer training/prediction are in `app/advanced_ml.py`. Install requirements-ml.txt. Train through the UI or POST /operations/{id}/models/train. Models use chronological holdout evaluation and require 90 minutes of telemetry. Synthetic results do not establish production accuracy.
