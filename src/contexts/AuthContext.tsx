import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService, LoginRequest, RegisterRequest } from '../services/api';

interface User {
  id: number;
  email: string;
  username: string;
  is_active: boolean;
  is_admin: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, username: string) => Promise<boolean>;
  logout: () => void;
  resetPassword: (email: string) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  updateUser: (userData: Partial<User>) => void;
  isAuthenticated: boolean;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar token almacenado al cargar la aplicación
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        // Optionally verify token with backend
        // apiService.getCurrentUser(token).then(setUser).catch(() => {
        //   localStorage.removeItem('auth_token');
        //   localStorage.removeItem('user_data');
        // });
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const loginData: LoginRequest = { email, password };
      const response = await apiService.login(loginData);
      
      // Después del login exitoso, obtenemos los datos del usuario
      const token = response.access_token;
      const currentUser = await apiService.getCurrentUser(token);
      
      const userData: User = {
        id: currentUser.id,
        email: currentUser.email,
        username: currentUser.username,
        is_active: currentUser.is_active,
        is_admin: currentUser.is_admin
      };
      
      setUser(userData);
      console.log('Login exitoso:', response);
      localStorage.setItem('auth_token', response.access_token);
      localStorage.setItem('user_data', JSON.stringify(userData));
      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Error al iniciar sesión');
      setIsLoading(false);
      return false;
    }
  };

  const signup = async (email: string, password: string, username: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const registerData: RegisterRequest = { username, email, password };
      const response = await apiService.register(registerData);
      
      const userData: User = {
        id: response.id,
        email: response.email,
        username: response.username,
        is_active: response.is_active,
        is_admin: response.is_admin
      };
      
      setUser(userData);
      // After registration, we might need to login to get token
      // For now, we'll just store user data
      localStorage.setItem('user_data', JSON.stringify(userData));
      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error('Signup error:', error);
      setError(error.message || 'Error al crear la cuenta');
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setError(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await apiService.recoverPassword(email);
      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error('Password reset error:', error);
      setError(error.message || 'Error al enviar email de recuperación');
      setIsLoading(false);
      return false;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Implement password change API call when available
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsLoading(false);
      return true;
    } catch (error: any) {
      setError(error.message || 'Error al cambiar la contraseña');
      setIsLoading(false);
      return false;
    }
  };

  const clearError = () => {
    setError(null);
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user_data', JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    error,
    login,
    signup,
    logout,
    resetPassword,
    changePassword,
    updateUser,
    isAuthenticated: !!user,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
