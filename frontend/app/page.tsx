"use client";

import { FormEvent, useEffect, useState } from "react";

const API_URL = "https://cloudmind-87ph.onrender.com";

type User = {
  id?: string;
  email?: string;
  full_name?: string;
  role?: string;
};

type Project = {
  id: string;
  name: string;
  description?: string;
};

type Application = {
  id: string;
  name: string;
  project_id: string;
  repo_url?: string;
};

type Environment = {
  id: string;
  name: string;
  application_id: string;
  cluster_id: string;
};

type Cluster = {
  id: string;
  name: string;
  provider?: string;
  region?: string;
};

type Deployment = {
  id: string;
  version: string;
  status: string;
  environment_id: string;
  created_at?: string;
};

type IconName =
  | "dashboard"
  | "projects"
  | "applications"
  | "environments"
  | "clusters"
  | "deployments"
  | "refresh"
  | "logout"
  | "plus"
  | "arrow"
  | "check"
  | "server"
  | "layers"
  | "box"
  | "activity";

function Icon({
  name,
  size = 20,
}: {
  name: IconName;
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "dashboard":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );

    case "projects":
      return (
        <svg {...common}>
          <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5z" />
        </svg>
      );

    case "applications":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <path d="M8 9h8M8 13h8M8 17h5" />
        </svg>
      );

    case "environments":
      return (
        <svg {...common}>
          <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" />
          <path d="M4 7.5l8 4.5 8-4.5M12 12v9" />
        </svg>
      );

    case "clusters":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="7" height="6" rx="1" />
          <rect x="14" y="4" width="7" height="6" rx="1" />
          <rect x="8.5" y="14" width="7" height="6" rx="1" />
          <path d="M6.5 10v2h11v-2M12 12v2" />
        </svg>
      );

    case "deployments":
      return (
        <svg {...common}>
          <path d="M12 3l2.2 5.2L20 10l-5.8 1.8L12 17l-2.2-5.2L4 10l5.8-1.8z" />
          <path d="M19 16l.8 1.8L22 18.5l-2.2.7L19 21l-.8-1.8-2.2-.7 2.2-.7z" />
        </svg>
      );

    case "refresh":
      return (
        <svg {...common}>
          <path d="M20 11a8 8 0 0 0-14.7-4L3 10" />
          <path d="M3 5v5h5" />
          <path d="M4 13a8 8 0 0 0 14.7 4L21 14" />
          <path d="M21 19v-5h-5" />
        </svg>
      );

    case "logout":
      return (
        <svg {...common}>
          <path d="M10 17l5-5-5-5" />
          <path d="M15 12H3" />
          <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
        </svg>
      );

    case "plus":
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );

    case "arrow":
      return (
        <svg {...common}>
          <path d="M5 12h14" />
          <path d="M13 6l6 6-6 6" />
        </svg>
      );

    case "check":
      return (
        <svg {...common}>
          <path d="M5 12l4 4L19 6" />
        </svg>
      );

    case "server":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="6" rx="1.5" />
          <rect x="3" y="14" width="18" height="6" rx="1.5" />
          <path d="M7 7h.01M7 17h.01" />
        </svg>
      );

    case "layers":
      return (
        <svg {...common}>
          <path d="M12 3l9 5-9 5-9-5z" />
          <path d="M3 12l9 5 9-5" />
          <path d="M3 16l9 5 9-5" />
        </svg>
      );

    case "box":
      return (
        <svg {...common}>
          <path d="M21 8l-9-5-9 5 9 5z" />
          <path d="M3 8v8l9 5 9-5V8" />
          <path d="M12 13v8" />
        </svg>
      );

    case "activity":
      return (
        <svg {...common}>
          <path d="M3 12h4l2-7 4 14 2-7h6" />
        </svg>
      );

    default:
      return null;
  }
}

const navigation = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" as IconName },
  { id: "projects", label: "Projects", icon: "projects" as IconName },
  {
    id: "applications",
    label: "Applications",
    icon: "applications" as IconName,
  },
  {
    id: "environments",
    label: "Environments",
    icon: "environments" as IconName,
  },
  { id: "clusters", label: "Clusters", icon: "clusters" as IconName },
  {
    id: "deployments",
    label: "Deployments",
    icon: "deployments" as IconName,
  },
];

