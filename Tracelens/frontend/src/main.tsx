import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./styles.css";
import Layout from "./ui/Layout";
import Dashboard from "./pages/Dashboard";
import LLMTracking from "./pages/LLMTracking";
import AgentWorkflow from "./pages/AgentWorkflow";
import Alerts from "./pages/Alerts";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "llm-tracking", element: <LLMTracking /> },
      { path: "agent-workflow", element: <AgentWorkflow /> },
      { path: "alerts", element: <Alerts /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
