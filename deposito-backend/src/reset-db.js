const db = require('./db');

async function resetarBanco() {
  try {
    // O comando TRUNCATE limpa as tabelas. 
    // RESTART IDENTITY zera os IDs de volta para 1.
    // CASCADE garante que as relações (como sale_items) também sejam limpas.
    await db.query('TRUNCATE TABLE sale_items, sales, products RESTART IDENTITY CASCADE;');
    console.log('✅ Banco de dados zerado com sucesso! Produtos e vendas foram apagados.');
  } catch (error) {
    console.error('❌ Erro ao zerar o banco:', error);
  } finally {
    process.exit();
  }
}

resetarBanco();