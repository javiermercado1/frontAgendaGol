import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { 
  apiService, 
  AdminDashboardStats, 
  FieldStatsResponse, 
  DailyRevenue, 
  HealthCheckResponse,
  AdminReservationsResponse 
} from '../services/api';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [fieldStats, setFieldStats] = useState<FieldStatsResponse | null>(null);
  const [revenueData, setRevenueData] = useState<DailyRevenue | null>(null);
  const [healthData, setHealthData] = useState<HealthCheckResponse | null>(null);
  const [reservationsData, setReservationsData] = useState<AdminReservationsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'fields' | 'revenue' | 'health'>('overview');
  const [revenueDays, setRevenueDays] = useState(30);
  const [selectedFieldId, setSelectedFieldId] = useState<number | undefined>(undefined);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (selectedTab === 'revenue') {
      loadRevenueData();
    } else if (selectedTab === 'fields') {
      loadReservationsData();
    }
  }, [selectedTab, revenueDays, selectedFieldId]);

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

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Token de autenticación no encontrado');
        return;
      }

      // Cargar datos en paralelo
      const [dashboardStats, fieldsStats, healthCheck] = await Promise.all([
        apiService.getAdminDashboardStats(token),
        apiService.getFieldsStats(token),
        apiService.getHealthCheck(token)
      ]);

      setStats(dashboardStats);
      setFieldStats(fieldsStats);
      setHealthData(healthCheck);

    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError(err.message || 'Error al cargar los datos del dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRevenueData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const revenue = await apiService.getDailyRevenue(token, revenueDays);
      setRevenueData(revenue);
    } catch (err: any) {
      console.error('Error loading revenue data:', err);
    }
  };

  const loadReservationsData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const reservations = await apiService.getAdminReservations(
        token,
        1, // page
        50, // limit - más reservas para tener mejor vista
        undefined, // status - todas las reservas
        selectedFieldId // field_id si se selecciona una cancha específica
      );
      setReservationsData(reservations);
    } catch (err: any) {
      console.error('Error loading reservations data:', err);
    }
  };

  // Formatear números con separadores de miles
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('es-ES').format(num);
  };

  // Formatear dinero
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Obtener color del estado de salud
  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Calcular porcentaje
  const calculatePercentage = (value: number, total: number): number => {
    return total > 0 ? (value / total) * 100 : 0;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard administrativo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar el dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Reintentar
          </button>
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
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
                <p className="text-gray-600 text-sm md:text-base">Estadísticas y gestión del sistema</p>
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
                        to="/admin/reservations"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <span className="mr-3">📋</span>
                        Ver Reservas
                      </Link>
                      <Link
                        to="/admin/users"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <span className="mr-3">👥</span>
                        Gestionar Usuarios
                      </Link>
                      <Link
                        to="/admin"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <span className="mr-3">⚙️</span>
                        Panel Admin
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
                  to="/admin/reservations"
                  className="block px-4 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  📋 Ver Reservas
                </Link>
                <Link
                  to="/admin/users"
                  className="block px-4 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  👥 Gestionar Usuarios
                </Link>
                <Link
                  to="/admin"
                  className="block px-4 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  ⚙️ Panel Admin
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
          
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex flex-wrap gap-2 md:gap-0 md:space-x-8">
              <button
                onClick={() => setSelectedTab('overview')}
                className={`py-2 px-3 md:px-1 border-b-2 font-medium text-sm rounded-t-md md:rounded-none flex items-center space-x-2 ${
                  selectedTab === 'overview'
                    ? 'border-blue-500 text-blue-600 bg-blue-50 md:bg-transparent'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="hidden md:inline">Resumen General</span>
                <span className="md:hidden">Resumen</span>
              </button>
              <button
                onClick={() => setSelectedTab('fields')}
                className={`py-2 px-3 md:px-1 border-b-2 font-medium text-sm rounded-t-md md:rounded-none flex items-center space-x-2 ${
                  selectedTab === 'fields'
                    ? 'border-blue-500 text-blue-600 bg-blue-50 md:bg-transparent'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="hidden md:inline">Estadísticas de Canchas</span>
                <span className="md:hidden">Canchas</span>
              </button>
              <button
                onClick={() => setSelectedTab('revenue')}
                className={`py-2 px-3 md:px-1 border-b-2 font-medium text-sm rounded-t-md md:rounded-none flex items-center space-x-2 ${
                  selectedTab === 'revenue'
                    ? 'border-blue-500 text-blue-600 bg-blue-50 md:bg-transparent'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Ingresos</span>
              </button>
              <button
                onClick={() => setSelectedTab('health')}
                className={`py-2 px-3 md:px-1 border-b-2 font-medium text-sm rounded-t-md md:rounded-none flex items-center space-x-2 ${
                  selectedTab === 'health'
                    ? 'border-blue-500 text-blue-600 bg-blue-50 md:bg-transparent'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="hidden md:inline">Estado del Sistema</span>
                <span className="md:hidden">Estado</span>
              </button>
            </nav>
          </div>

          {/* Overview Tab */}
          {selectedTab === 'overview' && stats && (
            <div className="space-y-6">
              {/* Estadísticas principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Usuarios</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats?.general_stats ? formatNumber(stats.general_stats.total_users) : '0'}</dd>
                      </dl>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Canchas</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats?.general_stats ? formatNumber(stats.general_stats.total_fields) : '0'}</dd>
                      </dl>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Reservas</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats?.general_stats ? formatNumber(stats.general_stats.total_reservations) : '0'}</dd>
                      </dl>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-600 rounded-md flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Ingresos Totales</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats?.general_stats ? formatCurrency(stats.general_stats.total_revenue) : '$0'}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Estadísticas adicionales */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas del Sistema</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats?.general_stats ? formatNumber(stats.general_stats.active_fields) : '0'}</div>
                    <div className="text-sm text-gray-500">Canchas Activas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats?.general_stats ? formatNumber(stats.general_stats.active_reservations) : '0'}</div>
                    <div className="text-sm text-gray-500">Reservas Activas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{stats?.general_stats ? formatNumber(stats.general_stats.cancelled_reservations) : '0'}</div>
                    <div className="text-sm text-gray-500">Reservas Canceladas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats?.general_stats ? formatNumber(stats.general_stats.reservations_today) : '0'}</div>
                    <div className="text-sm text-gray-500">Reservas Hoy</div>
                  </div>
                </div>
              </div>

              {/* Actividad Reciente */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
                <div className="space-y-4">
                  {stats?.recent_activity?.latest_reservations && stats.recent_activity.latest_reservations.length > 0 ? (
                    stats.recent_activity.latest_reservations.slice(0, 5).map((reservation) => (
                      <div key={reservation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {reservation.field_name.charAt(0)}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{reservation.field_name}</p>
                            <p className="text-sm text-gray-500">{new Date(reservation.start_time).toLocaleDateString()} - {reservation.status}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-600">{formatCurrency(reservation.total_price)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      No hay reservas recientes
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Fields Tab */}
          {selectedTab === 'fields' && fieldStats && (
            <div className="space-y-6">
              {/* Resumen de canchas */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen General de Canchas</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{fieldStats ? formatNumber(fieldStats.summary.total_fields) : '0'}</div>
                    <div className="text-sm text-gray-500">Total Canchas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{fieldStats ? formatNumber(fieldStats.summary.active_fields) : '0'}</div>
                    <div className="text-sm text-gray-500">Canchas Activas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{fieldStats ? formatCurrency(fieldStats.summary.total_revenue) : '$0'}</div>
                    <div className="text-sm text-gray-500">Ingresos Totales</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{fieldStats?.summary?.most_popular_field?.field_name || 'N/A'}</div>
                    <div className="text-sm text-gray-500">Cancha Más Popular</div>
                  </div>
                </div>
              </div>

              {/* Cancha más popular */}
              {fieldStats?.summary?.most_popular_field && (
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">🏆 Cancha Más Popular</h3>
                      <div className="space-y-1">
                        <p className="text-xl font-bold">{fieldStats.summary.most_popular_field.field_name}</p>
                        <p className="text-blue-100">{fieldStats.summary.most_popular_field.field_location}</p>
                        <div className="flex items-center space-x-4 mt-3">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{fieldStats.summary.most_popular_field.total_reservations}</div>
                            <div className="text-xs text-blue-100">Reservas</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold">{formatCurrency(fieldStats.summary.most_popular_field.total_revenue)}</div>
                            <div className="text-xs text-blue-100">Ingresos</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold">{fieldStats.summary.most_popular_field.capacity}</div>
                            <div className="text-xs text-blue-100">Capacidad</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <button
                        onClick={() => setSelectedFieldId(fieldStats.summary.most_popular_field.field_id)}
                        className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-md text-sm transition-colors"
                      >
                        Ver Reservas
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Detalles por cancha */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Estadísticas Detalladas por Cancha</h3>
                    <button
                      onClick={() => {
                        loadDashboardData();
                        if (selectedTab === 'fields') {
                          loadReservationsData();
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                    >
                      Actualizar Datos
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cancha</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Reservas</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confirmadas</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Canceladas</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ingresos</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Promedio</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacidad</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {fieldStats?.fields_statistics && fieldStats.fields_statistics.length > 0 ? (
                        fieldStats.fields_statistics.map((field) => (
                          <tr key={field.field_id} className="hover:bg-gray-50 cursor-pointer" 
                              onClick={() => setSelectedFieldId(field.field_id)}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="flex items-center">
                                  <div className="text-sm font-medium text-gray-900">{field.field_name}</div>
                                  {field.is_active && (
                                    <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                      Activa
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500">{field.field_location}</div>
                                <div className="text-xs text-blue-600 mt-1">ID: {field.field_id}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div>
                                <div className="font-medium">{formatNumber(field.total_reservations)}</div>
                                <div className="text-xs text-gray-500">Esta semana: {field.weekly_reservations}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                              {formatNumber(field.confirmed_reservations)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                              {formatNumber(field.cancelled_reservations)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatCurrency(field.total_revenue)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(field.average_price)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center">
                                <span className="font-medium">{field.capacity}</span>
                                <span className="ml-1 text-xs text-gray-500">personas</span>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                            {isLoading ? 'Cargando estadísticas de canchas...' : 'No hay datos de canchas disponibles'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Filtro y lista de reservas */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Reservas Recientes</h3>
                      {selectedFieldId && (
                        <p className="text-sm text-gray-600 mt-1">
                          Mostrando reservas para: <span className="font-medium text-blue-600">
                            {fieldStats?.fields_statistics?.find(f => f.field_id === selectedFieldId)?.field_name || `Cancha ID: ${selectedFieldId}`}
                          </span>
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-4">
                      <label className="text-sm font-medium text-gray-700">Filtrar por cancha:</label>
                      <select
                        value={selectedFieldId || ''}
                        onChange={(e) => setSelectedFieldId(e.target.value ? parseInt(e.target.value) : undefined)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm min-w-[200px] focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">📋 Todas las canchas ({reservationsData?.total || 0} reservas)</option>
                        {fieldStats?.fields_statistics && fieldStats.fields_statistics.length > 0 ? (
                          fieldStats.fields_statistics.map((field) => (
                            <option key={field.field_id} value={field.field_id}>
                              🏟️ {field.field_name} - {field.field_location} ({field.total_reservations} reservas)
                            </option>
                          ))
                        ) : (
                          <option disabled>No hay canchas disponibles</option>
                        )}
                      </select>
                      {selectedFieldId && (
                        <button
                          onClick={() => setSelectedFieldId(undefined)}
                          className="text-sm text-red-600 hover:text-red-800 font-medium"
                        >
                          Limpiar filtro
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reserva</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cancha</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha y Hora</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duración</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reservationsData?.reservations && reservationsData.reservations.length > 0 ? (
                        reservationsData.reservations.map((reservation) => (
                          <tr key={reservation.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">#{reservation.id}</div>
                              <div className="text-sm text-gray-500">
                                {new Date(reservation.created_at).toLocaleDateString('es-ES')}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{reservation.username}</div>
                                <div className="text-sm text-gray-500">{reservation.user_email}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{reservation.field_name}</div>
                                <div className="text-sm text-gray-500">{reservation.field_location}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {new Date(reservation.start_time).toLocaleDateString('es-ES')}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {new Date(reservation.start_time).toLocaleTimeString('es-ES', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })} - {new Date(reservation.end_time).toLocaleTimeString('es-ES', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {reservation.duration_hours}h
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                reservation.status === 'confirmada' ? 'bg-green-100 text-green-800' :
                                reservation.status === 'cancelada' ? 'bg-red-100 text-red-800' :
                                reservation.status === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatCurrency(reservation.total_price)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                            {selectedFieldId ? 'No hay reservas para la cancha seleccionada' : 'No hay reservas disponibles'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {reservationsData && reservationsData.total > reservationsData.reservations.length && (
                  <div className="px-6 py-4 bg-gray-50 text-center">
                    <p className="text-sm text-gray-600">
                      Mostrando {reservationsData.reservations.length} de {reservationsData.total} reservas
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Revenue Tab */}
          {selectedTab === 'revenue' && (
            <div className="space-y-6">
              {/* Controles de periodo */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Ingresos Diarios</h3>
                  <div className="flex items-center space-x-4">
                    <label className="text-sm font-medium text-gray-700">Período:</label>
                    <select
                      value={revenueDays}
                      onChange={(e) => setRevenueDays(parseInt(e.target.value))}
                      className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                    >
                      <option value={7}>7 días</option>
                      <option value={15}>15 días</option>
                      <option value={30}>30 días</option>
                      <option value={60}>60 días</option>
                      <option value={90}>90 días</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Datos de ingresos */}
              {revenueData && (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="mb-4">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {formatCurrency(revenueData.total_period_revenue)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Total en los últimos {revenueData.period_days} días
                    </div>
                  </div>

                  {/* Gráfico simple de barras */}
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Ingresos por día</h4>
                    <div className="space-y-2">
                      {revenueData?.daily_revenue && Object.keys(revenueData.daily_revenue).length > 0 ? (
                        Object.entries(revenueData.daily_revenue)
                          .slice(-10) // Mostrar solo los últimos 10 días
                          .map(([date, amount]) => {
                            const maxAmount = Math.max(...Object.values(revenueData.daily_revenue));
                            const percentage = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
                            
                            return (
                              <div key={date} className="flex items-center">
                                <div className="w-20 text-xs text-gray-500">
                                  {new Date(date).toLocaleDateString('es-ES', { 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </div>
                                <div className="flex-1 mx-2">
                                  <div className="w-full bg-gray-200 rounded-full h-4">
                                    <div 
                                      className="bg-green-500 h-4 rounded-full" 
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                                <div className="w-20 text-xs text-right font-medium">
                                  {formatCurrency(amount)}
                                </div>
                              </div>
                            );
                          })
                      ) : (
                        <div className="text-center text-gray-500 py-4">
                          No hay datos de ingresos disponibles
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Health Tab */}
          {selectedTab === 'health' && healthData && (
            <div className="space-y-6">
              {/* Estado general */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Estado General del Sistema</h3>
                    <p className="text-sm text-gray-500">Última verificación: {new Date(healthData.checked_at).toLocaleString('es-ES')}</p>
                  </div>
                  <div className={`px-4 py-2 rounded-full text-sm font-medium ${getHealthColor(healthData.overall_status)}`}>
                    {healthData.overall_status === 'healthy' ? 'Saludable' : 
                     healthData.overall_status === 'degraded' ? 'Degradado' : 'No Saludable'}
                  </div>
                </div>
              </div>

              {/* Estado de servicios */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Estado de Microservicios</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {healthData?.services && Object.keys(healthData.services).length > 0 ? (
                    Object.entries(healthData.services).map(([serviceName, serviceData]) => (
                      <div key={serviceName} className="px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-3 ${
                            serviceData.status === 'healthy' ? 'bg-green-500' :
                            serviceData.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{serviceName}</div>
                            <div className="text-xs text-gray-500">
                              Tiempo de respuesta: {(serviceData.response_time * 1000).toFixed(2)}ms
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${getHealthColor(serviceData.status)}`}>
                            {serviceData.status === 'healthy' ? 'Saludable' : 
                             serviceData.status === 'degraded' ? 'Degradado' : 'No Saludable'}
                          </span>
                          <div className="text-xs text-gray-500">
                            Código: {serviceData.status_code}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-6 py-4 text-center text-gray-500">
                      No hay datos de servicios disponibles
                    </div>
                  )}
                </div>
              </div>

              {/* Servicios con problemas */}
              {healthData?.services && Object.values(healthData.services).some(s => s.status !== 'healthy') && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <h4 className="text-sm font-medium text-red-800 mb-2">Servicios con Problemas</h4>
                  <div className="space-y-2">
                    {Object.entries(healthData.services)
                      .filter(([, serviceData]) => serviceData.status !== 'healthy')
                      .map(([serviceName, serviceData]) => (
                        <div key={serviceName} className="text-sm text-red-700">
                          <strong>{serviceName}:</strong> Estado {serviceData.status} (Código: {serviceData.status_code})
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
