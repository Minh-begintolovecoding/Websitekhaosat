/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ExperimentProvider } from './context/ExperimentContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { LandingPage } from './pages/LandingPage.tsx';
import { ProductPage } from './pages/ProductPage.tsx';
import { CartPage } from './pages/CartPage.tsx';
import { SurveyPage } from './pages/SurveyPage.tsx';
import { ThankYouPage } from './pages/ThankYouPage.tsx';
import { AdminDashboard } from './pages/AdminDashboard.tsx';
import { ResearcherSandbox } from './pages/ResearcherSandbox.tsx';

export default function App() {
  return (
    <BrowserRouter>
      <ExperimentProvider>
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-slate-900 selection:text-white">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/product" element={<ProductPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/survey" element={<SurveyPage />} />
              <Route path="/thank-you" element={<ThankYouPage />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/sandbox" element={<ResearcherSandbox />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
            <div className="max-w-6xl mx-auto px-4">
              <p>
                Academic Research Platform for Structural Equation Modeling (SEM) | Based on Witte et al. (2025)
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Compatible with SPSS, AMOS, SmartPLS, R (lavaan), and Python (semopy).
              </p>
            </div>
          </footer>
        </div>
      </ExperimentProvider>
    </BrowserRouter>
  );
}
