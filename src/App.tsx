@@ .. @@
 import React from 'react';
 import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
+import { Toaster } from 'react-hot-toast';
 import { AuthProvider } from './contexts/AuthContext';
 import { PropertyProvider } from './contexts/PropertyContext';
 import { ChatProvider } from './contexts/ChatContext';
@@ .. @@
 import Login from './pages/Login';
 import Register from './pages/Register';
 import Plans from './pages/Plans';
 import Analytics from './pages/Analytics';
+import PropertyForm from './pages/PropertyForm';
+import AdminPanel from './pages/AdminPanel';

 function App() {
   return (
     <AuthProvider>
       <PropertyProvider>
         <ChatProvider>
           <Router>
             <div className="min-h-screen bg-gray-50">
+              <Toaster 
+                position="top-right"
+                toastOptions={{
+                  duration: 4000,
+                  style: {
+                    background: '#363636',
+                    color: '#fff',
+                  },
+                }}
+              />
               <Navbar />
               <main className="pt-16">
                 <Routes>
@@ .. @@
                   <Route path="/register" element={<Register />} />
                   <Route path="/plans" element={<Plans />} />
                   <Route path="/analytics" element={<Analytics />} />
+                  <Route path="/properties/new" element={<PropertyForm />} />
+                  <Route path="/properties/edit/:id" element={<PropertyForm />} />
+                  <Route path="/admin" element={<AdminPanel />} />
                 </Routes>
               </main>
               <Footer />