import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { apiService, AdminUser, AdminUsersResponse } from '../services/api';

// Interfaces para las reservas
interface Reservation {
  id: number;
  user_id: number;
  field_id: number;
  field_name: string;
  field_location: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  total_price: number;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
  cancelled_by?: number;
}

interface ReservationsResponse {
  reservations: Reservation[];
  total: number;
  page: number;
  size: number;
}

interface UserStats {
  totalReservations: number;
  totalSpent: number;
  confirmedReservations: number;
  cancelledReservations: number;
}

const AdminUsers: React.FC = () => {
  const { user } = useAuth();
  
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [userStats, setUserStats] = useState<Record<number, UserStats>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingReservations, setIsLoadingReservations] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<boolean | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadUsers();
    loadReservations();
  }, [currentPage, selectedRole, selectedStatus]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Calcular estadísticas cuando cambien las reservas
  useEffect(() => {
    calculateUserStats();
  }, [reservations]);

  const loadUsers = async () => {
    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Token de autenticación no encontrado');
        setIsLoading(false);
        return;
      }

      const role = selectedRole === 'all' ? undefined : selectedRole;
      const isActive = selectedStatus;

      const usersResponse = await apiService.getAdminUsers(
        token,
        currentPage,
        20,
        role,
        isActive
      );

      console.log('Admin users response:', usersResponse);

      if (usersResponse && usersResponse.users) {
        setUsers(usersResponse.users);
        setTotalPages(Math.ceil(usersResponse.total / 20));
      }

    } catch (err: any) {
      console.error('Error loading users:', err);
      setError(err.message || 'Error al cargar los usuarios');
    } finally {
      setIsLoading(false);
    }
  };

  const loadReservations = async () => {
    setIsLoadingReservations(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('Token de autenticación no encontrado para reservas');
        return;
      }

      const reservationsData = await apiService.getReservations(token);

      if (reservationsData && reservationsData.reservations) {
        setReservations(reservationsData.reservations);
      }

    } catch (err: any) {
      console.error('Error loading reservations:', err);
    } finally {
      setIsLoadingReservations(false);
    }
  };

  const calculateUserStats = () => {
    const stats: Record<number, UserStats> = {};

    // Inicializar stats para todos los usuarios
    users.forEach(user => {
      stats[user.id] = {
        totalReservations: 0,
        totalSpent: 0,
        confirmedReservations: 0,
        cancelledReservations: 0,
      };
    });

    // Calcular estadísticas basadas en las reservas
    reservations.forEach(reservation => {
      const userId = reservation.user_id;
      
      if (stats[userId]) {
        stats[userId].totalReservations++;
        
        if (reservation.status === 'confirmada') {
          stats[userId].confirmedReservations++;
          stats[userId].totalSpent += reservation.total_price;
        } else if (reservation.status === 'cancelada') {
          stats[userId].cancelledReservations++;
        }
      }
    });

    setUserStats(stats);
  };

  // Filtrar usuarios por término de búsqueda
  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Formatear dinero
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Obtener color del rol
  const getRoleColor = (isAdmin: boolean) => {
    return isAdmin 
      ? 'bg-purple-100 text-purple-800'
      : 'bg-gray-100 text-gray-800';
  };

  // Obtener color del estado
  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  // Cambiar página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Filtro de rol
  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    setCurrentPage(1);
  };

  // Filtro de estado
  const handleStatusChange = (status: boolean | undefined) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando usuarios...</p>
          {isLoadingReservations && (
            <p className="mt-2 text-sm text-gray-500">Calculando estadísticas de reservas...</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
                <p className="text-gray-600 text-sm md:text-base">Administración de usuarios del sistema</p>
              </div>
            </div>
            
            {/* Desktop Menu Dropdown */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
                >
                  <span>🏠 Menú Admin</span>
                  <svg className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="py-1">
                      <Link
                        to="/admin/dashboard"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <span className="mr-3">📊</span>
                        Dashboard Admin
                      </Link>
                      <Link
                        to="/admin"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <span className="mr-3">⚙️</span>
                        Panel Admin
                      </Link>
                      <Link
                        to="/admin/reservations"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <span className="mr-3">📋</span>
                        Ver Reservas
                      </Link>
                      <div className="border-t border-gray-100"></div>
                      <Link
                        to="/dashboard"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <span className="mr-3">🏟️</span>
                        Dashboard Usuario
                      </Link>
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <span className="mr-3">👤</span>
                        Mi Perfil
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="bg-gray-100 p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <span className="sr-only">Abrir menú principal</span>
                {!mobileMenuOpen ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 pt-4 pb-4">
              <div className="space-y-1">
                <Link
                  to="/admin/dashboard"
                  className="block px-4 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  📊 Dashboard Admin
                </Link>
                <Link
                  to="/admin"
                  className="block px-4 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  ⚙️ Panel Admin
                </Link>
                <Link
                  to="/admin/reservations"
                  className="block px-4 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  📋 Ver Reservas
                </Link>
                <div className="border-t border-gray-200 my-2"></div>
                <Link
                  to="/dashboard"
                  className="block px-4 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  🏟️ Dashboard Usuario
                </Link>
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  👤 Mi Perfil
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Mensaje de error */}
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Filtros y búsqueda */}
          <div className="bg-white rounded-lg shadow mb-6 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Filtros y Búsqueda</h3>
              {isLoadingReservations && (
                <div className="flex items-center text-sm text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Calculando estadísticas...
                </div>
              )}
            </div>
            
            {/* Barra de búsqueda */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Buscar Usuario</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre de usuario o email..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Filtro por rol */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">🏷️ Rol</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleRoleChange('all')}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      selectedRole === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    📋 Todos
                  </button>
                  <button
                    onClick={() => handleRoleChange('admin')}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      selectedRole === 'admin'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    🔧 Administradores
                  </button>
                  <button
                    onClick={() => handleRoleChange('user')}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      selectedRole === 'user'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    👤 Usuarios
                  </button>
                </div>
              </div>

              {/* Filtro por estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">📊 Estado</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleStatusChange(undefined)}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      selectedStatus === undefined
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    📋 Todos
                  </button>
                  <button
                    onClick={() => handleStatusChange(true)}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      selectedStatus === true
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    ✅ Activos
                  </button>
                  <button
                    onClick={() => handleStatusChange(false)}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      selectedStatus === false
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    ❌ Inactivos
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de usuarios */}
          {filteredUsers.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-gray-500 mb-4">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron usuarios</h3>
              <p className="text-gray-600">No hay usuarios que coincidan con los filtros seleccionados.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Usuarios ({filteredUsers.length} de {users.length})
                </h3>
              </div>
              
              {/* Tabla de usuarios para pantallas grandes */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">👤 Usuario</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🏷️ Rol</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📊 Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📅 Reservas</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">💰 Total Gastado</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.username}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            <div className="text-xs text-gray-400">ID: {user.id}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(user.is_admin)}`}>
                            {user.is_admin ? '🔧 Administrador' : '👤 Usuario'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(user.is_active)}`}>
                            {user.is_active ? '✅ Activo' : '❌ Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex flex-col">
                            <span className="font-medium">{userStats[user.id]?.totalReservations || 0}</span>
                            <span className="text-xs text-gray-500">
                              {userStats[user.id]?.confirmedReservations || 0} confirmadas, {userStats[user.id]?.cancelledReservations || 0} canceladas
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="flex flex-col">
                            <span className="text-green-600 font-semibold">{formatCurrency(userStats[user.id]?.totalSpent || 0)}</span>
                            {isLoadingReservations && (
                              <span className="text-xs text-gray-400">Calculando...</span>
                            )}
                          </div>
                        </td>        
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards para pantallas pequeñas */}
              <div className="md:hidden divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">👤 {user.username}</h4>
                        <p className="text-sm text-gray-500">📧 {user.email}</p>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(user.is_admin)}`}>
                          {user.is_admin ? '🔧 Admin' : '👤 Usuario'}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(user.is_active)}`}>
                          {user.is_active ? '✅ Activo' : '❌ Inactivo'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">📅 Reservas</p>
                        <p className="font-medium">{userStats[user.id]?.totalReservations || 0}</p>
                        <p className="text-xs text-gray-400">
                          {userStats[user.id]?.confirmedReservations || 0} confirmadas
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">💰 Total Gastado</p>
                        <p className="font-medium text-green-600">{formatCurrency(userStats[user.id]?.totalSpent || 0)}</p>
                        {isLoadingReservations && (
                          <p className="text-xs text-gray-400">Calculando...</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="bg-white rounded-lg shadow mt-6 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Página {currentPage} de {totalPages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-700 px-3 py-1 rounded-md text-sm disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = Math.max(1, currentPage - 2) + i;
                    if (page > totalPages) return null;
                    
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 rounded-md text-sm ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-700 px-3 py-1 rounded-md text-sm disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Resumen de estadísticas */}
          {!isLoadingReservations && Object.keys(userStats).length > 0 && (
            <div className="bg-white rounded-lg shadow mt-6 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Resumen General</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {Object.values(userStats).reduce((sum, stats) => sum + stats.totalReservations, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Reservas</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(Object.values(userStats).reduce((sum, stats) => sum + stats.totalSpent, 0))}
                  </div>
                  <div className="text-sm text-gray-600">Ingresos Totales</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {Object.values(userStats).reduce((sum, stats) => sum + stats.confirmedReservations, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Reservas Confirmadas</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {Object.values(userStats).reduce((sum, stats) => sum + stats.cancelledReservations, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Reservas Canceladas</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminUsers;
