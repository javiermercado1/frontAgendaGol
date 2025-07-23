const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost';

// Microservices URLs
const SERVICES = {
  auth: `${API_BASE_URL}`,
  roles: `${API_BASE_URL}`, 
  fields: `${API_BASE_URL}`,
  reservations: `${API_BASE_URL}`,
  dashboard: `${API_BASE_URL}`
};

export interface ReservationCreateRequest {
  field_id: number;
  start_time: string; // Format: "YYYY-MM-DDTHH:MM:SS"
  duration_hours: number;
  notes?: string;
}

export interface FieldAvailability {
  field_id: number;
  date: string;
  available_hours: string[];
}

export interface MyReservationsResponse {
  reservations: Reservation[];
  total: number;
  page: number;
  size: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface RegisterResponse {
  username: string;
  email: string;
  id: number;
  is_active: boolean;
  is_admin: boolean;
}

export interface UserUpdateRequest {
  username?: string;
  password?: string;
}

export interface UserCreateAdmin {
  username: string;
  email: string;
  password: string;
  is_admin?: boolean;
}

export interface UserListResponse {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  is_admin: boolean;
}

export interface PaginatedUsersResponse {
  users: UserListResponse[];
  total: number;
  page: number;
  size: number;
}

export interface PaginatedFieldsResponse {
  fields: Field[];
  total: number;
  page: number;
  size: number;
}

export interface Field {
  id: number;
  name: string;
  location: string;
  capacity: number;
  price_per_hour: number;
  is_active: boolean;
  description?: string;
  opening_time: string;
  closing_time: string;
  created_at: string;
  updated_at: string;
}

export interface FieldCreateRequest {
  name: string;
  location: string;
  capacity: number;
  price_per_hour: number;
  description?: string;
  opening_time: string;
  closing_time: string;
  is_active?: boolean;
}

export interface Reservation {
  id: number;
  field_id: number;
  user_id: number;
  start_time: string;
  duration_hours: number;
  notes?: string;
  field_name: string;
  field_location: string;
  total_price: number;
  status: 'confirmada' | 'cancelada' | 'pendiente' | 'completada';
  end_time: string;
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
  cancelled_by?: number;
  field?: Field;
  user?: { id: number; username: string; email: string; };
}

export interface ReservationCreateRequest {
  field_id: number;
  start_time: string; // Format: "2024-01-25T16:00:00"
  duration_hours: number;
  notes?: string;
}

export interface DashboardStats {
  total_users: number;
  total_fields: number;
  active_reservations: number;
  cancelled_reservations: number;
  total_revenue: number;
  recent_confirmed_reservations: Reservation[];
  recent_cancelled_reservations: Reservation[];
  field_statistics: Array<{
    field_id: number;
    field_name: string;
    total_reservations: number;
    revenue: number;
  }>;
}

// Nuevas interfaces para el dashboard administrativo
export interface AdminDashboardStats {
  general_stats: {
    total_users: number;
    total_fields: number;
    active_fields: number;
    total_reservations: number;
    active_reservations: number;
    cancelled_reservations: number;
    reservations_today: number;
    total_revenue: number;
  };
  recent_activity: {
    latest_reservations: Array<{
      id: number;
      field_id: number;
      user_id: number;
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
    }>;
    latest_cancelled: Array<{
      id: number;
      field_id: number;
      user_id: number;
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
    }>;
  };
  last_updated: string;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  is_admin: boolean;
  role: string;
  created_at: string;
  last_login?: string;
  total_reservations: number;
  total_spent: number;
}

export interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  size: number;
}

export interface AdminReservation {
  id: number;
  field_id: number;
  field_name: string;
  field_location: string;
  user_id: number;
  username: string;
  user_email: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  status: string;
  total_price: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
}

export interface AdminReservationsResponse {
  reservations: AdminReservation[];
  total: number;
  page: number;
  size: number;
}

export interface FieldStats {
  field_id: number;
  field_name: string;
  field_location: string;
  is_active: boolean;
  total_reservations: number;
  confirmed_reservations: number;
  cancelled_reservations: number;
  weekly_reservations: number;
  total_revenue: number;
  average_price: number;
  capacity: number;
}

export interface FieldStatsResponse {
  fields_statistics: FieldStats[];
  summary: {
    total_fields: number;
    active_fields: number;
    total_revenue: number;
    most_popular_field: FieldStats;
  };
}

export interface DailyRevenue {
  daily_revenue: Record<string, number>;
  period_days: number;
  total_period_revenue: number;
}

export interface ServiceHealth {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  response_time_ms: number;
  last_check: string;
  error_message?: string;
}

