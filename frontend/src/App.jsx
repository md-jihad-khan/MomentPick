import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import CreateEvent from './pages/CreateEvent';
import EventDetail from './pages/EventDetail';
import JoinEvent from './pages/JoinEvent';
import AdminLogin from './pages/AdminLogin';
import { AuthProvider, useAuth } from './context/AuthContext';

const AdminRoute = ({ children }) => {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  return isAdmin ? children : <Navigate to="/dashboard" />;
};

function App() {
  return (
    <AuthProvider>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route 
            path="/create-event" 
            element={
              <AdminRoute>
                <CreateEvent />
              </AdminRoute>
            } 
          />
          <Route path="/event/:id" element={<EventDetail />} />
          <Route path="/join/:inviteCode" element={<JoinEvent />} />
          <Route path="/join" element={<JoinEvent />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </AuthProvider>
  );
}

export default App;
