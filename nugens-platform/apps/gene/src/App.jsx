import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthPage from "./pages/AuthPage";

const GenEChat       = lazy(() => import("./pages/GenEChat"));
const ResumesPage    = lazy(() => import("./pages/ResumesPage"));
const JobTrackerPage = lazy(() => import("./pages/JobTrackerPage"));
const PricingPage    = lazy(() => import("./pages/PricingPage"));

function Spinner() {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
      height:"100vh", background:"#0a0a0a" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontWeight:800, fontSize:28, fontStyle:"italic",
          color:"#e8185d", letterSpacing:"-0.04em", marginBottom:12 }}>GEN-E</div>
        <div style={{ color:"#555", fontSize:13 }}>Loading…</div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Spinner />}>
        <Routes>
          {/* Auth */}
          <Route path="/auth"   element={<AuthPage />} />
          <Route path="/login"  element={<Navigate to="/auth" replace />} />
          <Route path="/signup" element={<Navigate to="/auth?mode=signup" replace />} />

          {/* Pricing — public */}
          <Route path="/pricing" element={<PricingPage />} />

          {/* Protected app routes */}
          <Route path="/"        element={<ProtectedRoute><GenEChat /></ProtectedRoute>} />
          <Route path="/chat"    element={<ProtectedRoute><GenEChat /></ProtectedRoute>} />
          <Route path="/resumes" element={<ProtectedRoute><ResumesPage /></ProtectedRoute>} />
          <Route path="/jobs"    element={<ProtectedRoute><JobTrackerPage /></ProtectedRoute>} />

          {/* Catch all → main app */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
