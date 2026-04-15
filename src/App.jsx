import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Projects from "./pages/Projects";
import Vendors from "./pages/Vendors";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import ProjectDetails from "./pages/ProjectOverview";
import SiteProgress from "./pages/SiteProgress";
import ProjectMilestones from "./pages/ProjectMilestones";
import ProjectOverview from "./pages/ProjectDetails";
import ProjectPayments from "./pages/ProjectPayments";
import ProjectCommunication from "./pages/ProjectCommunication";
import ProjectQuotation from "./pages/ProjectQuotation";
import Dashboard from "./pages/dashboard/Dashboard";
import Settings from "./pages/Settings";
import Tasks from "./pages/Tasks";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public */}
        <Route path="/" element={<Login />} />

        {/* Protected with Layout */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Projects />
              </AppLayout>
            </ProtectedRoute>
          }
        />
   
        <Route
          path="/projects/:id"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ProjectDetails />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:id/site-progress"
          element={
            <ProtectedRoute>
              <AppLayout>
                <SiteProgress />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:id/milestones"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ProjectMilestones />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:id/details"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ProjectOverview />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:id/payments"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ProjectPayments />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:id/comms"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ProjectCommunication />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:id/quotation"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ProjectQuotation />
              </AppLayout>
            </ProtectedRoute>
          }
        />

      <Route
        path="/vendors"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Vendors />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Settings />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Tasks />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      </Routes>
    </BrowserRouter>
  );
}