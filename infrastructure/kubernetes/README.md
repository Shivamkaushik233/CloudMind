# Kubernetes

Use ../helm/cloudmind for the current deployment, including persistent model storage. The historical cloudmind.yml is a minimal smoke-test manifest, not the full installation. See ../terraform/README.md for AWS setup. scripts/kubernetes_scale.py and scripts/controller.py default to server-side dry-run; --apply enables writes. --spot-deployment maps a second pool, with nodeSelector capacity=spot and primary capacity=on-demand. Both pools must represent the same application workload and use the total replicas in telemetry. Partial write failures require reconciliation.
