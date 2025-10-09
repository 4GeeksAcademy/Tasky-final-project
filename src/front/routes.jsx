// src/front/routes.jsx
import React from "react";
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { useStore } from "./hooks/useGlobalReducer";

import Layout from "./pages/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import ProfilePrivate from "./pages/ProfilePrivate";
import ProfilePublisher from "./pages/ProfilePublisher";
import AuthCallback from "./pages/AuthCallback";
import Browse from "./pages/Browse";
import TaskDetail from "./pages/TaskDetail";
import Help from "./pages/Help";              // ✅ Ayuda con subrutas
import MyOffers from "./components/MyOffers"; // ✅ Ofertas del usuario

// Páginas del template
import Single from "./pages/Single";
import Demo from "./pages/Demo";
import NewTask from "./pages/NewTask";
import Admin from "./pages/Admin";
import MyTasks from "./pages/MyTasks";

const DashboardClient = () => <div>Mis tareas (Cliente)</div>;
const DashboardTasker = () => <div>Mis ofertas (Proveedor)</div>;

function Protected({ role }) {
  const { store } = useStore();
  const user = store.user;

  if (!user) return <Navigate to="/login" replace />;

  if (role && user.role !== role) {
    return <Navigate to={user.role === "client" ? "/client" : "/tasker"} replace />;
  }
  return <Outlet />;
}

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      // Públicas
      { path: "/", element: <Home /> },
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
      { path: "/auth/callback", element: <AuthCallback /> },
      { path: "/u/:username", element: <ProfilePublisher /> },
      { path: "/browse", element: <Browse /> },
      { path: "/tasks/:taskId", element: <TaskDetail /> },
      { path: "/help/*", element: <Help /> },

      // Páginas del template (opcionales)
      { path: "/single/:theId", element: <Single /> },
      { path: "/demo", element: <Demo /> },
      { path: "/newtask", element: <NewTask /> },
      { path: "/admin", element: <Admin /> },

      // Extras públicas
      { path: "/myoffers", element: <MyOffers /> },       // ✅ tus ofertas

      // Privadas (requiere sesión)
      {
        element: <Protected />,
        children: [
          { path: "/account", element: <ProfilePrivate /> },
          { path: "/profile", element: <Profile /> },
          { path: "/users/:user_id/tasks", element: <MyTasks /> },
        ],
      },

      // Privadas por rol
      { element: <Protected role="client" />, children: [{ path: "/client", element: <DashboardClient /> }] },
      { element: <Protected role="tasker" />, children: [{ path: "/tasker", element: <DashboardTasker /> }] },

      // Fallback
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);