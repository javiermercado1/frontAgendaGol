import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { apiService, Field, FieldAvailability, ReservationCreateRequest } from '../services/api';

const NewReservation: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const fieldId = searchParams.get('field_id');
  
  const [field, setField] = useState<Field | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [availability, setAvailability] = useState<FieldAvailability | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [duration, setDuration] = useState<1 | 2>(1);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingField, setLoadingField] = useState(true);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  // Cargar información de la cancha
  useEffect(() => {
    const loadField = async () => {
      if (!fieldId) {
        setError('ID de cancha no proporcionado');
        setLoadingField(false);
        return;
      }

      try {
        // Obtener información de la cancha desde el servicio de fields
        const fieldsResponse = await apiService.getFields(localStorage.getItem('auth_token') || '');
        
        if (fieldsResponse && fieldsResponse.fields) {
          const foundField = fieldsResponse.fields.find(f => f.id === parseInt(fieldId));
          if (foundField) {
            setField(foundField);
          } else {
            setError('Cancha no encontrada');
          }
        }
      } catch (err) {
        console.error('Error loading field:', err);
        setError('Error al cargar la información de la cancha');
      } finally {
        setLoadingField(false);
      }
    };

    loadField();
  }, [fieldId]);

  // Cargar disponibilidad cuando se selecciona una fecha
  useEffect(() => {
    const loadAvailability = async () => {
      if (!fieldId || !selectedDate) return;

      setLoadingAvailability(true);
      try {
        const availabilityData = await apiService.getFieldAvailability(parseInt(fieldId), selectedDate);
        setAvailability(availabilityData);
        setSelectedTime(''); // Reset selected time
      } catch (err) {
        console.error('Error loading availability:', err);
        setError('Error al cargar la disponibilidad');
        setAvailability(null);
      } finally {
        setLoadingAvailability(false);
      }
    };

    loadAvailability();
  }, [fieldId, selectedDate]);

  // Obtener fecha mínima (hoy)
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Obtener fecha máxima (30 días desde hoy)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (!fieldId || !selectedDate || !selectedTime) {
      setError('Por favor completa todos los campos requeridos');
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Token de autenticación no encontrado');
        setIsLoading(false);
        return;
      }

      // Construir el datetime en formato ISO
      const startDateTime = `${selectedDate}T${selectedTime}:00`;

      const reservationData: ReservationCreateRequest = {
        field_id: parseInt(fieldId),
        start_time: startDateTime,
        duration_hours: duration,
        notes: notes.trim() || undefined
      };

      console.log('Creating reservation:', reservationData);

      const reservation = await apiService.createReservation(reservationData, token);
      console.log('Reservation created:', reservation);

      setSuccess('¡Reserva creada exitosamente!');
      
      // Redirigir a mis reservas después de 2 segundos
      setTimeout(() => {
        navigate('/reservations');
      }, 2000);

    } catch (err: any) {
      console.error('Error creating reservation:', err);
      setError(err.message || 'Error al crear la reserva');
    } finally {
      setIsLoading(false);
    }
  };

  if (!fieldId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">ID de cancha no proporcionado.</p>
          <Link
            to="/fields"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Volver a Canchas
          </Link>
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
              <h1 className="text-3xl font-bold text-gray-900">Nueva Reserva</h1>
              <p className="text-gray-600">Reserva una cancha para tu partido</p>
            </div>
            <div className="flex space-x-4">
              <Link
                to="/fields"
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Volver a Canchas
              </Link>
              <Link
                to="/reservations"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Mis Reservas
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Mensajes de estado */}
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}

          {/* Información de la cancha */}
          {loadingField ? (
            <div className="bg-white rounded-lg shadow mb-6 p-6">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ) : field ? (
            <div className="bg-white rounded-lg shadow mb-6 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{field.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <p><strong>Ubicación:</strong> {field.location}</p>
                  <p><strong>Capacidad:</strong> {field.capacity} jugadores</p>
                </div>
                <div>
                  <p><strong>Precio:</strong> ${field.price_per_hour}/hora</p>
                  <p><strong>Horario:</strong> {field.opening_time} - {field.closing_time}</p>
                </div>
              </div>
              {field.description && (
                <p className="mt-4 text-gray-700">{field.description}</p>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow mb-6 p-6">
              <p className="text-red-600">Cancha no encontrada</p>
            </div>
          )}

          {/* Formulario de reserva */}
          {field && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Detalles de la Reserva</h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Selección de fecha */}
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de la Reserva *
                  </label>
                  <input
                    type="date"
                    id="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={getTodayDate()}
                    max={getMaxDate()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Puedes reservar hasta 30 días de anticipación
                  </p>
                </div>

                {/* Horarios disponibles */}
                {selectedDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Horario Disponible *
                    </label>
                    
                    {loadingAvailability ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Cargando disponibilidad...</p>
                      </div>
                    ) : availability && availability.available_hours.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {availability.available_hours.map((hour) => (
                          <label key={hour} className="relative">
                            <input
                              type="radio"
                              name="time"
                              value={hour}
                              checked={selectedTime === hour}
                              onChange={(e) => setSelectedTime(e.target.value)}
                              className="sr-only"
                            />
                            <div className={`p-3 text-center rounded-md border-2 cursor-pointer transition-colors ${
                              selectedTime === hour
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                            }`}>
                              {hour}
                            </div>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        No hay horarios disponibles para esta fecha
                      </div>
                    )}
                  </div>
                )}

                {/* Duración */}
                {selectedTime && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duración *
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <label className="relative">
                        <input
                          type="radio"
                          name="duration"
                          value={1}
                          checked={duration === 1}
                          onChange={(e) => setDuration(1)}
                          className="sr-only"
                        />
                        <div className={`p-4 text-center rounded-md border-2 cursor-pointer transition-colors ${
                          duration === 1
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                        }`}>
                          <div className="font-semibold">1 Hora</div>
                          <div className="text-sm">${field.price_per_hour}</div>
                        </div>
                      </label>
                      
                      <label className="relative">
                        <input
                          type="radio"
                          name="duration"
                          value={2}
                          checked={duration === 2}
                          onChange={(e) => setDuration(2)}
                          className="sr-only"
                        />
                        <div className={`p-4 text-center rounded-md border-2 cursor-pointer transition-colors ${
                          duration === 2
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                        }`}>
                          <div className="font-semibold">2 Horas</div>
                          <div className="text-sm">${field.price_per_hour * 2}</div>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* Notas */}
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                    Notas (Opcional)
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Información adicional sobre tu reserva..."
                  />
                </div>

                {/* Resumen y botón */}
                {selectedTime && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Resumen de la Reserva</h4>
                    <div className="text-sm space-y-1">
                      <p><strong>Cancha:</strong> {field.name}</p>
                      <p><strong>Fecha:</strong> {new Date(selectedDate).toLocaleDateString('es-ES', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</p>
                      <p><strong>Horario:</strong> {selectedTime} - {
                        new Date(`2000-01-01T${selectedTime}`).getHours() + duration
                      }:00</p>
                      <p><strong>Duración:</strong> {duration} hora{duration > 1 ? 's' : ''}</p>
                      <p><strong>Total:</strong> ${field.price_per_hour * duration}</p>
                    </div>
                  </div>
                )}

                {/* Botones */}
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={isLoading || !selectedDate || !selectedTime}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Creando Reserva...' : 'Confirmar Reserva'}
                  </button>
                  
                  <Link
                    to="/fields"
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium text-center"
                  >
                    Cancelar
                  </Link>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default NewReservation;
