@@ .. @@
 import React, { useState } from 'react';
 import { Link, useLocation } from 'react-router-dom';
-import { Menu, X, Home, Search, MessageCircle, User, Settings, LogOut } from 'lucide-react';
+import { Menu, X, Home, Search, MessageCircle, User, Settings, LogOut, Bell, Plus } from 'lucide-react';
 import { useAuth } from '../../contexts/AuthContext';
+import UserSettings from '../ui/UserSettings';

 const Navbar: React.FC = () => {
   const [isMenuOpen, setIsMenuOpen] = useState(false);
   const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
+  const [showSettings, setShowSettings] = useState(false);
   const { user, logout } = useAuth();
   const location = useLocation();

@@ .. @@
   const handleLogout = () => {
     logout();
     setIsProfileMenuOpen(false);
   };

+  const handleSettingsClick = () => {
+    setShowSettings(true);
+    setIsProfileMenuOpen(false);
+  };

   return (
-    <nav className="bg-white shadow-lg fixed w-full top-0 z-50">
+    <>
+      <nav className="bg-white shadow-lg fixed w-full top-0 z-50">
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div className="flex justify-between items-center h-16">
           {/* Logo */}
@@ .. @@
           {/* User Menu */}
           <div className="hidden md:flex items-center space-x-4">
             {user ? (
-              <div className="relative">
+              <div className="flex items-center space-x-4">
+                {/* Notifications */}
+                <button className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors">
+                  <Bell className="h-5 w-5" />
+                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
+                    3
+                  </span>
+                </button>
+
+                {/* Add Property (for agents) */}
+                {user.role === 'agent' && (
+                  <Link
+                    to="/properties/new"
+                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
+                  >
+                    <Plus className="h-4 w-4" />
+                    <span className="hidden lg:inline">Agregar</span>
+                  </Link>
+                )}
+
+                {/* Profile Menu */}
+                <div className="relative">
                 <button
                   onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                   className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
@@ .. @@
                     <Link
                       to="/analytics"
                       className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                       onClick={() => setIsProfileMenuOpen(false)}
                     >
                       <Settings className="h-4 w-4 mr-2" />
                       Analytics
                     </Link>
+                    <button
+                      onClick={handleSettingsClick}
+                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
+                    >
+                      <Settings className="h-4 w-4 mr-2" />
+                      Configuración
+                    </button>
                     <button
                       onClick={handleLogout}
                       className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
@@ .. @@
                   </div>
                 )}
               </div>
+              </div>
             ) : (
               <div className="flex items-center space-x-4">
                 <Link
@@ .. @@
                   Registrarse
                 </Link>
               </div>
             )}
           </div>

@@ .. @@
                   Dashboard
                 </Link>
                 <Link
                   to="/analytics"
                   className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                   onClick={() => setIsMenuOpen(false)}
                 >
                   Analytics
                 </Link>
+                <button
+                  onClick={() => {
+                    handleSettingsClick();
+                    setIsMenuOpen(false);
+                  }}
+                  className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50"
+                >
+                  Configuración
+                </button>
                 <button
                   onClick={() => {
                     handleLogout();
@@ .. @@
         </div>
       )}
     </nav>
+
+      <UserSettings isOpen={showSettings} onClose={() => setShowSettings(false)} />
+    </>
   );
 };