import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

const GenEChat       = lazy(() => import("./pages/GenEChat"));
const ResumesPage    = lazy(() => import("./pages/ResumesPage"));
const JobTrackerPage = lazy(() => import("./pages/JobTrackerPage"));
const PricingPage    = lazy(() => import("./pages/PricingPage"));

function Spinner() {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#0a0a0a" }}>
      <div style={{ fontWeight:800, fontSize:28, fontStyle:"italic", color:"#e8185d", letterSpacing:"-0.04em" }}>GEN-E</div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/"        element={<ProtectedRoute><GenEChat /></ProtectedRoute>} />
          <Route path="/chat"    element={<ProtectedRoute><GenEChat /></ProtectedRoute>} />
          <Route path="/resumes" element={<ProtectedRoute><ResumesPage /></ProtectedRoute>} />
          <Route path="/jobs"    element={<ProtectedRoute><JobTrackerPage /></ProtectedRoute>} />
          <Route path="*"        element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
