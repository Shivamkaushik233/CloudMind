FROM python:3.12-slim
WORKDIR /opt/program
COPY backend/core-api/requirements-ml.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/core-api/app ./app
COPY ml/sagemaker_train.py ./train.py
ENTRYPOINT ["python", "train.py"]