export interface HealthCheckResponse {
  overall_status: 'healthy' | 'unhealthy' | 'degraded';
  services: Record<string, {
    status: 'healthy' | 'unhealthy' | 'degraded';
    response_time: number;
    status_code: number;
  }>;
  checked_at: string;
}

export interface ApiError {
  detail: string | Array<{
    loc: string[];
    msg: string;
    type: string;
  }>;
}

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultHeaders: Record<string, string> = {};
    
    // Solo agregar Content-Type si hay un body
    if (options.body) {
      defaultHeaders['Content-Type'] = 'application/json';
    }
    
    const config: RequestInit = {
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log('Making request to:', url);
      console.log('Request config:', config);
      
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error response:', errorData);
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return this.makeRequestToService<LoginResponse>('auth', '/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    return this.makeRequestToService<RegisterResponse>('auth', '/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser(token: string): Promise<RegisterResponse> {
    return this.makeRequestToService<RegisterResponse>('auth', '/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async updateProfile(userData: UserUpdateRequest, token: string): Promise<RegisterResponse> {
    return this.makeRequestToService<RegisterResponse>('auth', '/auth/profile', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });
  }

  async recoverPassword(email: string): Promise<{ message: string }> {
    return this.makeRequestToService<{ message: string }>('auth', '/auth/password-recovery', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async registerAdmin(userData: UserCreateAdmin, token: string): Promise<RegisterResponse> {
    const bodyData = {
      ...userData,
      is_admin: true
    };
    
    return this.makeRequestToService<RegisterResponse>('auth', '/auth/register-admin', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(bodyData),
    });
  }

  async getAllUsers(token: string): Promise<PaginatedUsersResponse> {
    return this.makeRequestToService<PaginatedUsersResponse>('auth', '/auth/users', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  // Método para probar la conexión con el backend
  async healthCheck(): Promise<{ status: string }> {
    try {
      return await this.makeRequest<{ status: string }>('/health');
    } catch (error) {
      return { status: 'Backend not available' };
    }
  }

  // === FIELDS SERVICE METHODS ===
  async getFields(token: string): Promise<PaginatedFieldsResponse> {
    return this.makeRequestToService<PaginatedFieldsResponse>('fields', '/fields/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async createField(fieldData: FieldCreateRequest, token: string): Promise<Field> {
    return this.makeRequestToService<Field>('fields', '/fields/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(fieldData),
    });
  }

  async updateField(id: number, fieldData: Partial<FieldCreateRequest>, token: string): Promise<Field> {
    return this.makeRequestToService<Field>('fields', `/fields/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(fieldData),
    });
  }

  async deleteField(id: number, token: string): Promise<{ message: string }> {
    return this.makeRequestToService<{ message: string }>('fields', `/fields/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  // === RESERVATIONS SERVICE METHODS ===
  async getReservations(
    token: string, 
    page: number = 1, 
    limit: number = 10, 
    status?: string, 
    fieldId?: number, 
    userId?: number
  ): Promise<MyReservationsResponse> {
    const skip = (page - 1) * limit;
    const queryParams = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString()
    });
    
    if (status && status !== 'all') {
      queryParams.append('status', status);
    }
    if (fieldId) {
      queryParams.append('field_id', fieldId.toString());
    }
    if (userId) {
      queryParams.append('user_id', userId.toString());
    }

    return this.makeRequestToService<MyReservationsResponse>('reservations', `/reservations/?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async createReservation(reservationData: ReservationCreateRequest, token: string): Promise<Reservation> {
    return this.makeRequestToService<Reservation>('reservations', '/reservations/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(reservationData),
    });
  }

  async updateReservation(id: number, reservationData: Partial<ReservationCreateRequest>, token: string): Promise<Reservation> {
    return this.makeRequestToService<Reservation>('reservations', `/reservations/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(reservationData),
    });
  }

  async cancelReservation(id: number, reason: string, token: string): Promise<Reservation> {
    return this.makeRequestToService<Reservation>('reservations', `/reservations/${id}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ reason }),
    });
  }

  async checkAvailability(fieldId: number, date: string, startTime: string, duration: number, token: string): Promise<{ available: boolean }> {
    return this.makeRequestToService<{ available: boolean }>('reservations', `/reservations/availability?field_id=${fieldId}&date=${date}&start_time=${startTime}&duration=${duration}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  // Obtener disponibilidad de una cancha en una fecha específica
  async getFieldAvailability(fieldId: number, date: string): Promise<FieldAvailability> {
    return this.makeRequestToService<FieldAvailability>('fields', `/fields/${fieldId}/availability?date=${date}`, {
      method: 'GET',
    });
  }

  // Obtener mis reservas
  async getMyReservations(token: string, skip = 0, limit = 10, status?: string): Promise<MyReservationsResponse> {
    let url = `/reservations/my?skip=0&limit=${limit}`;
    if (status) {
      url += `&status=${status}`;
    }

    return this.makeRequestToService<MyReservationsResponse>('reservations', url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  // Obtener una reserva específica
  async getReservation(reservationId: number, token: string): Promise<Reservation> {
    return this.makeRequestToService<Reservation>('reservations', `/reservations/${reservationId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  // Obtener reservas de una cancha en fecha específica
  async getFieldReservations(fieldId: number, date: string): Promise<Reservation[]> {
    return this.makeRequestToService<Reservation[]>('reservations', `/reservations/field/${fieldId}/date/${date}`, {
      method: 'GET',
    });
  }

  // === ROLES SERVICE METHODS ===
  async createRole(roleData: { name: string; description: string; is_active: boolean }, token: string): Promise<any> {
    return this.makeRequestToService('roles', '/roles/roles', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(roleData),
    });
  }

  async createPermission(permissionData: { name: string; description: string; resource: string; action: string; is_active: boolean }, token: string): Promise<any> {
    return this.makeRequestToService('roles', '/roles/permissions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(permissionData),
    });
  }

  async assignRoleToUser(userId: number, roleId: number, token: string): Promise<any> {
    return this.makeRequestToService('roles', `/roles/users/${userId}/assign-role`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ role_id: roleId }),
    });
  }

  async assignPermissionToRole(roleId: number, permissionId: number, token: string): Promise<any> {
    return this.makeRequestToService('roles', `/roles/roles/${roleId}/permissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ permission_id: permissionId }),
    });
  }

  async validatePermission(userId: number, resource: string, action: string, token: string): Promise<any> {
    return this.makeRequestToService('roles', '/roles/validate-permission', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ user_id: userId, resource, action }),
    });
  }

  // === DASHBOARD SERVICE METHODS ===
  async getDashboardStats(token: string): Promise<DashboardStats> {
    return this.makeRequestToService<DashboardStats>('dashboard', '/dashboard/stats', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  // Nuevos métodos para el dashboard administrativo
  async getAdminDashboardStats(token: string): Promise<AdminDashboardStats> {
    return this.makeRequestToService<AdminDashboardStats>('dashboard', '/dashboard/stats', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async getAdminUsers(
    token: string,
    page: number = 1,
    limit: number = 20,
    role?: string,
    isActive?: boolean
  ): Promise<AdminUsersResponse> {
    const skip = (page - 1) * limit;
    const queryParams = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString()
    });
    
    if (role) {
      queryParams.append('role', role);
    }
    if (isActive !== undefined) {
      queryParams.append('is_active', isActive.toString());
    }

    return this.makeRequestToService<AdminUsersResponse>('dashboard', `/dashboard/users?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async getAdminReservations(
    token: string,
    page: number = 1,
    limit: number = 20,
    status?: string,
    fieldId?: number,
    dateFrom?: string,
    dateTo?: string
  ): Promise<AdminReservationsResponse> {
    const skip = (page - 1) * limit;
    const queryParams = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString()
    });
    
    if (status && status !== 'all') {
      queryParams.append('status', status);
    }
    if (fieldId) {
      queryParams.append('field_id', fieldId.toString());
    }
    if (dateFrom) {
      queryParams.append('date_from', dateFrom);
    }
    if (dateTo) {
      queryParams.append('date_to', dateTo);
    }

    return this.makeRequestToService<AdminReservationsResponse>('dashboard', `/dashboard/reservations?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async getFieldsStats(token: string): Promise<FieldStatsResponse> {
    return this.makeRequestToService<FieldStatsResponse>('dashboard', '/dashboard/fields/stats', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async getDailyRevenue(token: string, days: number = 30): Promise<DailyRevenue> {
    const queryParams = new URLSearchParams({
      days: days.toString()
    });

    return this.makeRequestToService<DailyRevenue>('dashboard', `/dashboard/revenue/daily?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async getHealthCheck(token: string): Promise<HealthCheckResponse> {
    return this.makeRequestToService<HealthCheckResponse>('dashboard', '/dashboard/health-check', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  // === HELPER METHOD FOR MICROSERVICES ===
  private async makeRequestToService<T>(
    service: keyof typeof SERVICES,
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${SERVICES[service]}${endpoint}`;
    
    const defaultHeaders: Record<string, string> = {};

    console.log('options:', options); 
    
     if (options.body) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`${service} service error:`, errorData);
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`${service} service request failed:`, error);
      throw error;
    }
  }
}

export const apiService = new ApiService();
