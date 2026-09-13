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

  /*
   * ---------------------------------------------------------
   * LOAD SAVED LOGIN
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const savedToken = localStorage.getItem("cloudmind_token");

    if (savedToken) {
      setToken(savedToken);
      loadCloudMindData(savedToken);
      loadCurrentUser(savedToken);
    } else {
      checkAPI();
    }
  }, []);

  /*
   * ---------------------------------------------------------
   * API HEALTH CHECK
   * ---------------------------------------------------------
   */

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

  /*
   * ---------------------------------------------------------
   * GENERIC API REQUEST
   * ---------------------------------------------------------
   */

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

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "GET",
      headers,
    });

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

  /*
   * ---------------------------------------------------------
   * LOGIN
   * ---------------------------------------------------------
   */

  const login = async () => {
    if (!loginEmail || !loginPassword) {
      setLoginError("Please enter email and password.");
      return;
    }

    setLoginLoading(true);
    setLoginError("");

    try {
      const formData = new URLSearchParams();

      formData.append("username", loginEmail);
      formData.append("password", loginPassword);

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        const text = await response.text();

        throw new Error(
          text || "Login failed. Check your credentials."
        );
      }

      const data = await response.json();

      const accessToken = data.access_token;

      if (!accessToken) {
        throw new Error(
          "Login succeeded but no access token was returned."
        );
      }

      localStorage.setItem(
        "cloudmind_token",
        accessToken
      );

      setToken(accessToken);

      await loadCurrentUser(accessToken);
      await loadCloudMindData(accessToken);

      setLoginEmail("");
      setLoginPassword("");
    } catch (err) {
      if (err instanceof Error) {
        setLoginError(err.message);
      } else {
        setLoginError("Login failed.");
      }
    } finally {
      setLoginLoading(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * CURRENT USER
   * ---------------------------------------------------------
   */

  const loadCurrentUser = async (authToken: string) => {
    try {
      const data = await apiRequest(
        "/auth/me",
        authToken
      );

      setUser(data);
    } catch {
      // User information is optional for the dashboard.
    }
  };

  /*
   * ---------------------------------------------------------
   * LOAD PROJECTS
   * ---------------------------------------------------------
   */

  const loadProjects = async (authToken: string) => {
    const data = await apiRequest(
      "/projects",
      authToken
    );

    setProjects(Array.isArray(data) ? data : []);
    return Array.isArray(data) ? data : [];
  };

  /*
   * ---------------------------------------------------------
   * LOAD CLUSTERS
   * ---------------------------------------------------------
   */

  const loadClusters = async (authToken: string) => {
    const data = await apiRequest(
      "/clusters",
      authToken
    );

    setClusters(Array.isArray(data) ? data : []);
    return Array.isArray(data) ? data : [];
  };

  /*
   * ---------------------------------------------------------
   * LOAD APPLICATIONS FOR PROJECT
   * ---------------------------------------------------------
   */

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

  /*
   * ---------------------------------------------------------
   * LOAD ENVIRONMENTS FOR APPLICATION
   * ---------------------------------------------------------
   */

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

  /*
   * ---------------------------------------------------------
   * LOAD DEPLOYMENTS FOR ENVIRONMENT
   * ---------------------------------------------------------
   */

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

  /*
   * ---------------------------------------------------------
   * LOAD EVERYTHING
   * ---------------------------------------------------------
   */

  const loadCloudMindData = async (
    authToken: string
  ) => {
    setLoading(true);
    setError("");

    try {
      const loadedProjects =
        await loadProjects(authToken);

      const loadedClusters =
        await loadClusters(authToken);

      const allApplications: Application[] = [];
      const allEnvironments: Environment[] = [];
      const allDeployments: Deployment[] = [];

      /*
       * Projects → Applications
       */
      for (const project of loadedProjects) {
        try {
          const projectApplications =
            await loadApplicationsForProject(
              project.id,
              authToken
            );

          allApplications.push(
            ...projectApplications
          );
        } catch {
          // Continue loading other projects.
        }
      }

      /*
       * Applications → Environments
       */
      for (const application of allApplications) {
        try {
          const applicationEnvironments =
            await loadEnvironmentsForApplication(
              application.id,
              authToken
            );

          allEnvironments.push(
            ...applicationEnvironments
          );
        } catch {
          // Continue loading other applications.
        }
      }

      /*
       * Environments → Deployments
       */
      for (const environment of allEnvironments) {
        try {
          const environmentDeployments =
            await loadDeploymentsForEnvironment(
              environment.id,
              authToken
            );

          allDeployments.push(
            ...environmentDeployments
          );
        } catch {
          // Continue loading other environments.
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
            : "Failed to load CloudMind data."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * LOGOUT
   * ---------------------------------------------------------
   */

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

  /*
   * ---------------------------------------------------------
   * REFRESH
   * ---------------------------------------------------------
   */

  const refreshData = async () => {
    if (!token) {
      await checkAPI();
      return;
    }

    await loadCloudMindData(token);
  };

  /*
   * ---------------------------------------------------------
   * HELPER FUNCTIONS
   * ---------------------------------------------------------
   */

  const getApplicationName = (
    applicationId: string
  ) => {
    const application = applications.find(
      (item) => item.id === applicationId
    );

    return application?.name || applicationId;
  };

  const getEnvironmentName = (
    environmentId: string
  ) => {
    const environment = environments.find(
      (item) => item.id === environmentId
    );

    return environment?.name || environmentId;
  };

  const getProjectName = (
    projectId: string
  ) => {
    const project = projects.find(
      (item) => item.id === projectId
    );

    return project?.name || projectId;
  };

  const getStatusClass = (status: string) => {
    const normalized =
      status.toUpperCase();

    if (normalized === "SUCCESS") {
      return "status status-success";
    }

    if (normalized === "RUNNING") {
      return "status status-running";
    }

    if (normalized === "PENDING") {
      return "status status-pending";
    }

    return "status";
  };

  /*
   * ---------------------------------------------------------
   * LOGIN SCREEN
   * ---------------------------------------------------------
   */

  if (!token) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          background: "#f4f7fb",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "430px",
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "14px",
            padding: "32px",
            boxShadow:
              "0 8px 30px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              fontSize: "30px",
              fontWeight: "700",
              marginBottom: "8px",
            }}
          >
            Cloud
            <span style={{ color: "#2563eb" }}>
              Mind
            </span>
          </div>

          <p
            style={{
              color: "#6b7280",
              marginBottom: "28px",
            }}
          >
            Cloud Management System
          </p>

          <h2
            style={{
              marginBottom: "20px",
              fontSize: "22px",
            }}
          >
            Sign in
          </h2>

          <label
            style={{
              display: "block",
              marginBottom: "7px",
              fontWeight: "600",
            }}
          >
            Email
          </label>

          <input
            type="email"
            value={loginEmail}
            onChange={(e) =>
              setLoginEmail(e.target.value)
            }
            placeholder="Enter your email"
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #d1d5db",
              borderRadius: "7px",
              marginBottom: "16px",
              fontSize: "15px",
            }}
          />

          <label
            style={{
              display: "block",
              marginBottom: "7px",
              fontWeight: "600",
            }}
          >
            Password
          </label>

          <input
            type="password"
            value={loginPassword}
            onChange={(e) =>
              setLoginPassword(e.target.value)
            }
            placeholder="Enter your password"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                login();
              }
            }}
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #d1d5db",
              borderRadius: "7px",
              marginBottom: "18px",
              fontSize: "15px",
            }}
          />

          {loginError && (
            <div
              style={{
                background: "#fee2e2",
                color: "#991b1b",
                padding: "12px",
                borderRadius: "7px",
                marginBottom: "18px",
                fontSize: "14px",
              }}
            >
              {loginError}
            </div>
          )}

          <button
            className="button"
            onClick={login}
            disabled={loginLoading}
            style={{
              width: "100%",
              padding: "12px",
            }}
          >
            {loginLoading
              ? "Signing in..."
              : "Sign in"}
          </button>

          <div
            style={{
              marginTop: "22px",
              padding: "12px",
              background: "#f9fafb",
              borderRadius: "7px",
              fontSize: "13px",
              color: "#6b7280",
            }}
          >
            API:
            <br />
            {API_URL}
          </div>
        </div>
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * MAIN DASHBOARD
   * ---------------------------------------------------------
   */

  return (
    <div className="dashboard">
      <header className="header">
        <div className="logo">
          Cloud<span>Mind</span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
          }}
        >
          <div className="header-status">
            ● System Online
          </div>

          <button
            onClick={logout}
            style={{
              background: "transparent",
              border: "1px solid #4b5563",
              color: "white",
              padding: "7px 12px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-title">
            Navigation
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

          <div
            style={{
              marginTop: "25px",
              padding: "12px",
              background: "#f9fafb",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#6b7280",
              wordBreak: "break-word",
            }}
          >
            <strong>API</strong>
            <br />
            {API_URL}
            <br />
            <br />
            Status:
            <br />
            <span
              style={{
                color:
                  apiStatus === "Online"
                    ? "#166534"
                    : "#92400e",
                fontWeight: "700",
              }}
            >
              {apiStatus}
            </span>
          </div>
        </aside>

        <main className="main">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "20px",
              marginBottom: "8px",
            }}
          >
            <div>
              <h1 className="page-title">
                {active}
              </h1>

              <p className="page-subtitle">
                CloudMind Cloud Management System
              </p>
            </div>

            {active !== "Dashboard" && (
              <button
                className="button"
                onClick={refreshData}
                disabled={loading}
              >
                {loading
                  ? "Refreshing..."
                  : "Refresh"}
              </button>
            )}
          </div>

          {error && (
            <div
              style={{
                background: "#fee2e2",
                color: "#991b1b",
                padding: "14px",
                borderRadius: "8px",
                marginBottom: "20px",
              }}
            >
              <strong>API Error:</strong>{" "}
              {error}
            </div>
          )}

          {loading && (
            <div
              style={{
                background: "#eff6ff",
                color: "#1d4ed8",
                padding: "14px",
                borderRadius: "8px",
                marginBottom: "20px",
              }}
            >
              Loading CloudMind data...
            </div>
          )}

          {/* =================================================
              DASHBOARD
          ================================================= */}

          {active === "Dashboard" && (
            <>
              <div className="cards">
                <div className="card">
                  <div className="card-label">
                    Projects
                  </div>

                  <div className="card-value">
                    {projects.length}
                  </div>
                </div>

                <div className="card">
                  <div className="card-label">
                    Applications
                  </div>

                  <div className="card-value">
                    {applications.length}
                  </div>
                </div>

                <div className="card">
                  <div className="card-label">
                    Clusters
                  </div>

                  <div className="card-value">
                    {clusters.length}
                  </div>
                </div>

                <div className="card">
                  <div className="card-label">
                    Deployments
                  </div>

                  <div className="card-value">
                    {deployments.length}
                  </div>
                </div>
              </div>

              <section className="section">
                <div className="section-header">
                  <h2 className="section-title">
                    CloudMind API
                  </h2>

                  <button
                    className="button"
                    onClick={checkAPI}
                  >
                    Check API
                  </button>
                </div>

                <div className="api-box">
                  API URL: {API_URL}
                  <br />
                  Status: {apiStatus}
                  <br />
                  Authentication: Connected
                </div>
              </section>

              <section className="section">
                <div className="section-header">
                  <h2 className="section-title">
                    Recent Deployments
                  </h2>
                </div>

                {deployments.length === 0 ? (
                  <p>
                    No deployments found.
                  </p>
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Application</th>
                        <th>Environment</th>
                        <th>Version</th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {deployments
                        .slice(0, 10)
                        .map(
                          (deployment) => (
                            <tr
                              key={
                                deployment.id
                              }
                            >
                              <td>
                                {getApplicationName(
                                  environments.find(
                                    (environment) =>
                                      environment.id ===
                                      deployment.environment_id
                                  )
                                    ?.application_id ||
                                    ""
                                )}
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
                          )
                        )}
                    </tbody>
                  </table>
                )}
              </section>
            </>
          )}

          {/* =================================================
              PROJECTS
          ================================================= */}

          {active === "Projects" && (
            <section className="section">
              <div className="section-header">
                <h2 className="section-title">
                  Projects
                </h2>

                <span>
                  {projects.length} total
                </span>
              </div>

              {projects.length === 0 ? (
                <p>
                  No projects found.
                </p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Project ID</th>
                    </tr>
                  </thead>

                  <tbody>
                    {projects.map(
                      (project) => (
                        <tr
                          key={project.id}
                        >
                          <td>
                            <strong>
                              {project.name}
                            </strong>
                          </td>

                          <td>
                            {project.description ||
                              "—"}
                          </td>

                          <td
                            style={{
                              fontFamily:
                                "monospace",
                              fontSize:
                                "12px",
                            }}
                          >
                            {project.id}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              )}
            </section>
          )}

          {/* =================================================
              APPLICATIONS
          ================================================= */}

          {active ===
            "Applications" && (
            <section className="section">
              <div className="section-header">
                <h2 className="section-title">
                  Applications
                </h2>

                <span>
                  {applications.length} total
                </span>
              </div>

              {applications.length === 0 ? (
                <p>
                  No applications found.
                </p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Project</th>
                      <th>Repository</th>
                      <th>Application ID</th>
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
                                style={{
                                  color:
                                    "#2563eb",
                                }}
                              >
                                Repository
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>

                          <td
                            style={{
                              fontFamily:
                                "monospace",
                              fontSize:
                                "12px",
                            }}
                          >
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

          {/* =================================================
              ENVIRONMENTS
          ================================================= */}

          {active ===
            "Environments" && (
            <section className="section">
              <div className="section-header">
                <h2 className="section-title">
                  Environments
                </h2>

                <span>
                  {environments.length} total
                </span>
              </div>

              {environments.length === 0 ? (
                <p>
                  No environments found.
                </p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Application</th>
                      <th>Cluster</th>
                      <th>Environment ID</th>
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

                            <td
                              style={{
                                fontFamily:
                                  "monospace",
                                fontSize:
                                  "12px",
                              }}
                            >
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

          {/* =================================================
              CLUSTERS
          ================================================= */}

          {active === "Clusters" && (
            <section className="section">
              <div className="section-header">
                <h2 className="section-title">
                  Clusters
                </h2>

                <span>
                  {clusters.length} total
                </span>
              </div>

              {clusters.length === 0 ? (
                <p>
                  No clusters found.
                </p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Provider</th>
                      <th>Region</th>
                      <th>Cluster ID</th>
                    </tr>
                  </thead>

                  <tbody>
                    {clusters.map(
                      (cluster) => (
                        <tr
                          key={cluster.id}
                        >
                          <td>
                            <strong>
                              {
                                cluster.name
                              }
                            </strong>
                          </td>

                          <td>
                            {
                              cluster.provider ||
                              "—"
                            }
                          </td>

                          <td>
                            {
                              cluster.region ||
                              "—"
                            }
                          </td>

                          <td
                            style={{
                              fontFamily:
                                "monospace",
                              fontSize:
                                "12px",
                            }}
                          >
                            {cluster.id}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              )}
            </section>
          )}

          {/* =================================================
              DEPLOYMENTS
          ================================================= */}

          {active ===
            "Deployments" && (
            <section className="section">
              <div className="section-header">
                <h2 className="section-title">
                  Deployments
                </h2>

                <span>
                  {deployments.length} total
                </span>
              </div>

              {deployments.length === 0 ? (
                <p>
                  No deployments found.
                </p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Application</th>
                      <th>Environment</th>
                      <th>Version</th>
                      <th>Status</th>
                      <th>Deployment ID</th>
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
                              {
                                getEnvironmentName(
                                  deployment.environment_id
                                )
                              }
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

                            <td
                              style={{
                                fontFamily:
                                  "monospace",
                                fontSize:
                                  "12px",
                              }}
                            >
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
