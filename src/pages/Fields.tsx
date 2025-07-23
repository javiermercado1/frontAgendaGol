import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService, Field, FieldCreateRequest, PaginatedFieldsResponse } from '../services/api';
import { Link } from 'react-router-dom';

const Fields: React.FC = () => {
  const { user } = useAuth();
  const [fields, setFields] = useState<Field[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [formData, setFormData] = useState<FieldCreateRequest>({
    name: '',
    location: '',
    capacity: 22,
    price_per_hour: 0,
    description: '',
    opening_time: '09:00',
    closing_time: '23:00',
    is_active: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingFields, setLoadingFields] = useState(true);

  // Cargar lista de canchas
  const loadFields = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      
      console.log('Loading fields with token:', token);
      const fieldsResponse = await apiService.getFields(token);
      console.log('Fields response:', fieldsResponse);
      console.log('Fields response type:', typeof fieldsResponse);
      console.log('Is fields response array?', Array.isArray(fieldsResponse));
      
      // El servidor devuelve directamente un objeto con la propiedad fields
      if (fieldsResponse && typeof fieldsResponse === 'object' && 'fields' in fieldsResponse) {
        console.log('Found fields property:', fieldsResponse.fields);
        
        if (Array.isArray(fieldsResponse.fields)) {
          setFields(fieldsResponse.fields);
          console.log('Fields set successfully:', fieldsResponse.fields.length, 'fields');
        } else {
          console.error('Fields property is not an array:', fieldsResponse.fields);
          setFields([]);
          setError('Error: Los campos no son un array válido');
        }
      } else {
        console.error('Response does not have fields property:', fieldsResponse);
        setFields([]);
        setError('Error: La respuesta del servidor no tiene el formato esperado');
      }
    } catch (err) {
      console.error('Error loading fields:', err);
      setError('Error al cargar las canchas');
      setFields([]); // Asegurar que fields sea un array vacío en caso de error
    } finally {
      setLoadingFields(false);
    }
  };

  useEffect(() => {
    loadFields();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' || name === 'price_per_hour' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (!formData.name || !formData.location || formData.capacity <= 0 || formData.price_per_hour <= 0) {
      setError('Por favor completa todos los campos requeridos con valores válidos');
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Token de autenticación no encontrado');
        return;
      }

      if (editingField) {
        await apiService.updateField(editingField.id, formData, token);
        setSuccess('Cancha actualizada exitosamente');
      } else {
        await apiService.createField(formData, token);
        setSuccess('Cancha creada exitosamente');
      }

      setFormData({
        name: '',
        location: '',
        capacity: 22,
        price_per_hour: 0,
        description: '',
        opening_time: '09:00',
        closing_time: '23:00',
        is_active: true
      });
      setShowCreateForm(false);
      setEditingField(null);
      
      // Recargar lista de canchas
      await loadFields();
    } catch (err: any) {
      console.error('Error saving field:', err);
      setError(err.message || 'Error al guardar la cancha');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (field: Field) => {
    setEditingField(field);
    setFormData({
      name: field.name,
      location: field.location,
      capacity: field.capacity,
      price_per_hour: field.price_per_hour,
      description: field.description || '',
      opening_time: field.opening_time || '09:00',
      closing_time: field.closing_time || '23:00',
      is_active: field.is_active
    });
    setShowCreateForm(true);
    clearMessages();
  };

  const handleDelete = async (field: Field) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar la cancha "${field.name}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Token de autenticación no encontrado');
        return;
      }

      await apiService.deleteField(field.id, token);
      setSuccess('Cancha eliminada exitosamente');
      await loadFields();
    } catch (err: any) {
      console.error('Error deleting field:', err);
      setError(err.message || 'Error al eliminar la cancha');
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      capacity: 22,
      price_per_hour: 0,
      description: '',
      opening_time: '09:00',
      closing_time: '23:00',
      is_active: true
    });
    setEditingField(null);
    setShowCreateForm(false);
    clearMessages();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Canchas</h1>
              <p className="text-gray-600">Administra las canchas disponibles para reservas</p>
            </div>
            <div className="flex space-x-4">
              {user?.is_admin && (
                <button
                  onClick={() => {
                    setShowCreateForm(!showCreateForm);
                    if (showCreateForm) resetForm();
                    else clearMessages();
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  {showCreateForm ? 'Cancelar' : 'Nueva Cancha'}
                </button>
              )}
              <Link
                to="/dashboard"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Volver al Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
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

          {/* Formulario para crear/editar cancha */}
          {showCreateForm && user?.is_admin && (
            <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  {editingField ? 'Editar Cancha' : 'Crear Nueva Cancha'}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Nombre de la Cancha *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ej: Cancha Principal"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                        Ubicación *
                      </label>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ej: Sector Norte"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
                        Capacidad (jugadores) *
                      </label>
                      <input
                        type="number"
                        id="capacity"
                        name="capacity"
                        value={formData.capacity}
                        onChange={handleInputChange}
                        min="10"
                        max="50"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="price_per_hour" className="block text-sm font-medium text-gray-700">
                        Precio por Hora (USD) *
                      </label>
                      <input
                        type="number"
                        id="price_per_hour"
                        name="price_per_hour"
                        value={formData.price_per_hour}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Descripción
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Descripción de la cancha..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="opening_time" className="block text-sm font-medium text-gray-700">
                        Hora de Apertura
                      </label>
                      <input
                        type="time"
                        id="opening_time"
                        name="opening_time"
                        value={formData.opening_time}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="closing_time" className="block text-sm font-medium text-gray-700">
                        Hora de Cierre
                      </label>
                      <input
                        type="time"
                        id="closing_time"
                        name="closing_time"
                        value={formData.closing_time}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Guardando...' : (editingField ? 'Actualizar Cancha' : 'Crear Cancha')}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Lista de canchas */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Canchas Disponibles
              </h3>
              
              {loadingFields ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Cargando canchas...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.isArray(fields) && fields.map((field) => (
                    <div key={field.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">{field.name}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          field.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {field.is_active ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <p><strong>Ubicación:</strong> {field.location}</p>
                        <p><strong>Capacidad:</strong> {field.capacity} jugadores</p>
                        <p><strong>Precio:</strong> ${field.price_per_hour}/hora</p>
                        <p><strong>Horario:</strong> {field.opening_time} - {field.closing_time}</p>
                        {field.description && (
                          <p><strong>Descripción:</strong> {field.description}</p>
                        )}
                      </div>

                      {user?.is_admin && (
                        <div className="mt-4 flex space-x-2">
                          <button
                            onClick={() => handleEdit(field)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(field)}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium"
                          >
                            Eliminar
                          </button>
                        </div>
                      )}

                      {!user?.is_admin && (
                        <div className="mt-4">
                          <Link
                            to={`/reservations/new?field_id=${field.id}`}
                            className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium text-center block"
                          >
                            Reservar Cancha
                          </Link>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {(!Array.isArray(fields) || fields.length === 0) && !loadingFields && (
                    <div className="col-span-full text-center py-8">
                      <p className="text-gray-500">
                        {!Array.isArray(fields) ? 'Error al cargar las canchas' : 'No hay canchas registradas'}
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Mensaje adicional cuando no hay campos y no está cargando */}
              {Array.isArray(fields) && fields.length === 0 && !loadingFields && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay canchas registradas</p>
                  {user?.is_admin && (
                    <button
                      onClick={() => {
                        setShowCreateForm(true);
                        clearMessages();
                      }}
                      className="mt-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Crear Primera Cancha
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Fields;
