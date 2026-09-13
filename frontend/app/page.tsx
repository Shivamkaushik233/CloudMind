"use client";

import { useEffect, useMemo, useState } from "react";

const API_URL = "https://cloudmind-87ph.onrender.com";

type Project = {
  id: string;
  name: string;
  description?: string;
};

type Application = {
  id: string;
  name: string;
  project_id: string;
  repository_url?: string;
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

type User = {
  email: string;
  full_name: string;
  role: string;
};

type IconName =
  | "dashboard"
  | "folder"
  | "apps"
  | "server"
  | "cluster"
  | "rocket"
  | "search"
  | "bell"
  | "chevron"
  | "refresh"
  | "check"
  | "info"
  | "activity"
  | "database";

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

    case "folder":
      return (
        <svg {...common}>
          <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5z" />
        </svg>
      );

    case "apps":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="6" height="6" rx="1" />
          <rect x="14" y="4" width="6" height="6" rx="1" />
          <rect x="4" y="14" width="6" height="6" rx="1" />
          <rect x="14" y="14" width="6" height="6" rx="1" />
        </svg>
      );

    case "server":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="6" rx="1.5" />
          <rect x="3" y="14" width="18" height="6" rx="1.5" />
          <circle cx="7" cy="7" r="0.8" fill="currentColor" />
          <circle cx="7" cy="17" r="0.8" fill="currentColor" />
          <path d="M11 7h7M11 17h7" />
        </svg>
      );

    case "cluster":
      return (
        <svg {...common}>
          <circle cx="12" cy="5" r="2.5" />
          <circle cx="5" cy="18" r="2.5" />
          <circle cx="19" cy="18" r="2.5" />
          <path d="M10.8 7.3 6.2 15.7M13.2 7.3l4.6 8.4M7.5 18h9" />
        </svg>
      );

    case "rocket":
      return (
        <svg {...common}>
          <path d="M14.5 4.5c2.5-2.5 5-2.5 5-2.5s0 2.5-2.5 5l-6.5 6.5-4 1 1-4z" />
          <path d="M14 10l-4-4" />
          <path d="M7 14l-3 3" />
          <path d="M10 17l-3 3" />
          <circle cx="16.5" cy="6.5" r="1" />
        </svg>
      );

    case "search":
      return (
        <svg {...common}>
          <circle cx="10.8" cy="10.8" r="6.8" />
          <path d="m16 16 5 5" />
        </svg>
      );

    case "bell":
      return (
        <svg {...common}>
          <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>
      );

    case "chevron":
      return (
        <svg {...common}>
          <path d="m9 18 6-6-6-6" />
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

    case "check":
      return (
        <svg {...common}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );

    case "info":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 10v6M12 7h.01" />
        </svg>
      );

    case "activity":
      return (
        <svg {...common}>
          <path d="M3 12h4l2-7 4 14 2-7h6" />
        </svg>
      );

    case "database":
      return (
        <svg {...common}>
          <ellipse cx="12" cy="5" rx="7" ry="3" />
          <path d="M5 5v7c0 1.7 3.1 3 7 3s7-1.3 7-3V5" />
          <path d="M5 12v7c0 1.7 3.1 3 7 3s7-1.3 7-3v-7" />
        </svg>
      );

    default:
      return null;
  }
}

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState("");

  const [activePage, setActivePage] = useState("Dashboard");

  useEffect(() => {
    const savedToken = localStorage.getItem("cloudmind_token");

    if (savedToken) {
      setToken(savedToken);
      loadData(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  async function apiRequest(
    path: string,
    options: RequestInit = {},
    authToken?: string
  ) {
    const headers = new Headers(options.headers);

    headers.set("Content-Type", "application/json");

    if (authToken) {
      headers.set("Authorization", `Bearer ${authToken}`);
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let message = "Request failed";

      try {
        const body = await response.json();
        message = body.detail || message;
      } catch {}

      throw new Error(message);
    }

    return response.json();
  }

  async function login(e: React.FormEvent) {
    e.preventDefault();

    setLoginLoading(true);
    setError("");

    try {
      const form = new URLSearchParams();

      form.append("username", email);
      form.append("password", password);

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Incorrect email or password");
      }

      const data = await response.json();

      localStorage.setItem("cloudmind_token", data.access_token);

      setToken(data.access_token);

      await loadData(data.access_token);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to sign in"
      );
    } finally {
      setLoginLoading(false);
    }
  }

  async function loadData(authToken: string) {
    setLoading(true);
    setError("");

    try {
      const me = await apiRequest("/auth/me", {}, authToken);

      const projectData = await apiRequest(
        "/projects",
        {},
        authToken
      );

      const clusterData = await apiRequest(
        "/clusters",
        {},
        authToken
      );

      const allApplications: Application[] = [];
      const allEnvironments: Environment[] = [];
      const allDeployments: Deployment[] = [];

      for (const project of projectData) {
        try {
          const apps = await apiRequest(
            `/projects/${project.id}/applications`,
            {},
            authToken
          );

          allApplications.push(...apps);

          for (const application of apps) {
            try {
              const envs = await apiRequest(
                `/applications/${application.id}/environments`,
                {},
                authToken
              );

              allEnvironments.push(...envs);

              for (const environment of envs) {
                try {
                  const deps = await apiRequest(
                    `/environments/${environment.id}/deployments`,
                    {},
                    authToken
                  );

                  allDeployments.push(...deps);
                } catch {}
              }
            } catch {}
          }
        } catch {}
      }

      setUser(me);
      setProjects(projectData);
      setClusters(clusterData);
      setApplications(allApplications);
      setEnvironments(allEnvironments);
      setDeployments(allDeployments);
    } catch (err) {
      console.error(err);
      setError("Unable to load CloudMind data.");
    } finally {
      setLoading(false);
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

  const successfulDeployments = useMemo(
    () =>
      deployments.filter(
        (d) => d.status?.toUpperCase() === "SUCCESS"
      ).length,
    [deployments]
  );

  const runningDeployments = useMemo(
    () =>
      deployments.filter(
        (d) => d.status?.toUpperCase() === "RUNNING"
      ).length,
    [deployments]
  );

  const failedDeployments = useMemo(
    () =>
      deployments.filter(
        (d) => d.status?.toUpperCase() === "FAILED"
      ).length,
    [deployments]
  );

  const pendingDeployments = useMemo(
    () =>
      deployments.filter(
        (d) => d.status?.toUpperCase() === "PENDING"
      ).length,
    [deployments]
  );

  const successPercentage =
    deployments.length > 0
      ? Math.round(
          (successfulDeployments / deployments.length) * 100
        )
      : 0;

  function navigate(page: string) {
    setActivePage(page);
  }

  if (!token) {
    return (
      <main className="login-page">
        <div className="login-background-orb orb-one" />
        <div className="login-background-orb orb-two" />

        <div className="login-card">
          <div className="brand-large">
            <div className="brand-cloud">
              <span>☁</span>
            </div>

            <div>
              <h1>
                Cloud<span>Mind</span>
              </h1>

              <p>Cloud Management System</p>
            </div>
          </div>

          <div className="login-heading">
            <h2>Welcome back</h2>
            <p>
              Sign in to manage your cloud infrastructure.
            </p>
          </div>

          <form onSubmit={login}>
            <div className="form-group">
              <label>Email address</label>

              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button
              className="login-button"
              type="submit"
              disabled={loginLoading}
            >
              {loginLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="login-footer">
            <span className="status-dot" />
            CloudMind backend connected
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="app-shell">

      <aside className="sidebar">

        <div className="sidebar-brand">
          <div className="sidebar-logo">
            ☁
          </div>

          <div>
            <div className="sidebar-title">
              Cloud<span>Mind</span>
            </div>

            <div className="sidebar-subtitle">
              Cloud Management System
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">

          <div className="nav-section-title">
            MAIN
          </div>

          {[
            ["Dashboard", "dashboard"],
            ["Projects", "folder"],
            ["Applications", "apps"],
            ["Environments", "server"],
            ["Clusters", "cluster"],
            ["Deployments", "rocket"],
          ].map(([name, icon]) => (
            <button
              key={name}
              className={`nav-item ${
                activePage === name ? "active" : ""
              }`}
              onClick={() => navigate(name)}
            >
              <Icon name={icon as IconName} />
              <span>{name}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">

          <div className="backend-card">
            <div className="backend-icon">
              <span />
            </div>

            <div>
              <strong>Backend Connected</strong>
              <small>CloudMind API</small>
            </div>

            <Icon name="chevron" size={17} />
          </div>

          <div className="sidebar-user">
            <div className="avatar">
              {(user?.full_name || "U")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>
                {user?.full_name || "User"}
              </strong>

              <small>
                {user?.role || "Developer"}
              </small>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">

        <header className="topbar">

          <div className="search-box">
            <Icon name="search" size={19} />

            <input
              placeholder="Search projects, applications, environments..."
            />
          </div>

          <div className="topbar-right">

            <button className="icon-button">
              <Icon name="bell" size={20} />
              <span className="notification-dot" />
            </button>

            <div className="top-divider" />

            <div className="profile-area">

              <div className="profile-avatar">
                {(user?.full_name || "U")
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="profile-text">
                <strong>
                  {user?.full_name || "User"}
                </strong>

                <span>
                  {user?.role || "Developer"}
                </span>
              </div>

              <span className="profile-chevron">
                ⌄
              </span>
            </div>

            <button
              className="logout-top"
              onClick={logout}
            >
              Logout
            </button>

          </div>
        </header>

        <div className="page-content">

          <div className="page-header">

            <div>
              <div className="breadcrumb">
                CloudMind <span>/</span> {activePage}
              </div>

              <h1>
                {activePage === "Dashboard"
                  ? `Welcome back, ${
                      user?.full_name?.split(" ")[0] ||
                      "User"
                    } 👋`
                  : activePage}
              </h1>

              <p>
                {activePage === "Dashboard"
                  ? "Manage your cloud infrastructure from one place."
                  : `Manage your CloudMind ${activePage.toLowerCase()} from one place.`}
              </p>
            </div>

            <div className="header-actions">

              <div className="system-online">

                <span className="status-dot" />

                <div>
                  <strong>System Online</strong>
                  <small>All systems operational</small>
                </div>

              </div>

              <button
                className="refresh-button"
                onClick={() =>
                  token && loadData(token)
                }
              >
                <Icon name="refresh" size={17} />
                Refresh
              </button>

            </div>
          </div>

          {error && (
            <div className="error-banner">
              {error}
            </div>
          )}

          {activePage === "Dashboard" && (
            <>
              <section className="stats-grid">

                <StatCard
                  title="Projects"
                  value={projects.length}
                  description="Active projects"
                  icon="folder"
                  variant="blue"
                />

                <StatCard
                  title="Applications"
                  value={applications.length}
                  description="Registered applications"
                  icon="apps"
                  variant="purple"
                />

                <StatCard
                  title="Environments"
                  value={environments.length}
                  description="Configured environments"
                  icon="server"
                  variant="green"
                />

                <StatCard
                  title="Clusters"
                  value={clusters.length}
                  description="Connected clusters"
                  icon="cluster"
                  variant="orange"
                />

              </section>

              <section className="dashboard-grid">

                <div className="dashboard-card deployment-chart-card">

                  <div className="card-header">

                    <div>
                      <h2>
                        <Icon
                          name="activity"
                          size={19}
                        />
                        Deployment Overview
                      </h2>

                      <p>
                        Deployment activity across your infrastructure
                      </p>
                    </div>

                    <button className="period-button">
                      Last 7 days
                      <span>⌄</span>
                    </button>

                  </div>

                  <div className="chart-legend">

                    <span>
                      <i className="legend success" />
                      Success
                    </span>

                    <span>
                      <i className="legend running" />
                      Running
                    </span>

                    <span>
                      <i className="legend failed" />
                      Failed
                    </span>

                    <span>
                      <i className="legend pending" />
                      Pending
                    </span>

                  </div>

                  <div className="fake-chart">

                    <div className="chart-y">
                      <span>4</span>
                      <span>3</span>
                      <span>2</span>
                      <span>1</span>
                      <span>0</span>
                    </div>

                    <div className="chart-area">

                      <div className="chart-grid-line" />
                      <div className="chart-grid-line" />
                      <div className="chart-grid-line" />
                      <div className="chart-grid-line" />
                      <div className="chart-grid-line" />

                      <svg
                        className="chart-svg"
                        viewBox="0 0 700 190"
                        preserveAspectRatio="none"
                      >
                        <polyline
                          points="0,170 115,150 230,155 350,145 465,125 580,105 700,75"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                        />

                        <polyline
                          points="0,175 115,174 230,174 350,170 465,172 580,165 700,160"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          opacity=".3"
                        />
                      </svg>

                      <div className="chart-points">
                        {[0, 1, 2, 3, 4, 5, 6].map(
                          (item) => (
                            <span key={item} />
                          )
                        )}
                      </div>

                      <div className="chart-x">
                        <span>Mon</span>
                        <span>Tue</span>
                        <span>Wed</span>
                        <span>Thu</span>
                        <span>Fri</span>
                        <span>Sat</span>
                        <span>Sun</span>
                      </div>

                    </div>
                  </div>
                </div>

                <div className="dashboard-card status-card">

                  <div className="card-header">
                    <div>
                      <h2>Deployment Status</h2>
                      <p>
                        Current deployment health
                      </p>
                    </div>
                  </div>

                  <div className="status-content">

                    <div
                      className="donut"
                      style={{
                        background: `conic-gradient(
                          #16b981 ${successPercentage}%,
                          #e8eef7 ${successPercentage}% 100%
                        )`,
                      }}
                    >
                      <div className="donut-inner">
                        <strong>
                          {successPercentage}%
                        </strong>

                        <span>Success</span>
                      </div>
                    </div>

                    <div className="status-list">

                      <StatusRow
                        label="Success"
                        value={successfulDeployments}
                        type="success"
                      />

                      <StatusRow
                        label="Running"
                        value={runningDeployments}
                        type="running"
                      />

                      <StatusRow
                        label="Pending"
                        value={pendingDeployments}
                        type="pending"
                      />

                      <StatusRow
                        label="Failed"
                        value={failedDeployments}
                        type="failed"
                      />

                    </div>
                  </div>
                </div>

              </section>

              <section className="lower-grid">

                <div className="dashboard-card recent-card">

                  <div className="card-header">

                    <div>
                      <h2>
                        <Icon
                          name="rocket"
                          size={19}
                        />
                        Recent Deployments
                      </h2>

                      <p>
                        Latest deployment activity
                      </p>
                    </div>

                    <button
                      className="view-all"
                      onClick={() =>
                        navigate("Deployments")
                      }
                    >
                      View all →
                    </button>

                  </div>

                  {loading ? (
                    <div className="loading-state">
                      Loading deployments...
                    </div>
                  ) : deployments.length === 0 ? (
                    <div className="empty-state">
                      <Icon name="rocket" size={30} />

                      <strong>
                        No deployments yet
                      </strong>

                      <span>
                        Your deployment activity will appear here.
                      </span>
                    </div>
                  ) : (
                    <DeploymentTable
                      deployments={deployments.slice(0, 5)}
                      applications={applications}
                      environments={environments}
                    />
                  )}

                </div>

                <div className="dashboard-card quick-actions">

                  <div className="card-header">

                    <div>
                      <h2>Quick Actions</h2>

                      <p>
                        Common CloudMind actions
                      </p>
                    </div>

                  </div>

                  <QuickAction
                    icon="folder"
                    title="Create Project"
                    description="Start a new project"
                    onClick={() =>
                      navigate("Projects")
                    }
                  />

                  <QuickAction
                    icon="rocket"
                    title="Deploy Application"
                    description="Deploy to your environment"
                    onClick={() =>
                      navigate("Deployments")
                    }
                  />

                  <QuickAction
                    icon="cluster"
                    title="Manage Clusters"
                    description="View your clusters"
                    onClick={() =>
                      navigate("Clusters")
                    }
                  />

                  <QuickAction
                    icon="activity"
                    title="View Deployments"
                    description="Check deployment activity"
                    onClick={() =>
                      navigate("Deployments")
                    }
                  />

                </div>

              </section>

              <section className="dashboard-card system-info">

                <div className="card-header">

                  <div>
                    <h2>
                      <Icon
                        name="info"
                        size={19}
                      />
                      System Information
                    </h2>

                    <p>
                      CloudMind platform health
                    </p>
                  </div>

                </div>

                <div className="system-info-grid">

                  <InfoItem
                    label="Backend API"
                    value="Online"
                    status
                  />

                  <InfoItem
                    label="Database"
                    value="Connected"
                    status
                  />

                  <InfoItem
                    label="Projects"
                    value={String(projects.length)}
                  />

                  <InfoItem
                    label="Applications"
                    value={String(applications.length)}
                  />

                  <InfoItem
                    label="Environments"
                    value={String(environments.length)}
                  />

                  <InfoItem
                    label="CloudMind Version"
                    value="0.1.0"
                  />

                </div>

              </section>
            </>
          )}

          {activePage === "Projects" && (
            <ResourcePage
              title="Projects"
              description="Manage all projects registered in CloudMind."
              count={projects.length}
              icon="folder"
            >
              {projects.map((project) => (
                <div
                  className="resource-card"
                  key={project.id}
                >
                  <div className="resource-icon blue">
                    <Icon name="folder" />
                  </div>

                  <div className="resource-main">
                    <strong>{project.name}</strong>

                    <span>
                      {project.description ||
                        "CloudMind project"}
                    </span>
                  </div>

                  <code>
                    {project.id.slice(0, 12)}...
                  </code>
                </div>
              ))}
            </ResourcePage>
          )}

          {activePage === "Applications" && (
            <ResourcePage
              title="Applications"
              description="Applications registered under your CloudMind projects."
              count={applications.length}
              icon="apps"
            >
              {applications.map((app) => (
                <div
                  className="resource-card"
                  key={app.id}
                >
                  <div className="resource-icon purple">
                    <Icon name="apps" />
                  </div>

                  <div className="resource-main">
                    <strong>{app.name}</strong>

                    <span>
                      {app.repository_url ||
                        "Repository not specified"}
                    </span>
                  </div>

                  <code>
                    {app.id.slice(0, 12)}...
                  </code>
                </div>
              ))}
            </ResourcePage>
          )}

          {activePage === "Environments" && (
            <ResourcePage
              title="Environments"
              description="Application environments configured across your clusters."
              count={environments.length}
              icon="server"
            >
              {environments.map((env) => (
                <div
                  className="resource-card"
                  key={env.id}
                >
                  <div className="resource-icon green">
                    <Icon name="server" />
                  </div>

                  <div className="resource-main">
                    <strong>{env.name}</strong>

                    <span>
                      Application:{" "}
                      {env.application_id.slice(0, 12)}...
                    </span>
                  </div>

                  <span className="environment-badge">
                    Active
                  </span>
                </div>
              ))}
            </ResourcePage>
          )}

          {activePage === "Clusters" && (
            <ResourcePage
              title="Clusters"
              description="Infrastructure clusters connected to CloudMind."
              count={clusters.length}
              icon="cluster"
            >
              {clusters.map((cluster) => (
                <div
                  className="resource-card"
                  key={cluster.id}
                >
                  <div className="resource-icon orange">
                    <Icon name="cluster" />
                  </div>

                  <div className="resource-main">
                    <strong>{cluster.name}</strong>

                    <span>
                      {cluster.provider ||
                        "Unknown provider"}{" "}
                      ·{" "}
                      {cluster.region ||
                        "Unknown region"}
                    </span>
                  </div>

                  <span className="online-badge">
                    <i />
                    Online
                  </span>
                </div>
              ))}
            </ResourcePage>
          )}

          {activePage === "Deployments" && (
            <ResourcePage
              title="Deployments"
              description="Monitor deployments across all environments."
              count={deployments.length}
              icon="rocket"
            >
              {deployments.map((deployment) => (
                <div
                  className="resource-card"
                  key={deployment.id}
                >
                  <div className="resource-icon blue">
                    <Icon name="rocket" />
                  </div>

                  <div className="resource-main">
                    <strong>
                      {deployment.version}
                    </strong>

                    <span>
                      Environment:{" "}
                      {deployment.environment_id.slice(
                        0,
                        12
                      )}
                      ...
                    </span>
                  </div>

                  <StatusBadge
                    status={deployment.status}
                  />
                </div>
              ))}
            </ResourcePage>
          )}

        </div>
      </main>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon,
  variant,
}: {
  title: string;
  value: number;
  description: string;
  icon: IconName;
  variant: string;
}) {
  return (
    <div className={`stat-card ${variant}`}>

      <div className="stat-top">

        <div className={`stat-icon ${variant}`}>
          <Icon name={icon} size={21} />
        </div>

        <span className="stat-title">
          {title}
        </span>

      </div>

      <div className="stat-value">
        {value}
      </div>

      <div className="stat-description">
        <span>↗</span>
        {description}
      </div>

      <div className="stat-decoration" />
    </div>
  );
}

function StatusRow({
  label,
  value,
  type,
}: {
  label: string;
  value: number;
  type: string;
}) {
  return (
    <div className="status-row">

      <div>
        <i
          className={`status-indicator ${type}`}
        />

        <span>{label}</span>
      </div>

      <strong>{value}</strong>

    </div>
  );
}

function QuickAction({
  icon,
  title,
  description,
  onClick,
}: {
  icon: IconName;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      className="quick-action"
      onClick={onClick}
    >

      <div className="quick-action-icon">
        <Icon name={icon} size={19} />
      </div>

      <div>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>

      <Icon name="chevron" size={18} />

    </button>
  );
}

function InfoItem({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status?: boolean;
}) {
  return (
    <div className="info-item">

      <span>{label}</span>

      <strong>
        {status && (
          <i className="info-status" />
        )}

        {value}
      </strong>

    </div>
  );
}

function DeploymentTable({
  deployments,
  applications,
  environments,
}: {
  deployments: Deployment[];
  applications: Application[];
  environments: Environment[];
}) {
  return (
    <div className="deployment-table-wrapper">

      <table className="deployment-table">

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
          {deployments.map((deployment) => {

            const environment =
              environments.find(
                (e) =>
                  e.id ===
                  deployment.environment_id
              );

            const application =
              applications.find(
                (a) =>
                  a.id ===
                  environment?.application_id
              );

            return (
              <tr key={deployment.id}>

                <td>
                  <div className="table-app">

                    <div className="table-app-icon">
                      <Icon
                        name="apps"
                        size={17}
                      />
                    </div>

                    <div>
                      <strong>
                        {application?.name ||
                          "Application"}
                      </strong>

                      <span>
                        CloudMind
                      </span>
                    </div>

                  </div>
                </td>

                <td>
                  <span className="environment-pill">
                    {environment?.name ||
                      "development"}
                  </span>
                </td>

                <td>
                  <strong>
                    {deployment.version}
                  </strong>
                </td>

                <td>
                  <StatusBadge
                    status={deployment.status}
                  />
                </td>

                <td>
                  <code>
                    {deployment.id.slice(0, 10)}...
                  </code>
                </td>

              </tr>
            );
          })}
        </tbody>

      </table>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized = status?.toUpperCase();

  let className = "success";

  if (normalized === "FAILED") {
    className = "failed";
  } else if (normalized === "RUNNING") {
    className = "running";
  } else if (normalized === "PENDING") {
    className = "pending";
  }

  return (
    <span
      className={`status-badge ${className}`}
    >
      <i />
      {status}
    </span>
  );
}

function ResourcePage({
  title,
  description,
  count,
  icon,
  children,
}: {
  title: string;
  description: string;
  count: number;
  icon: IconName;
  children: React.ReactNode;
}) {
  return (
    <section className="resource-page">

      <div className="resource-page-header">

        <div>

          <h2>
            <span className="resource-page-icon">
              <Icon name={icon} size={22} />
            </span>

            {title}
          </h2>

          <p>{description}</p>

        </div>

        <div className="resource-count">
          {count}
          <span>resources</span>
        </div>

      </div>

      <div className="resource-list">

        {count === 0 ? (
          <div className="empty-resource">

            <Icon name={icon} size={35} />

            <h3>
              No {title.toLowerCase()} found
            </h3>

            <p>
              There are currently no{" "}
              {title.toLowerCase()} registered.
            </p>

          </div>
        ) : (
          children
        )}

      </div>
    </section>
  );
}
