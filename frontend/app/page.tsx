"use client";

import { useState } from "react";

const API_URL = "https://cloudmind-87ph.onrender.com";

export default function Home() {
  const [active, setActive] = useState("Dashboard");
  const [apiStatus, setApiStatus] = useState("Not checked");

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

  return (
    <div className="dashboard">
      <header className="header">
        <div className="logo">
          Cloud<span>Mind</span>
        </div>

        <div className="header-status">
          ● System Online
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-title">Navigation</div>

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
                active === item ? "active" : ""
              }`}
              onClick={() => setActive(item)}
            >
              {item}
            </div>
          ))}
        </aside>

        <main className="main">
          <h1 className="page-title">
            {active}
          </h1>

          <p className="page-subtitle">
            CloudMind Cloud Management System
          </p>

          {active === "Dashboard" && (
            <>
              <div className="cards">
                <div className="card">
                  <div className="card-label">
                    Projects
                  </div>
                  <div className="card-value">
                    1
                  </div>
                </div>

                <div className="card">
                  <div className="card-label">
                    Applications
                  </div>
                  <div className="card-value">
                    1
                  </div>
                </div>

                <div className="card">
                  <div className="card-label">
                    Clusters
                  </div>
                  <div className="card-value">
                    1
                  </div>
                </div>

                <div className="card">
                  <div className="card-label">
                    Deployments
                  </div>
                  <div className="card-value">
                    1
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
                </div>
              </section>

              <section className="section">
                <div className="section-header">
                  <h2 className="section-title">
                    Recent Deployment
                  </h2>
                </div>

                <table className="table">
                  <thead>
                    <tr>
                      <th>Application</th>
                      <th>Version</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr>
                      <td>CloudMind Application</td>
                      <td>v1.0</td>
                      <td>
                        <span className="status status-success">
                          SUCCESS
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </section>
            </>
          )}

          {active !== "Dashboard" && (
            <section className="section">
              <div className="section-header">
                <h2 className="section-title">
                  {active}
                </h2>
              </div>

              <p>
                {active} management will appear here.
              </p>

              <br />

              <button
                className="button"
                onClick={() =>
                  alert(
                    `${active} module is connected to CloudMind.`
                  )
                }
              >
                Open {active}
              </button>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
