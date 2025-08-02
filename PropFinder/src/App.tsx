// React is used implicitly by JSX
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PropertyProvider } from './contexts/PropertyContext';
import { ChatProvider } from './contexts/ChatContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Login from './pages/Login';
import Register from './pages/Register';
import Plans from './pages/Plans';
import Analytics from './pages/Analytics';
import Notifications from './pages/Notifications';
import CreateProperty from './pages/CreateProperty';
import VerifyEmail from './pages/VerifyEmail';

function App() {
  return (
    <AuthProvider>
      <PropertyProvider>
        <ChatProvider>
          <NotificationProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <Navbar />
              <main className="pt-16">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/properties" element={<Properties />} />
                  <Route path="/properties/new" element={<CreateProperty />} />
                  <Route path="/properties/:id" element={<PropertyDetail />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/plans" element={<Plans />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/notifications" element={<Notifications />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </Router>
          </NotificationProvider>
        </ChatProvider>
      </PropertyProvider>
    </AuthProvider>
  );
}

export default App;