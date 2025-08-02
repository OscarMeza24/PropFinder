import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, Trash2, Filter } from 'lucide-react';
import { useAuth } from '../contexts/auth-context-utils';
import { useNotifications } from '../contexts/NotificationContext';

const Notifications: React.FC = () => {
  const { user } = useAuth();
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    error, 
    loadNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Cargar notificaciones cuando cambia el filtro o la página
  useEffect(() => {
    loadNotifications(filter === 'unread');
  }, [filter, loadNotifications]);

  // Manejar el cambio de filtro
  const handleFilterChange = (newFilter: 'all' | 'unread') => {
    setFilter(newFilter);
    setCurrentPage(1); // Resetear a la primera página cuando cambia el filtro
  };

  // Calcular notificaciones paginadas
  const paginatedNotifications = notifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calcular total de páginas
  const totalPages = Math.ceil(notifications.length / itemsPerPage);

  // Función para cambiar de página
  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  // Renderizar paginación
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center mt-6">
        <nav className="flex items-center space-x-2">
          <button
            onClick={() => goToPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-md ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            Anterior
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => goToPage(page)}
              className={`px-3 py-1 rounded-md ${page === currentPage ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded-md ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            Siguiente
          </button>
        </nav>
      </div>
    );
  };

  // Renderizar mensaje de acceso requerido si no hay usuario
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Acceso Requerido
            </h2>
            <p className="text-gray-600 mb-8">
              Necesitas iniciar sesión para ver tus notificaciones
            </p>
            <Link
              to="/login"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notificaciones</h1>
            <p className="text-gray-600">Gestiona tus notificaciones y alertas</p>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Check className="h-4 w-4" />
              <span>Marcar todas como leídas</span>
            </button>
          )}
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="text-gray-700 flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              <span>Filtrar por:</span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleFilterChange('all')}
                className={`px-4 py-2 rounded-md ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Todas
              </button>
              <button
                onClick={() => handleFilterChange('unread')}
                className={`px-4 py-2 rounded-md ${filter === 'unread' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                No leídas {unreadCount > 0 && `(${unreadCount})`}
              </button>
            </div>
          </div>
        </div>

        {/* Lista de notificaciones */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando notificaciones...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-600">{error}</p>
              <button 
                onClick={() => loadNotifications(filter === 'unread')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes notificaciones</h3>
              <p className="text-gray-600">
                {filter === 'unread' 
                  ? 'No tienes notificaciones sin leer en este momento.' 
                  : 'No tienes notificaciones en este momento.'}
              </p>
            </div>
          ) : (
            <div>
              <ul className="divide-y divide-gray-200">
                {paginatedNotifications.map((notification) => (
                  <li 
                    key={notification.id} 
                    className={`p-4 hover:bg-gray-50 transition-colors ${!notification.isRead ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <h3 className="text-base font-medium text-gray-900 mr-2">
                            {notification.title}
                          </h3>
                          {!notification.isRead && (
                            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                              Nueva
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notification.createdAt).toLocaleDateString('es-ES', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        {!notification.isRead && (
                          <button 
                            onClick={() => markAsRead(notification.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                            title="Marcar como leída"
                          >
                            <Check className="h-5 w-5" />
                          </button>
                        )}
                        <button 
                          onClick={() => deleteNotification(notification.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                          title="Eliminar notificación"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              {renderPagination()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;