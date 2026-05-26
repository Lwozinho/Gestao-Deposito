const db = require('./db');

async function createUsersTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await db.query(query);
    console.log('Tabela de usuários criada com sucesso no PostgreSQL!');
  } catch (error) {
    console.error('Erro ao criar tabela:', error);
  } finally {
    process.exit();
  }
}

createUsersTable();