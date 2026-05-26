const db = require('./db');

async function updateComandas() {
  try {
    await db.query(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'fechada';`);
    await db.query(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_name VARCHAR(100);`);
    console.log('Tabela de vendas atualizada com suporte a Comandas!');
  } catch (error) {
    console.error('Erro ao atualizar tabela:', error);
  } finally {
    process.exit();
  }
}

updateComandas();