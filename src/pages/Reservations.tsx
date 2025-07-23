import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { apiService, Reservation, Field } from '../services/api';

const Reservations: React.FC = () => {
  const { user } = useAuth();
  
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  // Cargar reservas
  useEffect(() => {
    loadData();
  }, [currentPage, selectedStatus]);

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

      // Cargar solo las reservas
      const reservationsResponse = await apiService.getMyReservations(
        token,
        currentPage,
        10, // página de 10 elementos
        selectedStatus === 'all' ? undefined : selectedStatus
      );

      console.log('Reservations response:', reservationsResponse);

      // Procesar reservas
      if (reservationsResponse && reservationsResponse.reservations) {
        setReservations(reservationsResponse.reservations);
        setTotalPages(Math.ceil(reservationsResponse.total / 10));
      }

    } catch (err: any) {
      console.error('Error loading data:', err);
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

  // Calcular hora de fin usando end_time de la respuesta
  const formatEndTime = (endTime: string) => {
    const date = new Date(endTime);
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
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelada':
        return 'bg-red-100 text-red-800';
      case 'completada':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Traducir estado
  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmada':
        return 'Confirmada';
      case 'pendiente':
        return 'Pendiente';
      case 'cancelada':
        return 'Cancelada';
      case 'completada':
        return 'Completada';
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
    
    return reservation.status.toLowerCase() === 'confirmada' && hoursDiff > 2; // 2 horas de anticipación
  };

  // Cancelar reserva
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

      await apiService.cancelReservation(reservationId, 'Cancelada por el usuario', token);
      
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
    setCurrentPage(1); // Resetear a la primera página
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
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mis Reservas</h1>
              <p className="text-gray-600">Gestiona tus reservas de canchas</p>
            </div>
            <div className="flex space-x-4">
              <Link
                to="/fields"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Reservar Cancha
              </Link>
              <Link
                to="/dashboard"
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </Link>
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

          {/* Lista de reservas */}
          {reservations.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-gray-500 mb-4">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes reservas</h3>
              <p className="text-gray-600 mb-4">
                {selectedStatus === 'all' 
                  ? 'Aún no has realizado ninguna reserva.'
                  : `No tienes reservas ${getStatusText(selectedStatus).toLowerCase()}.`}
              </p>
              <Link
                to="/fields"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Reservar Cancha
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {reservations.map((reservation) => {
                return (
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
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <p><strong>Fecha:</strong> {formatDate(reservation.start_time)}</p>
                            <p><strong>Horario:</strong> {formatTime(reservation.start_time)} - {formatEndTime(reservation.end_time)}</p>
                          </div>
                          <div>
                            <p><strong>Duración:</strong> {reservation.duration_hours} hora{reservation.duration_hours > 1 ? 's' : ''}</p>
                            <p><strong>Total:</strong> ${reservation.total_price}</p>
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

                        <p className="mt-2 text-xs text-gray-500">
                          Reserva creada: {new Date(reservation.created_at).toLocaleString('es-ES')}
                        </p>
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
                          Reservar Nuevamente
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
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

export default Reservations;
