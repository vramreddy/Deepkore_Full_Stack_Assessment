import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('smartops_admin_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('smartops_admin_token') || localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/auth/me');
      if (res.data.user.role !== 'admin') {
        localStorage.removeItem('smartops_admin_token');
        localStorage.removeItem('smartops_admin_user');
        setUser(null);
        toast.error('Access restricted to Administrators only.');
      } else {
        setUser(res.data.user);
        localStorage.setItem('smartops_admin_token', token);
        localStorage.setItem('smartops_admin_user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      localStorage.removeItem('smartops_admin_token');
      localStorage.removeItem('smartops_admin_user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.user.role !== 'admin') {
      throw new Error('Access denied. Only Administrator accounts can log in to the Admin Console.');
    }
    localStorage.setItem('smartops_admin_token', res.data.token);
    localStorage.setItem('smartops_admin_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    toast.success(`Welcome to Admin Console, ${res.data.user.name}`);
    return res.data;
  };

  const googleLogin = async (googleProfile) => {
    const res = await api.post('/auth/google', googleProfile);
    if (res.data.user.role !== 'admin') {
      throw new Error('Access denied. This Google account is not configured with Administrator privileges.');
    }
    localStorage.setItem('smartops_admin_token', res.data.token);
    localStorage.setItem('smartops_admin_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    toast.success(`Welcome to Admin Console, ${res.data.user.name}`);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('smartops_admin_token');
    localStorage.removeItem('smartops_admin_user');
    setUser(null);
    toast.success('Logged out from Admin Console');
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        loading,
        login,
        googleLogin,
        logout,
        isAuthenticated: !!user && user.role === 'admin',
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