export default function CloudMind() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loginLoading, setLoginLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const [loginError, setLoginError] = useState("");
  const [error, setError] = useState("");

  const [activePage, setActivePage] = useState("dashboard");

  const [projects, setProjects] = useState<Project[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);

  useEffect(() => {
    const savedToken = localStorage.getItem("cloudmind_token");

    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  useEffect(() => {
    if (token) {
      loadUser();
      loadData();
    }
  }, [token]);

  async function apiFetch(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Request failed: ${response.status}`);
    }

    return response.json();
  }

  async function loadUser() {
    try {
      const data = await apiFetch("/auth/me");
      setUser(data);
    } catch {
      logout();
    }
  }

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const projectData = await apiFetch("/projects");
      const clusterData = await apiFetch("/clusters");

      const projectList = Array.isArray(projectData)
        ? projectData
        : projectData.items || [];

      const clusterList = Array.isArray(clusterData)
        ? clusterData
        : clusterData.items || [];

      setProjects(projectList);
      setClusters(clusterList);

      const allApplications: Application[] = [];
      const allEnvironments: Environment[] = [];
      const allDeployments: Deployment[] = [];

      for (const project of projectList) {
        try {
          const applicationData = await apiFetch(
            `/projects/${project.id}/applications`
          );

          const appList = Array.isArray(applicationData)
            ? applicationData
            : applicationData.items || [];

          allApplications.push(...appList);

          for (const application of appList) {
            try {
              const environmentData = await apiFetch(
                `/applications/${application.id}/environments`
              );

              const environmentList = Array.isArray(environmentData)
                ? environmentData
                : environmentData.items || [];

              allEnvironments.push(...environmentList);

              for (const environment of environmentList) {
                try {
                  const deploymentData = await apiFetch(
                    `/environments/${environment.id}/deployments`
                  );

                  const deploymentList = Array.isArray(deploymentData)
                    ? deploymentData
                    : deploymentData.items || [];

                  allDeployments.push(...deploymentList);
                } catch {
                  // Ignore individual deployment errors.
                }
              }
            } catch {
              // Ignore individual environment errors.
            }
          }
        } catch {
          // Ignore individual application errors.
        }
      }

      setApplications(allApplications);
      setEnvironments(allEnvironments);
      setDeployments(allDeployments);
    } catch (err) {
      setError("Unable to load CloudMind resources.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoginLoading(true);
    setLoginError("");

    try {
      const body = new URLSearchParams();

      body.append("username", email);
      body.append("password", password);

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Incorrect email or password");
      }

      localStorage.setItem("cloudmind_token", data.access_token);
      setToken(data.access_token);
      setPassword("");
    } catch (err) {
      setLoginError(
        err instanceof Error
          ? err.message
          : "Incorrect email or password"
      );
    } finally {
      setLoginLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("cloudmind_token");
    setToken(null);
    setUser(null);
    setProjects([]);
    setApplications([]);
    setEnvironments([]);
    setClusters([]);
    setDeployments([]);
  }

  function getPageTitle() {
    const item = navigation.find((nav) => nav.id === activePage);
    return item?.label || "Dashboard";
  }

  function getProjectName(projectId: string) {
    return (
      projects.find((project) => project.id === projectId)?.name ||
      "Unknown project"
    );
  }

  function getApplicationName(applicationId: string) {
    return (
      applications.find((app) => app.id === applicationId)?.name ||
      "Unknown application"
    );
  }

  function getEnvironmentName(environmentId: string) {
    return (
      environments.find((env) => env.id === environmentId)?.name ||
      "Unknown environment"
    );
  }

  function statusClass(status: string) {
    return `status-pill status-${status.toLowerCase()}`;
  }

  if (!token) {
    return (
      <main className="login-page">
        <div className="login-background-shape shape-one" />
        <div className="login-background-shape shape-two" />

        <section className="login-card">
          <div className="login-brand">
            <div className="brand-icon">
              <svg
                width="34"
                height="34"
                viewBox="0 0 34 34"
                fill="none"
              >
                <path
                  d="M9.5 24.5h15.2c3.2 0 5.8-2.5 5.8-5.6 0-2.9-2.2-5.2-5-5.6C24.6 8.9 21.2 6 17.1 6c-4.2 0-7.8 3.1-8.5 7.1C5.7 13.5 4 16 4 19c0 3.1 2.4 5.5 5.5 5.5Z"
                  fill="white"
                />
              </svg>
            </div>

            <div>
              <div className="brand-name">
                Cloud<span>Mind</span>
              </div>
              <div className="brand-tagline">
                Cloud Management System
              </div>
            </div>
          </div>

          <div className="login-heading">
            <h1>Welcome back</h1>
            <p>Sign in to manage your cloud infrastructure.</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email address</label>

              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <div className="password-label-row">
                <label>Password</label>
              </div>

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>

            {loginError && (
              <div className="login-error">
                <span className="error-dot" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={loginLoading}
            >
              {loginLoading ? (
                <>
                  <span className="spinner" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <Icon name="arrow" size={18} />
                </>
              )}
            </button>
          </form>

          <div className="login-footer">
            <span className="online-dot" />
            <span>CloudMind backend connected</span>
          </div>
        </section>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <svg
              width="25"
              height="25"
              viewBox="0 0 34 34"
              fill="none"
            >
              <path
                d="M9.5 24.5h15.2c3.2 0 5.8-2.5 5.8-5.6 0-2.9-2.2-5.2-5-5.6C24.6 8.9 21.2 6 17.1 6c-4.2 0-7.8 3.1-8.5 7.1C5.7 13.5 4 16 4 19c0 3.1 2.4 5.5 5.5 5.5Z"
                fill="white"
              />
            </svg>
          </div>

          <div>
            <div className="sidebar-brand-name">
              Cloud<span>Mind</span>
            </div>
            <div className="sidebar-version">CONTROL PLANE</div>
          </div>
        </div>

        <div className="nav-section-title">Workspace</div>

        <nav className="navigation">
          {navigation.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${
                activePage === item.id ? "active" : ""
              }`}
              onClick={() => setActivePage(item.id)}
            >
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>

              {item.id === "deployments" && deployments.length > 0 && (
                <span className="nav-count">{deployments.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-status">
            <span className="online-dot" />
            <div>
              <strong>System online</strong>
              <span>All services operational</span>
            </div>
          </div>

          <button className="logout-button" onClick={logout}>
            <Icon name="logout" size={18} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="breadcrumb">
              CloudMind <span>/</span> {getPageTitle()}
            </div>
            <h1>{getPageTitle()}</h1>
          </div>

          <div className="topbar-actions">
            <div className="backend-status">
              <span className="online-dot" />
              Backend connected
            </div>

            <button
              className="icon-button"
              onClick={loadData}
              disabled={loading}
              title="Refresh"
            >
              <Icon name="refresh" size={19} />
            </button>

            <div className="user-menu">
              <div className="avatar">
                {(user?.full_name || user?.email || "U")
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="user-details">
                <strong>{user?.full_name || "CloudMind User"}</strong>
                <span>{user?.role || "User"}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="content-area">
          {error && <div className="error-banner">{error}</div>}

          {activePage === "dashboard" && (
            <>
              <section className="hero-card">
                <div>
                  <div className="hero-eyebrow">
                    <span className="online-dot" />
                    CLOUD INFRASTRUCTURE CONTROL
                  </div>

                  <h2>Welcome to CloudMind</h2>

                  <p>
                    Manage projects, applications, environments,
                    clusters and deployments from one unified control
                    plane.
                  </p>

                  <button
                    className="hero-button"
                    onClick={() => setActivePage("projects")}
                  >
                    Explore projects
                    <Icon name="arrow" size={17} />
                  </button>
                </div>

                <div className="hero-visual">
                  <div className="hero-circle circle-one" />
                  <div className="hero-circle circle-two" />

                  <div className="hero-server">
                    <Icon name="server" size={52} />
                  </div>
                </div>
              </section>

              <div className="section-header">
                <div>
                  <h2>Infrastructure overview</h2>
                  <p>
                    Real-time resources loaded from your CloudMind
                    backend.
                  </p>
                </div>

                <button
                  className="refresh-button"
                  onClick={loadData}
                  disabled={loading}
                >
                  <Icon name="refresh" size={17} />
                  {loading ? "Refreshing..." : "Refresh data"}
                </button>
              </div>

              <section className="stats-grid">
                <StatCard
                  icon="projects"
                  label="Projects"
                  value={projects.length}
                  description="Active projects"
                  onClick={() => setActivePage("projects")}
                />

                <StatCard
                  icon="applications"
                  label="Applications"
                  value={applications.length}
                  description="Registered applications"
                  onClick={() => setActivePage("applications")}
                />

                <StatCard
                  icon="environments"
                  label="Environments"
                  value={environments.length}
                  description="Application environments"
                  onClick={() => setActivePage("environments")}
                />

                <StatCard
                  icon="deployments"
                  label="Deployments"
                  value={deployments.length}
                  description="Tracked deployments"
                  onClick={() => setActivePage("deployments")}
                />
              </section>

              <section className="dashboard-grid">
                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <h3>Recent deployments</h3>
                      <p>Latest deployment activity</p>
                    </div>

                    <button
                      className="text-button"
                      onClick={() => setActivePage("deployments")}
                    >
                      View all
                      <Icon name="arrow" size={15} />
                    </button>
                  </div>

                  {deployments.length === 0 ? (
                    <EmptyState
                      icon="deployments"
                      title="No deployments yet"
                      description="Deployment records will appear here."
                    />
                  ) : (
                    <div className="deployment-list">
                      {deployments.slice(0, 5).map((deployment) => (
                        <div
                          className="deployment-row"
                          key={deployment.id}
                        >
                          <div className="deployment-icon">
                            <Icon name="deployments" size={18} />
                          </div>

                          <div className="deployment-info">
                            <strong>{deployment.version}</strong>
                            <span>
                              {getEnvironmentName(
                                deployment.environment_id
                              )}
                            </span>
                          </div>

                          <span className={statusClass(deployment.status)}>
                            {deployment.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <h3>Infrastructure</h3>
                      <p>Connected resources</p>
                    </div>
                  </div>

                  <div className="infrastructure-list">
                    <InfrastructureItem
                      icon="projects"
                      label="Projects"
                      value={projects.length}
                    />

                    <InfrastructureItem
                      icon="applications"
                      label="Applications"
                      value={applications.length}
                    />

                    <InfrastructureItem
                      icon="clusters"
                      label="Clusters"
                      value={clusters.length}
                    />

                    <InfrastructureItem
                      icon="activity"
                      label="Deployments"
                      value={deployments.length}
                    />
                  </div>
                </div>
              </section>
            </>
          )}

          {activePage === "projects" && (
            <ResourcePage
              title="Projects"
              description="Organize your applications and cloud resources into projects."
              icon="projects"
              count={projects.length}
            >
              {projects.length === 0 ? (
                <EmptyState
                  icon="projects"
                  title="No projects found"
                  description="Create a project through the CloudMind API to see it here."
                />
              ) : (
                <div className="resource-grid">
                  {projects.map((project) => (
                    <div className="resource-card" key={project.id}>
                      <div className="resource-card-top">
                        <div className="resource-icon">
                          <Icon name="projects" size={21} />
                        </div>

                        <span className="resource-active">
                          <span className="online-dot" />
                          Active
                        </span>
                      </div>

                      <h3>{project.name}</h3>

                      <p>
                        {project.description ||
                          "CloudMind infrastructure project"}
                      </p>

                      <div className="resource-footer">
                        <span>Project ID</span>
                        <code>{project.id.slice(0, 12)}...</code>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ResourcePage>
          )}

          {activePage === "applications" && (
            <ResourcePage
              title="Applications"
              description="Manage applications connected to your CloudMind projects."
              icon="applications"
              count={applications.length}
            >
              {applications.length === 0 ? (
                <EmptyState
                  icon="applications"
                  title="No applications found"
                  description="Applications registered with CloudMind will appear here."
                />
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Application</th>
                        <th>Project</th>
                        <th>Repository</th>
                        <th>Application ID</th>
                      </tr>
                    </thead>

                    <tbody>
                      {applications.map((application) => (
                        <tr key={application.id}>
                          <td>
                            <div className="table-name">
                              <div className="mini-icon">
                                <Icon name="applications" size={17} />
                              </div>

                              <strong>{application.name}</strong>
                            </div>
                          </td>

                          <td>
                            {getProjectName(application.project_id)}
                          </td>

                          <td>
                            {application.repo_url ? (
                              <span className="repository">
                                {application.repo_url.replace(
                                  "https://github.com/",
                                  ""
                                )}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>

                          <td>
                            <code>
                              {application.id.slice(0, 12)}...
                            </code>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </ResourcePage>
          )}

          {activePage === "environments" && (
            <ResourcePage
              title="Environments"
              description="Application environments connected to your clusters."
              icon="environments"
              count={environments.length}
            >
              {environments.length === 0 ? (
                <EmptyState
                  icon="environments"
                  title="No environments found"
                  description="Create an environment through the API to see it here."
                />
              ) : (
                <div className="resource-grid">
                  {environments.map((environment) => (
                    <div
                      className="resource-card"
                      key={environment.id}
                    >
                      <div className="resource-card-top">
                        <div className="resource-icon">
                          <Icon name="environments" size={21} />
                        </div>

                        <span className="environment-badge">
                          Environment
                        </span>
                      </div>

                      <h3>{environment.name}</h3>

                      <p>
                        Application:{" "}
                        {getApplicationName(
                          environment.application_id
                        )}
                      </p>

                      <div className="resource-footer">
                        <span>Environment ID</span>
                        <code>{environment.id.slice(0, 12)}...</code>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ResourcePage>
          )}

          {activePage === "clusters" && (
            <ResourcePage
              title="Clusters"
              description="View the compute clusters available to CloudMind."
              icon="clusters"
              count={clusters.length}
            >
              {clusters.length === 0 ? (
                <EmptyState
                  icon="clusters"
                  title="No clusters found"
                  description="Register a cluster through the CloudMind API."
                />
              ) : (
                <div className="resource-grid">
                  {clusters.map((cluster) => (
                    <div className="resource-card" key={cluster.id}>
                      <div className="resource-card-top">
                        <div className="resource-icon">
                          <Icon name="server" size={21} />
                        </div>

                        <span className="resource-active">
                          <span className="online-dot" />
                          Connected
                        </span>
                      </div>

                      <h3>{cluster.name}</h3>

                      <p>
                        {cluster.provider || "Cloud infrastructure"}{" "}
                        {cluster.region
                          ? `• ${cluster.region}`
                          : ""}
                      </p>

                      <div className="cluster-meta">
                        <div>
                          <span>Provider</span>
                          <strong>
                            {cluster.provider || "—"}
                          </strong>
                        </div>

                        <div>
                          <span>Region</span>
                          <strong>{cluster.region || "—"}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ResourcePage>
          )}

          {activePage === "deployments" && (
            <ResourcePage
              title="Deployments"
              description="Track application deployment versions and their current status."
              icon="deployments"
              count={deployments.length}
            >
              {deployments.length === 0 ? (
                <EmptyState
                  icon="deployments"
                  title="No deployments found"
                  description="Create a deployment through the CloudMind API."
                />
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Version</th>
                        <th>Environment</th>
                        <th>Status</th>
                        <th>Deployment ID</th>
                      </tr>
                    </thead>

                    <tbody>
                      {deployments.map((deployment) => (
                        <tr key={deployment.id}>
                          <td>
                            <div className="table-name">
                              <div className="mini-icon">
                                <Icon name="deployments" size={17} />
                              </div>

                              <strong>{deployment.version}</strong>
                            </div>
                          </td>

                          <td>
                            {getEnvironmentName(
                              deployment.environment_id
                            )}
                          </td>

                          <td>
                            <span
                              className={statusClass(
                                deployment.status
                              )}
                            >
                              {deployment.status === "SUCCESS" && (
                                <Icon name="check" size={14} />
                              )}
                              {deployment.status}
                            </span>
                          </td>

                          <td>
                            <code>
                              {deployment.id.slice(0, 12)}...
                            </code>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </ResourcePage>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  description,
  onClick,
}: {
  icon: IconName;
  label: string;
  value: number;
  description: string;
  onClick: () => void;
}) {
  return (
    <button className="stat-card" onClick={onClick}>
      <div className="stat-card-top">
        <div className="stat-icon">
          <Icon name={icon} size={21} />
        </div>

        <Icon name="arrow" size={17} />
      </div>

      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-description">{description}</div>
    </button>
  );
}

function ResourcePage({
  title,
  description,
  icon,
  count,
  children,
}: {
  title: string;
  description: string;
  icon: IconName;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="page-intro">
        <div className="page-intro-icon">
          <Icon name={icon} size={25} />
        </div>

        <div>
          <div className="page-title-row">
            <h2>{title}</h2>
            <span className="count-badge">{count}</span>
          </div>

          <p>{description}</p>
        </div>
      </div>

      {children}
    </>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: IconName;
  title: string;
  description: string;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon name={icon} size={27} />
      </div>

      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function InfrastructureItem({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: number;
}) {
  return (
    <div className="infrastructure-item">
      <div className="infrastructure-icon">
        <Icon name={icon} size={18} />
      </div>

      <span>{label}</span>

      <strong>{value}</strong>
    </div>
  );
}
