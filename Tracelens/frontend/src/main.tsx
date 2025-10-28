import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./styles.css";
import Layout from "./ui/Layout";
import Dashboard from "./pages/Dashboard";
import LLMTracking from "./pages/LLMTracking";
import AgentWorkflow from "./pages/AgentWorkflow";
import Alerts from "./pages/Alerts";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "llm-tracking", element: <LLMTracking /> },
      { path: "agent-workflow", element: <AgentWorkflow /> },
      { path: "alerts", element: <Alerts /> },
      { path: "profile", element: <Profile /> },
    ],
  },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
