import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Home, User, Settings, LogOut, Bell } from "lucide-react";
import { useAuth } from "../../contexts/auth-context-utils";
import { useNotifications } from "../../contexts/NotificationContext";

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { user, logout } = useAuth();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    loadNotifications,
  } = useNotifications();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    setIsProfileMenuOpen(false);
  };

  // Cerrar menús al hacer clic fuera de ellos
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Cerrar menú de perfil si está abierto y se hace clic fuera
      if (isProfileMenuOpen) {
        const profileMenu = document.getElementById("profile-menu");
        if (profileMenu && !profileMenu.contains(event.target as Node)) {
          setIsProfileMenuOpen(false);
        }
      }

      // Cerrar menú de notificaciones si está abierto y se hace clic fuera
      if (isNotificationsOpen) {
        const notificationsMenu = document.getElementById("notifications-menu");
        if (
          notificationsMenu &&
          !notificationsMenu.contains(event.target as Node)
        ) {
          setIsNotificationsOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileMenuOpen, isNotificationsOpen]);

  return (
    <nav className="bg-white shadow-lg fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Home className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-800">PropFinder</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive("/")
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
              }`}
            >
              Inicio
            </Link>
            <Link
              to="/properties"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive("/properties")
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
              }`}
            >
              Propiedades
            </Link>
            {user && (
              <Link
                to="/chat"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive("/chat")
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                }`}
              >
                Chat
              </Link>
            )}
            <Link
              to="/plans"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive("/plans")
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
              }`}
            >
              Planes
            </Link>
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className="p-2 rounded-full text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors relative"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {isNotificationsOpen && (
                    <div
                      id="notifications-menu"
                      className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-50 max-h-96 overflow-y-auto"
                    >
                      <div className="flex justify-between items-center px-4 py-2 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900">
                          Notificaciones
                        </h3>
                        <div className="flex space-x-2">
                          {unreadCount > 0 && (
                            <button
                              onClick={() => markAllAsRead()}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              Marcar todas como leídas
                            </button>
                          )}
                          <Link
                            to="/notifications"
                            onClick={() => setIsNotificationsOpen(false)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Ver todas
                          </Link>
                        </div>
                      </div>

                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-gray-500 text-sm">
                          No tienes notificaciones
                        </div>
                      ) : (
                        <div>
                          {notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${
                                !notification.isRead ? "bg-blue-50" : ""
                              }`}
                              onClick={() => markAsRead(notification.id)}
                            >
                              <div className="flex justify-between items-start">
                                <p className="text-sm font-medium text-gray-900">
                                  {notification.title}
                                </p>
                                <span className="text-xs text-gray-500">
                                  {new Date(
                                    notification.createdAt
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* User Profile */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    <img
                      src={
                        user.avatar_url ||
                        "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150"
                      }
                      alt={user.name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                    <span className="text-sm font-medium">{user.name}</span>
                  </button>

                  {isProfileMenuOpen && (
                    <div
                      id="profile-menu"
                      className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50"
                    >
                      <Link
                        to={user?.role === 'agent' ? '/agent/dashboard' : '/dashboard'}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Dashboard
                      </Link>
                      <Link
                        to="/analytics"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Analytics
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Cerrar Sesión
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-blue-50"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
            <Link
              to="/"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive("/")
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Inicio
            </Link>
            <Link
              to="/properties"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive("/properties")
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Propiedades
            </Link>
            {user && (
              <Link
                to="/chat"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive("/chat")
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Chat
              </Link>
            )}
            <Link
              to="/plans"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive("/plans")
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Planes
            </Link>

            {user ? (
              <div className="border-t pt-3">
                <div className="flex items-center px-3 py-2">
                  <img
                    src={
                      user.avatar_url ||
                      "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150"
                    }
                    alt={user.name}
                    className="h-8 w-8 rounded-full object-cover mr-3"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {user.name}
                  </span>
                  {unreadCount > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
                <Link
                  to={user?.role === 'agent' ? '/agent/dashboard' : '/dashboard'}
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/analytics"
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Analytics
                </Link>
                <button
                  className="flex items-center w-full px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                  onClick={() => {
                    setIsMenuOpen(false);
                    loadNotifications();
                  }}
                >
                  <Bell className="h-5 w-5 mr-2" />
                  Notificaciones
                </button>
                <Link
                  to="/notifications"
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Ver todas las notificaciones
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                >
                  Cerrar Sesión
                </button>
              </div>
            ) : (
              <div className="border-t pt-3">
                <Link
                  to="/login"
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
