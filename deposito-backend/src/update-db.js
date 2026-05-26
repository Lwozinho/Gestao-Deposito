const db = require('./db');

async function updateSalesTable() {
  try {
    // Adiciona a coluna de forma de pagamento, definindo 'Dinheiro' como padrão para as vendas antigas
    await db.query(`
      ALTER TABLE sales 
      ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'Dinheiro';
    `);
    console.log('Coluna payment_method adicionada com sucesso na tabela sales!');
  } catch (error) {
    console.error('Erro ao atualizar tabela:', error);
  } finally {
    process.exit();
  }
}

updateSalesTable();