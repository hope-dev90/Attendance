import { useEffect, useState } from 'react';
import Auth from './components/Auth';
import Dashboard from './components/DashBoard';
import LessonTracking from './components/LessonTracking';
import StudentAttendance from './components/StudentsAttendance';
import ToastContainer from './components/ToastNotification';
import { api } from './api';

function App() {
  const [auth, setAuth] = useState(() => api.getStoredAuth());
  const [rep, setRep] = useState(() => api.getStoredAuth()?.rep || null);
  const [activeSection, setActiveSection] = useState('dashboard');

  useEffect(() => {
    if (!auth?.accessToken) return;

    api.me()
      .then((profile) => setRep((current) => ({ ...current, ...profile })))
      .catch(() => {
        api.clearAuth();
        setAuth(null);
        setRep(null);
      });
  }, [auth?.accessToken]);

  const handleLoginSuccess = (loginData) => {
    api.saveAuth(loginData);
    setAuth(loginData);
    setRep(loginData.rep);
    setActiveSection('dashboard');
  };

  const handleLogout = async () => {
    try {
      if (auth?.accessToken) await api.logout();
    } catch {
      // Local logout should still succeed if the token is already invalid.
    } finally {
      api.clearAuth();
      setAuth(null);
      setRep(null);
      setActiveSection('dashboard');
    }
  };

  if (!auth?.accessToken) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  if (activeSection === 'teachers') {
    // class_name comes from api.me(); fall back to class_id lookup if not yet loaded
    const classNames = ['Y1A','Y1B','Y1C','Y2A','Y2B','Y2C','Y3A','Y3B','Y3C','Y3D'];
    const resolvedClass = rep?.class_name || classNames[rep?.class_id - 1] || 'Y1A';
    return (
      <LessonTracking
        monitorClass={resolvedClass}
        onBack={() => setActiveSection('dashboard')}
      />
    );
  }

  if (activeSection === 'students') {
    const classNames = ['Y1A','Y1B','Y1C','Y2A','Y2B','Y2C','Y3A','Y3B','Y3C','Y3D'];
    const resolvedClass = rep?.class_name || classNames[rep?.class_id - 1] || 'Y1A';
    return (
      <StudentAttendance
        monitorClass={resolvedClass}
        onBack={() => setActiveSection('dashboard')}
      />
    );
  }

  return (
    <>
      <ToastContainer />
      <Dashboard
        onLogout={handleLogout}
        onSectionClick={setActiveSection}
        userEmail={rep?.email}
        rep={rep}
      />
    </>
  );
}

export default App;
