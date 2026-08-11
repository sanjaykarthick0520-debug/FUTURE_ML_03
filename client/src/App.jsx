import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Dashboard from "./pages/Dashboard/Dashboard";
import Analysis from "./pages/Resume/Analysis";
import CompareCandidates from "./pages/Compare/CompareCandidates";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Dashboard - Home Page */}
        <Route
          path="/"
          element={<Dashboard />}
        />

        {/* Keep /dashboard working too */}
        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        {/* Individual Resume Analysis */}
        <Route
          path="/resume/:id"
          element={<Analysis />}
        />

        {/* Optional Candidate Comparison */}
        <Route
          path="/compare"
          element={<CompareCandidates />}
        />

        {/* Unknown Routes */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}