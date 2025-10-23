import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AuthCallback from './pages/AuthCallback';
import ComponentDemo from './pages/ComponentDemo';
import CompactTraderDemoV2 from './pages/CompactTraderDemoV2';
import { AIOptimizerDemo } from './pages/AIOptimizerDemo';
import OptimizerLandingPage from './pages/OptimizerLandingPage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App w-full h-full min-h-screen">
          <Routes>
            <Route path="/" element={<CompactTraderDemoV2 />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/demo" element={<ComponentDemo />} />
            <Route path="/optimizer" element={<AIOptimizerDemo />} />
            <Route path="/grid-optimizer" element={<OptimizerLandingPage />} />
            <Route path="/old" element={<LandingPage />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;