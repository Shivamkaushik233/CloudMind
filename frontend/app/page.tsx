"use client";

import { useEffect, useState } from "react";

const API_URL = "https://cloudmind-87ph.onrender.com";

type Project = {
  id: string;
  name: string;
  description?: string | null;
};

type Application = {
  id: string;
  name: string;
  project_id: string;
  repository_url?: string | null;
};

type Environment = {
  id: string;
  name: string;
  application_id: string;
  cluster_id?: string | null;
};

type Cluster = {
  id: string;
  name: string;
  provider?: string | null;
  region?: string | null;
};

type Deployment = {
  id: string;
  version: string;
  status: string;
  environment_id: string;
};

type User = {
  id?: string;
  email?: string;
  username?: string;
  full_name?: string;
};

export default function Home() {
  const [active, setActive] = useState("Dashboard");

  const [projects, setProjects] = useState<Project[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);

  const [apiStatus, setApiStatus] = useState("Checking...");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [token, setToken] = useState("");
  const [user, setUser] = useState<User | null>(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    const savedToken = localStorage.getItem("cloudmind_token");

    if (savedToken) {
      setToken(savedToken);
      loadCurrentUser(savedToken);
      loadCloudMindData(savedToken);
    } else {
      checkAPI();
    }
  }, []);

  /* =========================
     API HEALTH
  ========================= */

  const checkAPI = async () => {
    setApiStatus("Checking...");

    try {
      const response = await fetch(`${API_URL}/health`);

      if (response.ok) {
        setApiStatus("Online");
      } else {
        setApiStatus("Error");
      }
    } catch {
      setApiStatus("Offline");
    }
  };

  /* =========================
     API REQUEST
  ========================= */

  const apiRequest = async (
    endpoint: string,
    authToken?: string
  ) => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const response = await fetch(
      `${API_URL}${endpoint}`,
      {
        method: "GET",
        headers,
      }
    );

    if (response.status === 401) {
      throw new Error("AUTH_REQUIRED");
    }

    if (!response.ok) {
      const text = await response.text();

      throw new Error(
        text || `API request failed: ${response.status}`
      );
    }

    return response.json();
  };

  /* =========================
     LOGIN
  ========================= */

  const login = async () => {
    if (!loginEmail || !loginPassword) {
      setLoginError(
        "Please enter your email and password."
      );
      return;
    }

    setLoginLoading(true);
    setLoginError("");

    try {
      const formData = new URLSearchParams();

      formData.append("username", loginEmail);
      formData.append("password", loginPassword);

      const response = await fetch(
        `${API_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
        }
      );

      if (!response.ok) {
        const text = await response.text();

        throw new Error(
          text || "Incorrect email or password."
        );
      }

      const data = await response.json();

      if (!data.access_token) {
        throw new Error(
          "No access token received from server."
        );
      }

      localStorage.setItem(
        "cloudmind_token",
        data.access_token
      );

      setToken(data.access_token);

      await loadCurrentUser(data.access_token);
      await loadCloudMindData(data.access_token);
    } catch (err) {
      setLoginError(
        err instanceof Error
          ? err.message
          : "Login failed."
      );
    } finally {
      setLoginLoading(false);
    }
  };

  /* =========================
     USER
  ========================= */

  const loadCurrentUser = async (
    authToken: string
  ) => {
    try {
      const data = await apiRequest(
        "/auth/me",
        authToken
      );

      setUser(data);
    } catch {
      // Ignore user loading errors.
    }
  };

  /* =========================
     PROJECTS
  ========================= */

  const loadProjects = async (
    authToken: string
  ) => {
    const data = await apiRequest(
      "/projects",
      authToken
    );

    const result = Array.isArray(data) ? data : [];

    setProjects(result);

    return result;
  };

  /* =========================
     CLUSTERS
  ========================= */

  const loadClusters = async (
    authToken: string
  ) => {
    const data = await apiRequest(
      "/clusters",
      authToken
    );

    const result = Array.isArray(data) ? data : [];

    setClusters(result);

    return result;
  };

  /* =========================
     APPLICATIONS
  ========================= */

  const loadApplicationsForProject = async (
    projectId: string,
    authToken: string
  ) => {
    const data = await apiRequest(
      `/projects/${projectId}/applications`,
      authToken
    );

    return Array.isArray(data) ? data : [];
  };

  /* =========================
     ENVIRONMENTS
  ========================= */

  const loadEnvironmentsForApplication = async (
    applicationId: string,
    authToken: string
  ) => {
    const data = await apiRequest(
      `/applications/${applicationId}/environments`,
      authToken
    );

    return Array.isArray(data) ? data : [];
  };

  /* =========================
     DEPLOYMENTS
  ========================= */

  const loadDeploymentsForEnvironment = async (
    environmentId: string,
    authToken: string
  ) => {
    const data = await apiRequest(
      `/environments/${environmentId}/deployments`,
      authToken
    );

    return Array.isArray(data) ? data : [];
  };

  /* =========================
     LOAD ALL DATA
  ========================= */

  const loadCloudMindData = async (
    authToken: string
  ) => {
    setLoading(true);
    setError("");

    try {
      const loadedProjects =
        await loadProjects(authToken);

      await loadClusters(authToken);

      const allApplications: Application[] = [];
      const allEnvironments: Environment[] = [];
      const allDeployments: Deployment[] = [];

      for (const project of loadedProjects) {
        try {
          const apps =
            await loadApplicationsForProject(
              project.id,
              authToken
            );

          allApplications.push(...apps);
        } catch {
          // Continue.
        }
      }

      for (const application of allApplications) {
        try {
          const envs =
            await loadEnvironmentsForApplication(
              application.id,
              authToken
            );

          allEnvironments.push(...envs);
        } catch {
          // Continue.
        }
      }

      for (const environment of allEnvironments) {
        try {
          const deps =
            await loadDeploymentsForEnvironment(
              environment.id,
              authToken
            );

          allDeployments.push(...deps);
        } catch {
          // Continue.
        }
      }

      setApplications(allApplications);
      setEnvironments(allEnvironments);
      setDeployments(allDeployments);

      setApiStatus("Online");
    } catch (err) {
      if (
        err instanceof Error &&
        err.message === "AUTH_REQUIRED"
      ) {
        logout();
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load CloudMind data."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     LOGOUT
  ========================= */

  const logout = () => {
    localStorage.removeItem("cloudmind_token");

    setToken("");
    setUser(null);

    setProjects([]);
    setApplications([]);
    setEnvironments([]);
    setClusters([]);
    setDeployments([]);

    setActive("Dashboard");
  };

  /* =========================
     HELPERS
  ========================= */

  const getProjectName = (
    projectId: string
  ) => {
    return (
      projects.find(
        (project) => project.id === projectId
      )?.name || projectId
    );
  };

  const getApplicationName = (
    applicationId: string
  ) => {
    return (
      applications.find(
        (application) =>
          application.id === applicationId
      )?.name || applicationId
    );
  };

  const getEnvironmentName = (
    environmentId: string
  ) => {
    return (
      environments.find(
        (environment) =>
          environment.id === environmentId
      )?.name || environmentId
    );
  };

  const getStatusClass = (
    status: string
  ) => {
    switch (status.toUpperCase()) {
      case "SUCCESS":
        return "status status-success";

      case "RUNNING":
        return "status status-running";

      case "PENDING":
        return "status status-pending";

      case "FAILED":
        return "status status-failed";

      default:
        return "status";
    }
  };

  /* =========================
     LOGIN SCREEN
  ========================= */

  if (!token) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">
            Cloud<span>Mind</span>
          </div>

          <p className="login-subtitle">
            Cloud Management System
          </p>

          <h2>Sign in</h2>

          <div className="form-group">
            <label>Email</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={loginEmail}
              onChange={(e) =>
                setLoginEmail(e.target.value)
              }
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              placeholder="Enter your password"
              value={loginPassword}
              onChange={(e) =>
                setLoginPassword(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  login();
                }
              }}
            />
          </div>

          {loginError && (
            <div className="error-message">
              {loginError}
            </div>
          )}

          <button
            className="login-button"
            onClick={login}
            disabled={loginLoading}
          >
            {loginLoading
              ? "Signing in..."
              : "Sign in"}
          </button>

          <div className="connection-status">
            <span
              className={
                apiStatus === "Online"
                  ? "online-dot"
                  : "offline-dot"
              }
            >
              ●
            </span>

            Backend{" "}
            {apiStatus === "Online"
              ? "connected"
              : "checking connection..."}
          </div>
        </div>
      </div>
    );
  }

  /* =========================
     DASHBOARD
  ========================= */

  return (
    <div className="dashboard">
      <header className="header">
        <div className="logo">
          Cloud<span>Mind</span>
        </div>

        <div className="header-right">
          <div className="system-status">
            <span className="online-dot">
              ●
            </span>

            System Online
          </div>

          <div className="user-name">
            {user?.full_name ||
              user?.email ||
              "User"}
          </div>

          <button
            className="logout-button"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-title">
            CloudMind
          </div>

          {[
            "Dashboard",
            "Projects",
            "Applications",
            "Environments",
            "Clusters",
            "Deployments",
          ].map((item) => (
            <div
              key={item}
              className={`nav-item ${
                active === item
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setActive(item)
              }
            >
              {item}
            </div>
          ))}

          <div className="sidebar-footer">
            <div className="connection-label">
              Backend
            </div>

            <div className="backend-connected">
              <span className="online-dot">
                ●
              </span>

              Connected
            </div>
          </div>
        </aside>

        <main className="main">
          <div className="page-heading">
            <div>
              <h1 className="page-title">
                {active}
              </h1>

              <p className="page-subtitle">
                CloudMind Cloud Management System
              </p>
            </div>

            <button
              className="refresh-button"
              onClick={() =>
                loadCloudMindData(token)
              }
              disabled={loading}
            >
              {loading
                ? "Refreshing..."
                : "Refresh"}
            </button>
          </div>

          {error && (
            <div className="error-banner">
              <strong>API Error:</strong>{" "}
              {error}
            </div>
          )}

          {/* =========================
              DASHBOARD
          ========================= */}

          {active === "Dashboard" && (
            <>
              <div className="welcome-box">
                <div>
                  <h2>
                    Welcome to CloudMind
                  </h2>

                  <p>
                    Manage your cloud
                    infrastructure from one
                    place.
                  </p>
                </div>

                <div className="system-online">
                  <span className="online-dot">
                    ●
                  </span>

                  Backend Connected
                </div>
              </div>

              <div className="cards">
                <div className="card">
                  <div className="card-label">
                    Projects
                  </div>

                  <div className="card-value">
                    {projects.length}
                  </div>

                  <div className="card-description">
                    Active projects
                  </div>
                </div>

                <div className="card">
                  <div className="card-label">
                    Applications
                  </div>

                  <div className="card-value">
                    {applications.length}
                  </div>

                  <div className="card-description">
                    Registered applications
                  </div>
                </div>

                <div className="card">
                  <div className="card-label">
                    Environments
                  </div>

                  <div className="card-value">
                    {environments.length}
                  </div>

                  <div className="card-description">
                    Configured environments
                  </div>
                </div>

                <div className="card">
                  <div className="card-label">
                    Deployments
                  </div>

                  <div className="card-value">
                    {deployments.length}
                  </div>

                  <div className="card-description">
                    Total deployments
                  </div>
                </div>
              </div>

              <section className="section">
                <div className="section-header">
                  <div>
                    <h2 className="section-title">
                      Recent Deployments
                    </h2>

                    <p className="section-description">
                      Latest application
                      deployments
                    </p>
                  </div>
                </div>

                {deployments.length === 0 ? (
                  <div className="empty-state">
                    No deployments found.
                  </div>
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>
                          Application
                        </th>
                        <th>
                          Environment
                        </th>
                        <th>
                          Version
                        </th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {deployments
                        .slice(0, 10)
                        .map(
                          (deployment) => {
                            const environment =
                              environments.find(
                                (item) =>
                                  item.id ===
                                  deployment.environment_id
                              );

                            return (
                              <tr
                                key={
                                  deployment.id
                                }
                              >
                                <td>
                                  {environment
                                    ? getApplicationName(
                                        environment.application_id
                                      )
                                    : "—"}
                                </td>

                                <td>
                                  {getEnvironmentName(
                                    deployment.environment_id
                                  )}
                                </td>

                                <td>
                                  {
                                    deployment.version
                                  }
                                </td>

                                <td>
                                  <span
                                    className={getStatusClass(
                                      deployment.status
                                    )}
                                  >
                                    {
                                      deployment.status
                                    }
                                  </span>
                                </td>
                              </tr>
                            );
                          }
                        )}
                    </tbody>
                  </table>
                )}
              </section>
            </>
          )}

          {/* =========================
              PROJECTS
          ========================= */}

          {active === "Projects" && (
            <section className="section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">
                    Projects
                  </h2>

                  <p className="section-description">
                    Manage your CloudMind
                    projects
                  </p>
                </div>

                <div className="count-badge">
                  {projects.length} projects
                </div>
              </div>

              {projects.length === 0 ? (
                <div className="empty-state">
                  No projects found.
                </div>
              ) : (
                <div className="resource-grid">
                  {projects.map(
                    (project) => (
                      <div
                        className="resource-card"
                        key={project.id}
                      >
                        <h3>
                          {project.name}
                        </h3>

                        <p>
                          {project.description ||
                            "No description provided."}
                        </p>

                        <div className="resource-id">
                          ID: {project.id}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </section>
          )}

          {/* =========================
              APPLICATIONS
          ========================= */}

          {active ===
            "Applications" && (
            <section className="section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">
                    Applications
                  </h2>

                  <p className="section-description">
                    Applications connected to
                    your projects
                  </p>
                </div>

                <div className="count-badge">
                  {
                    applications.length
                  }{" "}
                  applications
                </div>
              </div>

              {applications.length === 0 ? (
                <div className="empty-state">
                  No applications found.
                </div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Project</th>
                      <th>Repository</th>
                      <th>ID</th>
                    </tr>
                  </thead>

                  <tbody>
                    {applications.map(
                      (application) => (
                        <tr
                          key={
                            application.id
                          }
                        >
                          <td>
                            <strong>
                              {
                                application.name
                              }
                            </strong>
                          </td>

                          <td>
                            {getProjectName(
                              application.project_id
                            )}
                          </td>

                          <td>
                            {application.repository_url ? (
                              <a
                                href={
                                  application.repository_url
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="repository-link"
                              >
                                View Repository
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>

                          <td className="id-cell">
                            {
                              application.id
                            }
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              )}
            </section>
          )}

          {/* =========================
              ENVIRONMENTS
          ========================= */}

          {active ===
            "Environments" && (
            <section className="section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">
                    Environments
                  </h2>

                  <p className="section-description">
                    Application deployment
                    environments
                  </p>
                </div>

                <div className="count-badge">
                  {environments.length}{" "}
                  environments
                </div>
              </div>

              {environments.length === 0 ? (
                <div className="empty-state">
                  No environments found.
                </div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Application</th>
                      <th>Cluster</th>
                      <th>ID</th>
                    </tr>
                  </thead>

                  <tbody>
                    {environments.map(
                      (environment) => {
                        const cluster =
                          clusters.find(
                            (item) =>
                              item.id ===
                              environment.cluster_id
                          );

                        return (
                          <tr
                            key={
                              environment.id
                            }
                          >
                            <td>
                              <strong>
                                {
                                  environment.name
                                }
                              </strong>
                            </td>

                            <td>
                              {getApplicationName(
                                environment.application_id
                              )}
                            </td>

                            <td>
                              {cluster
                                ? cluster.name
                                : "—"}
                            </td>

                            <td className="id-cell">
                              {
                                environment.id
                              }
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              )}
            </section>
          )}

          {/* =========================
              CLUSTERS
          ========================= */}

          {active === "Clusters" && (
            <section className="section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">
                    Clusters
                  </h2>

                  <p className="section-description">
                    Cloud infrastructure
                    clusters
                  </p>
                </div>

                <div className="count-badge">
                  {clusters.length} clusters
                </div>
              </div>

              {clusters.length === 0 ? (
                <div className="empty-state">
                  No clusters found.
                </div>
              ) : (
                <div className="resource-grid">
                  {clusters.map(
                    (cluster) => (
                      <div
                        className="resource-card"
                        key={cluster.id}
                      >
                        <div className="cluster-icon">
                          ☁
                        </div>

                        <h3>
                          {cluster.name}
                        </h3>

                        <p>
                          Provider:{" "}
                          {cluster.provider ||
                            "Unknown"}
                        </p>

                        <p>
                          Region:{" "}
                          {cluster.region ||
                            "Unknown"}
                        </p>

                        <div className="resource-id">
                          ID: {cluster.id}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </section>
          )}

          {/* =========================
              DEPLOYMENTS
          ========================= */}

          {active ===
            "Deployments" && (
            <section className="section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">
                    Deployments
                  </h2>

                  <p className="section-description">
                    Application deployment
                    history
                  </p>
                </div>

                <div className="count-badge">
                  {deployments.length}{" "}
                  deployments
                </div>
              </div>

              {deployments.length === 0 ? (
                <div className="empty-state">
                  No deployments found.
                </div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>
                        Application
                      </th>
                      <th>
                        Environment
                      </th>
                      <th>Version</th>
                      <th>Status</th>
                      <th>ID</th>
                    </tr>
                  </thead>

                  <tbody>
                    {deployments.map(
                      (deployment) => {
                        const environment =
                          environments.find(
                            (item) =>
                              item.id ===
                              deployment.environment_id
                          );

                        return (
                          <tr
                            key={
                              deployment.id
                            }
                          >
                            <td>
                              {environment
                                ? getApplicationName(
                                    environment.application_id
                                  )
                                : "—"}
                            </td>

                            <td>
                              {getEnvironmentName(
                                deployment.environment_id
                              )}
                            </td>

                            <td>
                              <strong>
                                {
                                  deployment.version
                                }
                              </strong>
                            </td>

                            <td>
                              <span
                                className={getStatusClass(
                                  deployment.status
                                )}
                              >
                                {
                                  deployment.status
                                }
                              </span>
                            </td>

                            <td className="id-cell">
                              {
                                deployment.id
                              }
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
