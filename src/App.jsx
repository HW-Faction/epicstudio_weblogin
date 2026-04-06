import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Projects from "./pages/Projects";
import Vendors from "./pages/Vendors";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import ProjectDetails from "./pages/ProjectDetails";
import SiteProgress from "./pages/SiteProgress";
import ProjectMilestones from "./pages/ProjectMilestones";
import ProjectOverview from "./pages/ProjectOverview";
import ProjectPayments from "./pages/ProjectPayments";
import ProjectCommunication from "./pages/ProjectCommunication";
import ProjectQuotation from "./pages/ProjectQuotation";

function Dashboard() {
  return <div>Dashboard</div>;
}

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
                <Projects />
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
  path="/projects/:id/overview"
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

      </Routes>
    </BrowserRouter>
  );
}