require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

async function checkPaymentsTable() {
  try {
    console.log("🔍 Verificando tabla payments...");

    // Verificar si existe la tabla payments
    const tableExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'payments'
      )
    `;

    const tableExists = await pool.query(tableExistsQuery);

    if (tableExists.rows[0].exists) {
      console.log("✅ Tabla payments ya existe");

      // Mostrar estructura de la tabla
      const columnsQuery = `
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'payments'
        ORDER BY ordinal_position
      `;
      const columns = await pool.query(columnsQuery);
      console.log("📋 Estructura de la tabla payments:");
      console.table(columns.rows);
    } else {
      console.log("❌ Tabla payments no existe. Creándola...");

      // Crear tabla payments
      const createTableQuery = `
        CREATE TABLE payments (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
          amount DECIMAL(10, 2) NOT NULL,
          currency VARCHAR(3) DEFAULT 'USD',
          payment_method VARCHAR(50) NOT NULL,
          status VARCHAR(20) DEFAULT 'pending',
          stripe_payment_intent_id VARCHAR(255),
          paypal_payment_id VARCHAR(255),
          mercadopago_preference_id VARCHAR(255),
          mercadopago_payment_id VARCHAR(255),
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Índices para mejorar rendimiento
        CREATE INDEX idx_payments_user_id ON payments(user_id);
        CREATE INDEX idx_payments_property_id ON payments(property_id);
        CREATE INDEX idx_payments_status ON payments(status);
        CREATE INDEX idx_payments_payment_method ON payments(payment_method);
        CREATE INDEX idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);
        CREATE INDEX idx_payments_paypal_payment_id ON payments(paypal_payment_id);
        CREATE INDEX idx_payments_mercadopago_preference_id ON payments(mercadopago_preference_id);
      `;

      await pool.query(createTableQuery);
      console.log("✅ Tabla payments creada exitosamente");
    }

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    await pool.end();
    process.exit(1);
  }
}

checkPaymentsTable();
