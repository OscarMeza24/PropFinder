const jwt = require('jsonwebtoken');
require('dotenv').config();

// Función para verificar un token JWT
function verifyToken(token) {
  try {
    if (!token) {
      console.log('❌ No token provided');
      return;
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token is valid');
    console.log('Token data:', JSON.stringify(decoded, null, 2));
    
    console.log('\n🎭 User Info:');
    console.log(`ID: ${decoded.id}`);
    console.log(`Email: ${decoded.email}`);
    console.log(`Role: ${decoded.role}`);
    console.log(`Is Agent: ${decoded.role === 'agent'}`);
    
    const now = Math.floor(Date.now() / 1000);
    console.log('\n⏰ Token Timing:');
    console.log(`Issued at: ${new Date(decoded.iat * 1000).toLocaleString()}`);
    console.log(`Expires at: ${new Date(decoded.exp * 1000).toLocaleString()}`);
    console.log(`Is expired: ${decoded.exp < now}`);
    
  } catch (error) {
    console.log('❌ Invalid token:', error.message);
  }
}

// Si se pasa un token como argumento
if (process.argv[2]) {
  console.log('🔍 Verifying provided token...\n');
  verifyToken(process.argv[2]);
} else {
  console.log('📋 Usage: node verify-token.js <token>');
  console.log('Copy the token from localStorage.getItem("token") and paste it here');
}
