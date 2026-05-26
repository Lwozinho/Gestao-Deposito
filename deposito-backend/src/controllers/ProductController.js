const db = require('../db');

module.exports = {
  // Listar todos os produtos do estoque
  async index(req, res) {
    try {
      const result = await db.query('SELECT * FROM products ORDER BY id ASC');
      return res.json(result.rows);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar produtos' });
    }
  },

  // Cadastrar um novo produto
  async store(req, res) {
    const { name, cost_price, sell_price, stock_quantity, min_stock_limit } = req.body;
    
    try {
      // 1. Verifica se o produto já existe
      const checkDuplicate = await db.query('SELECT * FROM products WHERE name = $1', [name]);
      if (checkDuplicate.rows.length > 0) {
        return res.status(400).json({ error: 'Produto já cadastrado. Utilize a opção de editar.' });
      }

      // 2. Se não existir, faz a inserção
      const result = await db.query(
        `INSERT INTO products 
        (name, cost_price, sell_price, stock_quantity, min_stock_limit) 
        VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [name, cost_price, sell_price, stock_quantity, min_stock_limit]
      );
      
      return res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao cadastrar produto' });
    }
  },

  // Atualizar (Editar) um produto existente
  async update(req, res) {
    const { id } = req.params;
    const { name, cost_price, sell_price, stock_quantity, min_stock_limit } = req.body;

    try {
      const result = await db.query(
        `UPDATE products 
         SET name = $1, cost_price = $2, sell_price = $3, stock_quantity = $4, min_stock_limit = $5 
         WHERE id = $6 RETURNING *`,
        [name, cost_price, sell_price, stock_quantity, min_stock_limit, id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Produto não encontrado.' });
      }

      return res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao atualizar produto' });
    }
  },

  // Excluir um produto
  async delete(req, res) {
    const { id } = req.params;

    try {
      const result = await db.query('DELETE FROM products WHERE id = $1', [id]);

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Produto não encontrado.' });
      }

      return res.status(204).send(); // Retorna sucesso sem conteúdo
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao excluir produto. Verifique se ele já não está atrelado a uma venda.' });
    }
  }
};