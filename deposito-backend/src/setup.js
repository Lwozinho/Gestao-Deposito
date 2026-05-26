const db = require('./db');

async function createTables() {
  const query = `
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      cost_price DECIMAL(10,2) NOT NULL,
      sell_price DECIMAL(10,2) NOT NULL,
      stock_quantity INTEGER NOT NULL DEFAULT 0,
      min_stock_limit INTEGER NOT NULL DEFAULT 5
    );

    CREATE TABLE IF NOT EXISTS sales (
      id SERIAL PRIMARY KEY,
      total_amount DECIMAL(10,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id SERIAL PRIMARY KEY,
      sale_id INTEGER REFERENCES sales(id),
      product_id INTEGER REFERENCES products(id),
      quantity INTEGER NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL
    );
  `;

  try {
    await db.query(query);
    console.log('Tabelas criadas com sucesso no PostgreSQL!');
  } catch (error) {
    console.error('Erro ao criar tabelas:', error);
  } finally {
    process.exit();
  }
}

createTables();