import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";

const About       = lazy(() => import("./pages/About"));
const Blog        = lazy(() => import("./pages/Blog"));
const Careers     = lazy(() => import("./pages/Careers"));
const Contact     = lazy(() => import("./pages/Contact"));
const Support     = lazy(() => import("./pages/Support"));
const GenE        = lazy(() => import("./pages/GenE"));
const HyperX      = lazy(() => import("./pages/HyperX"));
const DigiHub     = lazy(() => import("./pages/DigiHub"));
const AuthPage    = lazy(() => import("./pages/AuthPage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const Dashboard   = lazy(() => import("./pages/Dashboard"));

function Spinner() {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"60vh" }}>
      <div style={{ fontWeight:800, fontSize:24, color:"#e8185d", fontStyle:"italic", letterSpacing:"-0.04em" }}>NuGens</div>
    </div>
  );
}

function Layout({ children }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Spinner />}>
        <Routes>
          {/* ── Public pages with Header + Footer ── */}
          <Route path="/"         element={<Layout><Home /></Layout>} />
          <Route path="/about"    element={<Layout><About /></Layout>} />
          <Route path="/blog"     element={<Layout><Blog /></Layout>} />
          <Route path="/blog/:id" element={<Layout><Blog /></Layout>} />
          <Route path="/careers"  element={<Layout><Careers /></Layout>} />
          <Route path="/contact"  element={<Layout><Contact /></Layout>} />
          <Route path="/support"  element={<Layout><Support /></Layout>} />
          <Route path="/gene"     element={<Layout><GenE /></Layout>} />
          <Route path="/hyperx"   element={<Layout><HyperX /></Layout>} />
          <Route path="/digihub"  element={<Layout><DigiHub /></Layout>} />
          <Route path="/pricing"  element={<Layout><PricingPage /></Layout>} />

          {/* ── Auth (no Header/Footer) ── */}
          <Route path="/auth"   element={<AuthPage />} />
          <Route path="/login"  element={<Navigate to="/auth" replace />} />
          <Route path="/signup" element={<Navigate to="/auth?mode=signup" replace />} />

          {/* ── Protected ── */}
          <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Layout><Home /></Layout>} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
