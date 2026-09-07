def register_and_login(client, email="dev@cloudmind.io", role="DEVELOPER"):
    client.post(
        "/auth/register",
        json={
            "email": email,
            "full_name": "Dev User",
            "password": "sup3rsecret",
            "role": role,
        },
    )
    resp = client.post(
        "/auth/login",
        data={"username": email, "password": "sup3rsecret"},
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_register_and_login(client):
    headers = register_and_login(client)
    resp = client.get("/auth/me", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "dev@cloudmind.io"


def test_duplicate_registration_rejected(client):
    register_and_login(client)
    resp = client.post(
        "/auth/register",
        json={
            "email": "dev@cloudmind.io",
            "full_name": "Dev User",
            "password": "whatever",
            "role": "DEVELOPER",
        },
    )
    assert resp.status_code == 400


def test_wrong_password_rejected(client):
    register_and_login(client)
    resp = client.post(
        "/auth/login", data={"username": "dev@cloudmind.io", "password": "nope"}
    )
    assert resp.status_code == 401


def test_full_resource_hierarchy(client):
    headers = register_and_login(client)

    # Project
    resp = client.post(
        "/projects", json={"name": "CloudMind", "description": "AI autoscaler"}, headers=headers
    )
    assert resp.status_code == 201
    project_id = resp.json()["id"]

    # Application
    resp = client.post(
        f"/projects/{project_id}/applications",
        json={"name": "checkout-service", "repo_url": "https://github.com/x/checkout"},
        headers=headers,
    )
    assert resp.status_code == 201
    app_id = resp.json()["id"]

    # Environment (no cluster yet)
    resp = client.post(
        f"/applications/{app_id}/environments",
        json={"name": "production"},
        headers=headers,
    )
    assert resp.status_code == 201
    env_id = resp.json()["id"]

    # Deployment
    resp = client.post(
        f"/environments/{env_id}/deployments",
        json={"version": "v1.8.2"},
        headers=headers,
    )
    assert resp.status_code == 201
    deployment_id = resp.json()["id"]
    assert resp.json()["status"] == "PENDING"

    # Update deployment status
    resp = client.patch(
        f"/deployments/{deployment_id}",
        json={"status": "SUCCESS"},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "SUCCESS"

    # List deployments, newest first
    resp = client.get(f"/environments/{env_id}/deployments", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_project_isolation_between_users(client):
    headers_a = register_and_login(client, email="a@cloudmind.io")
    headers_b = register_and_login(client, email="b@cloudmind.io")

    resp = client.post("/projects", json={"name": "A's project"}, headers=headers_a)
    project_id = resp.json()["id"]

    # user B cannot see or access user A's project
    resp = client.get("/projects", headers=headers_b)
    assert resp.json() == []

    resp = client.get(f"/projects/{project_id}", headers=headers_b)
    assert resp.status_code == 403


def test_cluster_creation_requires_admin_or_devops(client):
    dev_headers = register_and_login(client, email="dev2@cloudmind.io", role="DEVELOPER")
    resp = client.post(
        "/clusters",
        json={"name": "prod-eks", "provider": "aws", "region": "us-east-1"},
        headers=dev_headers,
    )
    assert resp.status_code == 403

    admin_headers = register_and_login(client, email="admin@cloudmind.io", role="ADMIN")
    resp = client.post(
        "/clusters",
        json={"name": "prod-eks", "provider": "aws", "region": "us-east-1"},
        headers=admin_headers,
    )
    assert resp.status_code == 201
