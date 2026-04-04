import { Navigate, Route } from "react-router-dom";

export const ClientRoutes = () => (
  <>
    <Route path="/client-dashboard" element={<Navigate to="/creator-dashboard" replace />} />
    <Route path="/client-profile" element={<Navigate to="/creator-profile" replace />} />
    <Route path="/client-subscription" element={<Navigate to="/" replace />} />
    <Route path="/client-cases" element={<Navigate to="/" replace />} />
    <Route path="/client-documents" element={<Navigate to="/" replace />} />
    <Route path="/client-consultations" element={<Navigate to="/" replace />} />
    <Route path="/client-activity-log" element={<Navigate to="/" replace />} />
  </>
);
