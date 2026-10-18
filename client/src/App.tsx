import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './i18n/LanguageContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

// Pages
import { HomePage } from './pages/HomePage';
import { IssuesPage } from './pages/IssuesPage';
import { IssueDetailPage } from './pages/IssueDetailPage';
import { ReportIssuePage } from './pages/ReportIssuePage';
import { AiChatPage } from './pages/AiChatPage';
import { TrackIssuePage } from './pages/TrackIssuePage';
import { TransparencyPage } from './pages/TransparencyPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

const NotFoundPage: React.FC = () => (
  <div className="max-w-md mx-auto my-20 text-center p-8 bg-white rounded-2xl border border-slate-200 space-y-4">
    <h2 className="text-2xl font-bold text-slate-900">404 - Page Not Found</h2>
    <p className="text-xs text-slate-500">
      The civic resource or page you requested does not exist or has been relocated.
    </p>
    <Link
      to="/"
      className="inline-block px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
    >
      Return to Home
    </Link>
  </div>
);

export function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/issues" element={<IssuesPage />} />
                <Route path="/issues/:id" element={<IssueDetailPage />} />
                <Route path="/report" element={<ReportIssuePage />} />
                <Route path="/chat" element={<AiChatPage />} />
                <Route path="/track" element={<TrackIssuePage />} />
                <Route path="/track/:trackingId" element={<TrackIssuePage />} />
                <Route path="/transparency" element={<TransparencyPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
