"use client";

import { FormEvent, useEffect, useState } from "react";

const API_URL = "https://cloudmind-87ph.onrender.com";

type User = {
  id?: string;
  email?: string;
  full_name?: string;
  role?: string;
  created_at?: string;
};

type Project = {
  id: string;
  name: string;
  description?: string;
  owner_id?: string;
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
  | "users"
  | "refresh"
  | "logout"
  | "plus"
  | "arrow"
  | "check"
  | "server"
  | "layers"
  | "box"
  | "trash"
  | "shield"
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

    case "users":
      return (
        <svg {...common}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );

    case "shield":
      return (
        <svg {...common}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
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

    case "trash":
      return (
        <svg {...common}>
          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
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

export default function CloudMind() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Auth form states
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState("DEVELOPER");

  const [loginLoading, setLoginLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [error, setError] = useState("");

  const [activePage, setActivePage] = useState("dashboard");

  // Resources
  const [projects, setProjects] = useState<Project[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Modal Dialogs
  const [activeModal, setActiveModal] = useState<
    "project" | "application" | "cluster" | "environment" | "deployment" | null
  >(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  // Modal Form Inputs
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");

  const [newAppProjectId, setNewAppProjectId] = useState("");
  const [newAppName, setNewAppName] = useState("");
  const [newAppRepoUrl, setNewAppRepoUrl] = useState("");

  const [newClusterName, setNewClusterName] = useState("");
  const [newClusterProvider, setNewClusterProvider] = useState("AWS EKS");
  const [newClusterRegion, setNewClusterRegion] = useState("us-east-1");

  const [newEnvAppId, setNewEnvAppId] = useState("");
  const [newEnvClusterId, setNewEnvClusterId] = useState("");
  const [newEnvName, setNewEnvName] = useState("production");

  const [newDepEnvId, setNewDepEnvId] = useState("");
  const [newDepVersion, setNewDepVersion] = useState("v1.0.0");

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
      let errorMsg = text;
      try {
        const json = JSON.parse(text);
        if (json.detail) errorMsg = json.detail;
      } catch {}
      throw new Error(errorMsg || `Request failed: ${response.status}`);
    }

    if (response.status === 204) return null;
    return response.json();
  }

  async function loadUser() {
    try {
      const data = await apiFetch("/auth/me");
      setUser(data);
      if (data.role === "ADMIN") {
        loadUsers();
      }
    } catch {
      logout();
    }
  }

  async function loadUsers() {
    try {
      const data = await apiFetch("/auth/users");
      if (Array.isArray(data)) setUsers(data);
    } catch {
      // ignore if non-admin
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
                } catch {}
              }
            } catch {}
          }
        } catch {}
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

  // --- Auth Handlers ---
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
        err instanceof Error ? err.message : "Incorrect email or password"
      );
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    try {
      // 1. Register User
      const regResp = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: regFullName,
          email: regEmail,
          password: regPassword,
          role: regRole,
        }),
      });

      const regData = await regResp.json();
      if (!regResp.ok) {
        throw new Error(regData.detail || "Registration failed");
      }

      // 2. Automatically Login
      const body = new URLSearchParams();
      body.append("username", regEmail);
      body.append("password", regPassword);

      const loginResp = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });

      const loginData = await loginResp.json();
      if (!loginResp.ok) {
        throw new Error("Account created! Please sign in manually.");
      }

      localStorage.setItem("cloudmind_token", loginData.access_token);
      setToken(loginData.access_token);
      setRegPassword("");
    } catch (err) {
      setLoginError(
        err instanceof Error ? err.message : "Failed to create account"
      );
    } finally {
      setLoginLoading(false);
    }
  }

  function handleQuickDemo() {
    setEmail("admin@cloudmind.io");
    setPassword("secret123");
    setAuthMode("login");
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
    setUsers([]);
  }

  // --- Resource Creation Handlers ---
  async function handleCreateProject(e: FormEvent) {
    e.preventDefault();
    setModalSubmitting(true);
    setModalError("");
    try {
      await apiFetch("/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDesc,
        }),
      });
      setActiveModal(null);
      setNewProjectName("");
      setNewProjectDesc("");
      loadData();
    } catch (err) {
      setModalError(
        err instanceof Error ? err.message : "Failed to create project"
      );
    } finally {
      setModalSubmitting(false);
    }
  }

  async function handleDeleteProject(projectId: string) {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await apiFetch(`/projects/${projectId}`, { method: "DELETE" });
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete project");
    }
  }

  async function handleCreateApplication(e: FormEvent) {
    e.preventDefault();
    if (!newAppProjectId) {
      setModalError("Please select a project.");
      return;
    }
    setModalSubmitting(true);
    setModalError("");
    try {
      await apiFetch(`/projects/${newAppProjectId}/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAppName,
          repo_url: newAppRepoUrl || undefined,
        }),
      });
      setActiveModal(null);
      setNewAppName("");
      setNewAppRepoUrl("");
      loadData();
    } catch (err) {
      setModalError(
        err instanceof Error ? err.message : "Failed to create application"
      );
    } finally {
      setModalSubmitting(false);
    }
  }

  async function handleDeleteApplication(appId: string) {
    if (!confirm("Are you sure you want to delete this application?")) return;
    try {
      await apiFetch(`/applications/${appId}`, { method: "DELETE" });
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete application");
    }
  }

  async function handleCreateCluster(e: FormEvent) {
    e.preventDefault();
    setModalSubmitting(true);
    setModalError("");
    try {
      await apiFetch("/clusters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newClusterName,
          provider: newClusterProvider,
          region: newClusterRegion,
        }),
      });
      setActiveModal(null);
      setNewClusterName("");
      loadData();
    } catch (err) {
      setModalError(
        err instanceof Error
          ? err.message
          : "Failed to create cluster (Requires Admin or DevOps role)"
      );
    } finally {
      setModalSubmitting(false);
    }
  }

  async function handleDeleteCluster(clusterId: string) {
    if (!confirm("Are you sure you want to delete this cluster?")) return;
    try {
      await apiFetch(`/clusters/${clusterId}`, { method: "DELETE" });
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete cluster");
    }
  }

  async function handleCreateEnvironment(e: FormEvent) {
    e.preventDefault();
    if (!newEnvAppId) {
      setModalError("Please select an application.");
      return;
    }
    setModalSubmitting(true);
    setModalError("");
    try {
      await apiFetch(`/applications/${newEnvAppId}/environments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newEnvName,
          cluster_id: newEnvClusterId || undefined,
        }),
      });
      setActiveModal(null);
      setNewEnvName("production");
      loadData();
    } catch (err) {
      setModalError(
        err instanceof Error ? err.message : "Failed to create environment"
      );
    } finally {
      setModalSubmitting(false);
    }
  }

  async function handleDeleteEnvironment(envId: string) {
    if (!confirm("Are you sure you want to delete this environment?")) return;
    try {
      await apiFetch(`/environments/${envId}`, { method: "DELETE" });
      loadData();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Failed to delete environment"
      );
    }
  }

  async function handleCreateDeployment(e: FormEvent) {
    e.preventDefault();
    if (!newDepEnvId) {
      setModalError("Please select an environment.");
      return;
    }
    setModalSubmitting(true);
    setModalError("");
    try {
      await apiFetch(`/environments/${newDepEnvId}/deployments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version: newDepVersion,
        }),
      });
      setActiveModal(null);
      setNewDepVersion("v1.0.0");
      loadData();
    } catch (err) {
      setModalError(
        err instanceof Error ? err.message : "Failed to create deployment"
      );
    } finally {
      setModalSubmitting(false);
    }
  }

  async function handleUpdateDeploymentStatus(
    deploymentId: string,
    status: string
  ) {
    try {
      await apiFetch(`/deployments/${deploymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update deployment");
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await apiFetch(`/auth/users/${userId}`, { method: "DELETE" });
      loadUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete user");
    }
  }

  // --- Helper Getters ---
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
    switch (status.toUpperCase()) {
      case "SUCCESS":
        return "status-badge status-success";
      case "FAILED":
        return "status-badge status-failed";
      case "IN_PROGRESS":
        return "status-badge status-progress";
      default:
        return "status-badge status-pending";
    }
  }

  const navItems = [
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

  if (user?.role === "ADMIN") {
    navItems.push({
      id: "users",
      label: "User Management",
      icon: "users" as IconName,
    });
  }

  // --- AUTH PAGE RENDER ---
  if (!token) {
    return (
      <main className="login-page">
        <div className="login-background-shape shape-one" />
        <div className="login-background-shape shape-two" />

        <section className="login-card">
          <div className="login-header">
            <div className="login-brand">
              <div className="brand-badge">
                <Icon name="server" size={24} />
              </div>

              <div>
                <span className="brand-eyebrow">Cloud Infrastructure</span>
                <h2>CloudMind</h2>
              </div>
            </div>

            <p>
              {authMode === "login"
                ? "Sign in to manage your cloud infrastructure."
                : "Create a new account with Admin or Developer access."}
            </p>
          </div>

          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${authMode === "login" ? "active" : ""}`}
              onClick={() => {
                setAuthMode("login");
                setLoginError("");
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab ${authMode === "register" ? "active" : ""}`}
              onClick={() => {
                setAuthMode("register");
                setLoginError("");
              }}
            >
              Register New Account
            </button>
          </div>

          {authMode === "login" ? (
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  onChange={(e) => setPassword(e.target.value)}
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

              <button
                type="button"
                className="quick-demo-btn"
                onClick={handleQuickDemo}
              >
                <Icon name="shield" size={16} />
                Fill Demo Admin Credentials (admin@cloudmind.io)
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="Jane Developer"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email address</label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="developer@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Choose a secure password"
                  required
                />
              </div>

              <div className="form-group">
                <label>Account Role</label>
                <select
                  className="form-select"
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                >
                  <option value="DEVELOPER">
                    User / Developer (Manage own projects)
                  </option>
                  <option value="ADMIN">
                    Admin (Full control & user management)
                  </option>
                </select>
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
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account & Sign in
                    <Icon name="arrow" size={18} />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="login-footer">
            <span className="online-dot" />
            <span>CloudMind backend connected</span>
          </div>
        </section>
      </main>
    );
  }

  // --- LOGGED-IN APP SHELL RENDER ---
  return (
    <div className="app-shell">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <svg width="25" height="25" viewBox="0 0 34 34" fill="none">
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
            <div className="sidebar-version">
              {user?.role === "ADMIN" ? "ADMIN CONTROL PLANE" : "DEV WORKSPACE"}
            </div>
          </div>
        </div>

        <div className="nav-section-title">Navigation</div>

        <nav className="navigation">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activePage === item.id ? "active" : ""}`}
              onClick={() => setActivePage(item.id)}
            >
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>

              {item.id === "deployments" && deployments.length > 0 && (
                <span className="nav-count">{deployments.length}</span>
              )}

              {item.id === "users" && users.length > 0 && (
                <span className="nav-count">{users.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-status">
            <span className="online-dot" />
            <div>
              <strong>System online</strong>
              <span>
                {user?.role === "ADMIN"
                  ? "Admin Privileges"
                  : "Developer Access"}
              </span>
            </div>
          </div>

          <button className="logout-button" onClick={logout}>
            <Icon name="logout" size={18} />
            Sign out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="breadcrumb">
              CloudMind <span>/</span>{" "}
              {navItems.find((n) => n.id === activePage)?.label || "Dashboard"}
            </div>
            <h1>
              {navItems.find((n) => n.id === activePage)?.label || "Dashboard"}
            </h1>
          </div>

          <div className="topbar-actions">
            <div className="backend-status">
              <span className="online-dot" />
              API Connected
            </div>

            <button
              className="icon-button"
              onClick={() => {
                loadData();
                if (user?.role === "ADMIN") loadUsers();
              }}
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
                <span className={`role-badge ${user?.role?.toLowerCase()}`}>
                  {user?.role || "USER"}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="content-area">
          {error && <div className="error-banner">{error}</div>}

          {/* DASHBOARD TAB */}
          {activePage === "dashboard" && (
            <>
              <section className="hero-card">
                <div>
                  <div className="hero-eyebrow">
                    <span className="online-dot" />
                    AUTONOMOUS CLOUD OPERATIONS
                  </div>

                  <h2>Welcome back, {user?.full_name || "Operator"}</h2>

                  <p>
                    {user?.role === "ADMIN"
                      ? "Full administrative access: create projects, register clusters, review all microservices, and manage user accounts."
                      : "Developer workspace: create and deploy microservices, manage your application environments, and view release telemetry."}
                  </p>

                  <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
                    <button
                      className="hero-button"
                      onClick={() => setActiveModal("project")}
                    >
                      <Icon name="plus" size={17} />
                      New Project
                    </button>

                    <button
                      className="hero-button"
                      style={{ background: "rgba(255,255,255,0.18)" }}
                      onClick={() => setActiveModal("cluster")}
                    >
                      <Icon name="server" size={17} />
                      Register Cluster
                    </button>
                  </div>
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
                    Real-time resources connected to your CloudMind control
                    plane.
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
                      <p>Latest release activity</p>
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
                      description="Deployments will appear here once triggered."
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
                              {getEnvironmentName(deployment.environment_id)}
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
                      <h3>Fleet Summary</h3>
                      <p>Active compute & resources</p>
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

                    {user?.role === "ADMIN" && (
                      <InfrastructureItem
                        icon="users"
                        label="Registered Users"
                        value={users.length}
                      />
                    )}
                  </div>
                </div>
              </section>
            </>
          )}

          {/* PROJECTS TAB */}
          {activePage === "projects" && (
            <ResourcePage
              title="Projects"
              description="Organize your microservices, repositories, and environments."
              icon="projects"
              count={projects.length}
              action={
                <button
                  className="btn-primary"
                  onClick={() => setActiveModal("project")}
                >
                  <Icon name="plus" size={16} />
                  Add Project
                </button>
              }
            >
              {projects.length === 0 ? (
                <EmptyState
                  icon="projects"
                  title="No projects found"
                  description="Get started by creating your first CloudMind project."
                  action={
                    <button
                      className="btn-primary"
                      onClick={() => setActiveModal("project")}
                    >
                      <Icon name="plus" size={16} />
                      Create Project
                    </button>
                  }
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

                      <div className="card-actions-row">
                        <div className="resource-footer" style={{ margin: 0 }}>
                          <span>ID:</span>
                          <code>{project.id.slice(0, 10)}...</code>
                        </div>

                        <button
                          className="btn-danger-sm"
                          onClick={() => handleDeleteProject(project.id)}
                          title="Delete Project"
                        >
                          <Icon name="trash" size={14} />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ResourcePage>
          )}

          {/* APPLICATIONS TAB */}
          {activePage === "applications" && (
            <ResourcePage
              title="Applications"
              description="Manage microservices connected to your CloudMind projects."
              icon="applications"
              count={applications.length}
              action={
                <button
                  className="btn-primary"
                  onClick={() => {
                    if (projects.length > 0)
                      setNewAppProjectId(projects[0].id);
                    setActiveModal("application");
                  }}
                  disabled={projects.length === 0}
                >
                  <Icon name="plus" size={16} />
                  Add Application
                </button>
              }
            >
              {applications.length === 0 ? (
                <EmptyState
                  icon="applications"
                  title="No applications found"
                  description={
                    projects.length === 0
                      ? "Create a project first before registering an application."
                      : "Register your first microservice or application."
                  }
                  action={
                    projects.length > 0 ? (
                      <button
                        className="btn-primary"
                        onClick={() => {
                          setNewAppProjectId(projects[0].id);
                          setActiveModal("application");
                        }}
                      >
                        <Icon name="plus" size={16} />
                        Register Application
                      </button>
                    ) : undefined
                  }
                />
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Application</th>
                        <th>Project</th>
                        <th>Repository</th>
                        <th>ID</th>
                        <th>Actions</th>
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

                          <td>{getProjectName(application.project_id)}</td>

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
                            <code>{application.id.slice(0, 10)}...</code>
                          </td>

                          <td>
                            <button
                              className="btn-danger-sm"
                              onClick={() =>
                                handleDeleteApplication(application.id)
                              }
                            >
                              <Icon name="trash" size={14} />
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </ResourcePage>
          )}

          {/* ENVIRONMENTS TAB */}
          {activePage === "environments" && (
            <ResourcePage
              title="Environments"
              description="Deploy and route applications across isolated clusters."
              icon="environments"
              count={environments.length}
              action={
                <button
                  className="btn-primary"
                  onClick={() => {
                    if (applications.length > 0)
                      setNewEnvAppId(applications[0].id);
                    if (clusters.length > 0)
                      setNewEnvClusterId(clusters[0].id);
                    setActiveModal("environment");
                  }}
                  disabled={applications.length === 0}
                >
                  <Icon name="plus" size={16} />
                  Add Environment
                </button>
              }
            >
              {environments.length === 0 ? (
                <EmptyState
                  icon="environments"
                  title="No environments found"
                  description={
                    applications.length === 0
                      ? "Create an application first before adding environments."
                      : "Create an environment for production, staging, or testing."
                  }
                  action={
                    applications.length > 0 ? (
                      <button
                        className="btn-primary"
                        onClick={() => {
                          setNewEnvAppId(applications[0].id);
                          if (clusters.length > 0)
                            setNewEnvClusterId(clusters[0].id);
                          setActiveModal("environment");
                        }}
                      >
                        <Icon name="plus" size={16} />
                        Add Environment
                      </button>
                    ) : undefined
                  }
                />
              ) : (
                <div className="resource-grid">
                  {environments.map((environment) => (
                    <div className="resource-card" key={environment.id}>
                      <div className="resource-card-top">
                        <div className="resource-icon">
                          <Icon name="environments" size={21} />
                        </div>

                        <span className="environment-badge">
                          {environment.name}
                        </span>
                      </div>

                      <h3>{environment.name}</h3>

                      <p>
                        Application:{" "}
                        <strong>
                          {getApplicationName(environment.application_id)}
                        </strong>
                      </p>

                      <div className="card-actions-row">
                        <div className="resource-footer" style={{ margin: 0 }}>
                          <span>ID:</span>
                          <code>{environment.id.slice(0, 10)}...</code>
                        </div>

                        <button
                          className="btn-danger-sm"
                          onClick={() =>
                            handleDeleteEnvironment(environment.id)
                          }
                          title="Delete Environment"
                        >
                          <Icon name="trash" size={14} />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ResourcePage>
          )}

          {/* CLUSTERS TAB */}
          {activePage === "clusters" && (
            <ResourcePage
              title="Compute Clusters"
              description="Manage the Kubernetes and cloud clusters available to CloudMind."
              icon="clusters"
              count={clusters.length}
              action={
                <button
                  className="btn-primary"
                  onClick={() => setActiveModal("cluster")}
                >
                  <Icon name="plus" size={16} />
                  Register Cluster
                </button>
              }
            >
              {clusters.length === 0 ? (
                <EmptyState
                  icon="clusters"
                  title="No clusters found"
                  description="Register an AWS EKS, GCP GKE, or Azure AKS cluster."
                  action={
                    <button
                      className="btn-primary"
                      onClick={() => setActiveModal("cluster")}
                    >
                      <Icon name="plus" size={16} />
                      Register Cluster
                    </button>
                  }
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
                        {cluster.region ? `• ${cluster.region}` : ""}
                      </p>

                      <div className="cluster-meta">
                        <div>
                          <span>Provider</span>
                          <strong>{cluster.provider || "—"}</strong>
                        </div>

                        <div>
                          <span>Region</span>
                          <strong>{cluster.region || "—"}</strong>
                        </div>
                      </div>

                      <div className="card-actions-row">
                        <div className="resource-footer" style={{ margin: 0 }}>
                          <span>Cluster ID:</span>
                          <code>{cluster.id.slice(0, 10)}...</code>
                        </div>

                        <button
                          className="btn-danger-sm"
                          onClick={() => handleDeleteCluster(cluster.id)}
                          title="Delete Cluster"
                        >
                          <Icon name="trash" size={14} />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ResourcePage>
          )}

          {/* DEPLOYMENTS TAB */}
          {activePage === "deployments" && (
            <ResourcePage
              title="Deployments"
              description="Track application releases, trigger continuous versions, and manage rollouts."
              icon="deployments"
              count={deployments.length}
              action={
                <button
                  className="btn-primary"
                  onClick={() => {
                    if (environments.length > 0)
                      setNewDepEnvId(environments[0].id);
                    setActiveModal("deployment");
                  }}
                  disabled={environments.length === 0}
                >
                  <Icon name="plus" size={16} />
                  Trigger Deployment
                </button>
              }
            >
              {deployments.length === 0 ? (
                <EmptyState
                  icon="deployments"
                  title="No deployments found"
                  description={
                    environments.length === 0
                      ? "Create an environment first to deploy software releases."
                      : "Trigger your first deployment to begin tracking rollouts."
                  }
                  action={
                    environments.length > 0 ? (
                      <button
                        className="btn-primary"
                        onClick={() => {
                          setNewDepEnvId(environments[0].id);
                          setActiveModal("deployment");
                        }}
                      >
                        <Icon name="plus" size={16} />
                        Trigger Deployment
                      </button>
                    ) : undefined
                  }
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
                        <th>Status Controls</th>
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
                            {getEnvironmentName(deployment.environment_id)}
                          </td>

                          <td>
                            <span className={statusClass(deployment.status)}>
                              {deployment.status === "SUCCESS" && (
                                <Icon name="check" size={14} />
                              )}
                              {deployment.status}
                            </span>
                          </td>

                          <td>
                            <code>{deployment.id.slice(0, 10)}...</code>
                          </td>

                          <td>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button
                                className="btn-secondary"
                                style={{ padding: "4px 8px", fontSize: "11px" }}
                                onClick={() =>
                                  handleUpdateDeploymentStatus(
                                    deployment.id,
                                    "SUCCESS"
                                  )
                                }
                                title="Mark as Succeeded"
                              >
                                Success
                              </button>
                              <button
                                className="btn-danger-sm"
                                style={{ padding: "4px 8px", fontSize: "11px" }}
                                onClick={() =>
                                  handleUpdateDeploymentStatus(
                                    deployment.id,
                                    "FAILED"
                                  )
                                }
                                title="Mark as Failed"
                              >
                                Fail
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </ResourcePage>
          )}

          {/* USERS MANAGEMENT TAB (ADMIN ONLY) */}
          {activePage === "users" && user?.role === "ADMIN" && (
            <ResourcePage
              title="User & Access Management"
              description="Review all registered user accounts, inspect permission levels, and manage credentials."
              icon="users"
              count={users.length}
            >
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Registered</th>
                      <th>User ID</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div className="table-name">
                            <div className="avatar" style={{ width: 28, height: 28, fontSize: 12 }}>
                              {(u.full_name || u.email || "U").charAt(0).toUpperCase()}
                            </div>
                            <strong>{u.full_name || "CloudMind User"}</strong>
                            {u.id === user?.id && (
                              <span style={{ fontSize: "10px", color: "#64748b", marginLeft: "4px" }}>
                                (You)
                              </span>
                            )}
                          </div>
                        </td>

                        <td>{u.email}</td>

                        <td>
                          <span className={`role-badge ${u.role?.toLowerCase()}`}>
                            {u.role}
                          </span>
                        </td>

                        <td>
                          {u.created_at
                            ? new Date(u.created_at).toLocaleDateString()
                            : "—"}
                        </td>

                        <td>
                          <code>{u.id?.slice(0, 10)}...</code>
                        </td>

                        <td>
                          {u.id !== user?.id ? (
                            <button
                              className="btn-danger-sm"
                              onClick={() => handleDeleteUser(u.id!)}
                            >
                              <Icon name="trash" size={14} />
                              Delete
                            </button>
                          ) : (
                            <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                              Active Account
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ResourcePage>
          )}
        </div>
      </main>

      {/* =========================================================
          MODAL DIALOGS
      ========================================================= */}

      {/* PROJECT MODAL */}
      {activeModal === "project" && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create New Project</h3>
              <button
                className="modal-close"
                onClick={() => setActiveModal(null)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateProject}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Project Name *</label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="e.g. Core Checkout Services"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    placeholder="Brief description of project purpose..."
                  />
                </div>

                {modalError && (
                  <div className="login-error">
                    <span className="error-dot" />
                    <span>{modalError}</span>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setActiveModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={modalSubmitting}
                >
                  {modalSubmitting ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPLICATION MODAL */}
      {activeModal === "application" && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add New Application</h3>
              <button
                className="modal-close"
                onClick={() => setActiveModal(null)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateApplication}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Parent Project *</label>
                  <select
                    className="form-select"
                    value={newAppProjectId}
                    onChange={(e) => setNewAppProjectId(e.target.value)}
                    required
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Application Name *</label>
                  <input
                    type="text"
                    value={newAppName}
                    onChange={(e) => setNewAppName(e.target.value)}
                    placeholder="e.g. payment-service"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Git Repository URL</label>
                  <input
                    type="url"
                    value={newAppRepoUrl}
                    onChange={(e) => setNewAppRepoUrl(e.target.value)}
                    placeholder="https://github.com/org/payment-service"
                  />
                </div>

                {modalError && (
                  <div className="login-error">
                    <span className="error-dot" />
                    <span>{modalError}</span>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setActiveModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={modalSubmitting}
                >
                  {modalSubmitting ? "Adding..." : "Add Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLUSTER MODAL */}
      {activeModal === "cluster" && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Register Compute Cluster</h3>
              <button
                className="modal-close"
                onClick={() => setActiveModal(null)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateCluster}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Cluster Identifier *</label>
                  <input
                    type="text"
                    value={newClusterName}
                    onChange={(e) => setNewClusterName(e.target.value)}
                    placeholder="e.g. production-us-east-1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Cloud Provider</label>
                  <select
                    className="form-select"
                    value={newClusterProvider}
                    onChange={(e) => setNewClusterProvider(e.target.value)}
                  >
                    <option value="AWS EKS">AWS EKS</option>
                    <option value="GCP GKE">Google Cloud GKE</option>
                    <option value="Azure AKS">Azure AKS</option>
                    <option value="Bare Metal">Bare Metal Kubernetes</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Region</label>
                  <input
                    type="text"
                    value={newClusterRegion}
                    onChange={(e) => setNewClusterRegion(e.target.value)}
                    placeholder="e.g. us-east-1"
                    required
                  />
                </div>

                {modalError && (
                  <div className="login-error">
                    <span className="error-dot" />
                    <span>{modalError}</span>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setActiveModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={modalSubmitting}
                >
                  {modalSubmitting ? "Registering..." : "Register Cluster"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ENVIRONMENT MODAL */}
      {activeModal === "environment" && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add Environment</h3>
              <button
                className="modal-close"
                onClick={() => setActiveModal(null)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateEnvironment}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Application *</label>
                  <select
                    className="form-select"
                    value={newEnvAppId}
                    onChange={(e) => setNewEnvAppId(e.target.value)}
                    required
                  >
                    {applications.map((app) => (
                      <option key={app.id} value={app.id}>
                        {app.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Environment Name *</label>
                  <input
                    type="text"
                    value={newEnvName}
                    onChange={(e) => setNewEnvName(e.target.value)}
                    placeholder="production / staging / preview"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Attached Cluster</label>
                  <select
                    className="form-select"
                    value={newEnvClusterId}
                    onChange={(e) => setNewEnvClusterId(e.target.value)}
                  >
                    <option value="">None (Unassigned)</option>
                    {clusters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.provider || "Cloud"})
                      </option>
                    ))}
                  </select>
                </div>

                {modalError && (
                  <div className="login-error">
                    <span className="error-dot" />
                    <span>{modalError}</span>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setActiveModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={modalSubmitting}
                >
                  {modalSubmitting ? "Creating..." : "Create Environment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEPLOYMENT MODAL */}
      {activeModal === "deployment" && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Trigger Deployment</h3>
              <button
                className="modal-close"
                onClick={() => setActiveModal(null)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateDeployment}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Target Environment *</label>
                  <select
                    className="form-select"
                    value={newDepEnvId}
                    onChange={(e) => setNewDepEnvId(e.target.value)}
                    required
                  >
                    {environments.map((env) => (
                      <option key={env.id} value={env.id}>
                        {env.name} ({getApplicationName(env.application_id)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Version Tag / Commit SHA *</label>
                  <input
                    type="text"
                    value={newDepVersion}
                    onChange={(e) => setNewDepVersion(e.target.value)}
                    placeholder="e.g. v2.4.2 or release-2026-09"
                    required
                  />
                </div>

                {modalError && (
                  <div className="login-error">
                    <span className="error-dot" />
                    <span>{modalError}</span>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setActiveModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={modalSubmitting}
                >
                  {modalSubmitting ? "Triggering..." : "Trigger Deployment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
  action,
  children,
}: {
  title: string;
  description: string;
  icon: IconName;
  count: number;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="page-intro">
        <div className="page-intro-icon">
          <Icon name={icon} size={25} />
        </div>

        <div style={{ flex: 1 }}>
          <div className="page-title-row">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h2>{title}</h2>
              <span className="count-badge">{count}</span>
            </div>

            {action}
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
  action,
}: {
  icon: IconName;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon name={icon} size={27} />
      </div>

      <h3>{title}</h3>
      <p>{description}</p>
      {action && <div style={{ marginTop: "16px" }}>{action}</div>}
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
