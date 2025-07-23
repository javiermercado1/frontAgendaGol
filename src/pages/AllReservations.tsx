import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { apiService, Reservation, Field } from '../services/api';

const AllReservations: React.FC = () => {
  const { user } = useAuth();
  
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedField, setSelectedField] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cargar datos
  useEffect(() => {
    loadData();
  }, [currentPage, selectedStatus, selectedField, selectedUser]);

  // Cargar campos una sola vez
  useEffect(() => {
    loadFields();
  }, []);

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

  const loadFields = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const fieldsResponse = await apiService.getFields(token);
      if (fieldsResponse && fieldsResponse.fields) {
        setFields(fieldsResponse.fields);
      }
    } catch (err) {
      console.error('Error loading fields:', err);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Token de autenticación no encontrado');
        setIsLoading(false);
        return;
      }

      // Preparar parámetros
      const fieldId = selectedField === 'all' ? undefined : parseInt(selectedField);
      const userId = selectedUser ? parseInt(selectedUser) : undefined;
      const status = selectedStatus === 'all' ? undefined : selectedStatus;

      const reservationsResponse = await apiService.getReservations(
        token,
        currentPage,
        10,
        status,
        fieldId,
        userId
      );

      console.log('All reservations response:', reservationsResponse);

      if (reservationsResponse && reservationsResponse.reservations) {
        setReservations(reservationsResponse.reservations);
        setTotalPages(Math.ceil(reservationsResponse.total / 10));
      }

    } catch (err: any) {
      console.error('Error loading reservations:', err);
      setError(err.message || 'Error al cargar las reservas');
    } finally {
      setIsLoading(false);
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Formatear hora
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtener color de estado
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmada':
        return 'bg-green-100 text-green-800';
      case 'cancelada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Traducir estado
  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmada':
        return 'Confirmada';
      case 'cancelada':
        return 'Cancelada';
      default:
        return status;
    }
  };

  // Verificar si se puede cancelar la reserva
  const canCancelReservation = (reservation: Reservation) => {
    const now = new Date();
    const startTime = new Date(reservation.start_time);
    const timeDiff = startTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    return reservation.status.toLowerCase() === 'confirmada' && hoursDiff > 2;
  };

  // Cancelar reserva (como admin)
  const handleCancelReservation = async (reservationId: number) => {
    if (!window.confirm('¿Estás seguro de que quieres cancelar esta reserva?')) {
      return;
    }

    setCancellingId(reservationId);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Token de autenticación no encontrado');
        return;
      }

      await apiService.cancelReservation(reservationId, 'Cancelada por administrador', token);
      
      // Recargar las reservas
      await loadData();
      
    } catch (err: any) {
      console.error('Error cancelling reservation:', err);
      setError(err.message || 'Error al cancelar la reserva');
    } finally {
      setCancellingId(null);
    }
  };

  // Cambiar página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Filtro de estado
  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  // Filtro de cancha
  const handleFieldChange = (fieldId: string) => {
    setSelectedField(fieldId);
    setCurrentPage(1);
  };

  // Filtro de usuario
  const handleUserChange = (userId: string) => {
    setSelectedUser(userId);
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando reservas...</p>
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
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Gestión de Reservas</h1>
              <p className="text-gray-600 text-sm md:text-base">Administración de todas las reservas del sistema</p>
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
                        to="/admin/users"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <span className="mr-3">👥</span>
                        Gestionar Usuarios
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
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="bg-gray-100 p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <span className="sr-only">Abrir menú principal</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Mobile Menu Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-4 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="py-1">
                    <Link
                      to="/admin/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      onClick={() => setDropdownOpen(false)}
                    >
                      📊 Dashboard Admin
                    </Link>
                    <Link
                      to="/admin"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      onClick={() => setDropdownOpen(false)}
                    >
                      ⚙️ Panel Admin
                    </Link>
                    <Link
                      to="/admin/users"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      onClick={() => setDropdownOpen(false)}
                    >
                      👥 Gestionar Usuarios
                    </Link>
                    <div className="border-t border-gray-100"></div>
                    <Link
                      to="/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      onClick={() => setDropdownOpen(false)}
                    >
                      🏟️ Dashboard Usuario
                    </Link>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      onClick={() => setDropdownOpen(false)}
                    >
                      👤 Mi Perfil
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
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

          {/* Filtros */}
          <div className="bg-white rounded-lg shadow mb-6 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h3>
            
            {/* Filtros de estado */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleStatusChange('all')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    selectedStatus === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Todas
                </button>
                <button
                  onClick={() => handleStatusChange('confirmada')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    selectedStatus === 'confirmada'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Confirmadas
                </button>
                <button
                  onClick={() => handleStatusChange('cancelada')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    selectedStatus === 'cancelada'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Canceladas
                </button>
              </div>
            </div>

            {/* Filtros adicionales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Filtro por cancha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cancha</label>
                <select
                  value={selectedField}
                  onChange={(e) => handleFieldChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Todas las canchas</option>
                  {fields.map((field) => (
                    <option key={field.id} value={field.id.toString()}>
                      {field.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por ID de usuario */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ID Usuario</label>
                <input
                  type="number"
                  value={selectedUser}
                  onChange={(e) => handleUserChange(e.target.value)}
                  placeholder="Filtrar por ID de usuario"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Lista de reservas */}
          {reservations.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-gray-500 mb-4">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay reservas</h3>
              <p className="text-gray-600 mb-4">
                No se encontraron reservas con los filtros seleccionados.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reservations.map((reservation) => (
                <div key={reservation.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    
                    {/* Información principal */}
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 mr-4">
                          {reservation.field_name}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}>
                          {getStatusText(reservation.status)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <p><strong>Fecha:</strong> {formatDate(reservation.start_time)}</p>
                          <p><strong>Horario:</strong> {formatTime(reservation.start_time)} - {formatTime(reservation.end_time)}</p>
                        </div>
                        <div>
                          <p><strong>Duración:</strong> {reservation.duration_hours} hora{reservation.duration_hours > 1 ? 's' : ''}</p>
                          <p><strong>Total:</strong> ${reservation.total_price}</p>
                        </div>
                        <div>
                          <p><strong>Usuario ID:</strong> {reservation.user_id}</p>
                          {reservation.user && (
                            <p><strong>Usuario:</strong> {reservation.user.username}</p>
                          )}
                        </div>
                      </div>

                      <p className="mt-2 text-sm text-gray-600">
                        <strong>Ubicación:</strong> {reservation.field_location}
                      </p>

                      {reservation.notes && (
                        <p className="mt-2 text-sm text-gray-700">
                          <strong>Notas:</strong> {reservation.notes}
                        </p>
                      )}

                      <div className="mt-2 text-xs text-gray-500 space-y-1">
                        <p>Reserva #{reservation.id} - Creada: {new Date(reservation.created_at).toLocaleString('es-ES')}</p>
                        {reservation.cancelled_at && (
                          <p>Cancelada: {new Date(reservation.cancelled_at).toLocaleString('es-ES')}</p>
                        )}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="mt-4 lg:mt-0 lg:ml-6 flex flex-col space-y-2">
                      {canCancelReservation(reservation) && (
                        <button
                          onClick={() => handleCancelReservation(reservation.id)}
                          disabled={cancellingId === reservation.id}
                          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium disabled:cursor-not-allowed"
                        >
                          {cancellingId === reservation.id ? 'Cancelando...' : 'Cancelar Reserva'}
                        </button>
                      )}
                      
                      <Link
                        to={`/reservations/new?field_id=${reservation.field_id}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium text-center"
                      >
                        Ver Cancha
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
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
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
                  ))}
                  
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
        </div>
      </main>
    </div>
  );
};

export default AllReservations;
