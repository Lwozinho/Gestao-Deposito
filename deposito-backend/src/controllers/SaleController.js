const db = require('../db');

module.exports = {
  // 1. Dashboard: Lista APENAS as vendas fechadas
  async index(req, res) {
    try {
      const salesResult = await db.query("SELECT * FROM sales WHERE status = 'fechada' ORDER BY created_at DESC");
      
      const salesWithItems = await Promise.all(
        salesResult.rows.map(async (sale) => {
          const itemsResult = await db.query(
            `SELECT si.quantity, si.unit_price, p.name, p.cost_price 
             FROM sale_items si JOIN products p ON si.product_id = p.id 
             WHERE si.sale_id = $1`, [sale.id]
          );
          return { ...sale, items: itemsResult.rows };
        })
      );

      return res.json(salesWithItems);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar o histórico de vendas' });
    }
  },

  // 2. Comandas: Lista as comandas ABERTAS
  async getOpenTabs(req, res) {
    try {
      const salesResult = await db.query("SELECT * FROM sales WHERE status = 'aberta' ORDER BY created_at DESC");
      
      const tabsWithItems = await Promise.all(
        salesResult.rows.map(async (sale) => {
          const itemsResult = await db.query(
            `SELECT si.product_id, si.quantity, si.unit_price, p.name 
             FROM sale_items si JOIN products p ON si.product_id = p.id 
             WHERE si.sale_id = $1`, [sale.id]
          );
          return { ...sale, items: itemsResult.rows };
        })
      );

      return res.json(tabsWithItems);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar comandas abertas' });
    }
  },

  // 3. PDV: Criar Venda Direta OU Abrir Nova Comanda
  async store(req, res) {
    const { total_amount, payment_method, items, status, customer_name } = req.body;
    
    // Se não mandar status, assume que é venda direta (fechada)
    const finalStatus = status || 'fechada';
    // Se for comanda aberta, não tem forma de pagamento ainda
    const finalPayment = finalStatus === 'aberta' ? null : (payment_method || 'Dinheiro');

    try {
      const saleResult = await db.query(
        'INSERT INTO sales (total_amount, payment_method, status, customer_name) VALUES ($1, $2, $3, $4) RETURNING *',
        [total_amount, finalPayment, finalStatus, customer_name]
      );
      const sale = saleResult.rows[0];

      for (let item of items) {
        await db.query(
          'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)',
          [sale.id, item.product_id, item.quantity, item.unit_price]
        );
        await db.query(
          'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
          [item.quantity, item.product_id]
        );
      }

      return res.status(201).json({ message: 'Registrado com sucesso!', sale });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao processar.' });
    }
  },

  // 4. PDV: Lançar mais produtos em uma comanda já aberta
  async addItemsToTab(req, res) {
    const { id } = req.params;
    const { items_to_add, additional_amount } = req.body;

    try {
      for (let item of items_to_add) {
        // Insere os novos itens
        await db.query(
          'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)',
          [id, item.product_id, item.quantity, item.unit_price]
        );
        // Baixa o estoque dos novos itens
        await db.query(
          'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
          [item.quantity, item.product_id]
        );
      }
      
      // Atualiza o valor total da comanda
      const result = await db.query(
        'UPDATE sales SET total_amount = total_amount + $1 WHERE id = $2 RETURNING *',
        [additional_amount, id]
      );

      return res.json({ message: 'Itens adicionados à comanda!', tab: result.rows[0] });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao adicionar itens.' });
    }
  },

  // 5. PDV: Fechar a conta e realizar o pagamento
  async closeTab(req, res) {
    const { id } = req.params;
    const { payment_method } = req.body;

    try {
      const result = await db.query(
        "UPDATE sales SET status = 'fechada', payment_method = $1 WHERE id = $2 RETURNING *",
        [payment_method, id]
      );
      return res.json({ message: 'Comanda fechada com sucesso!', tab: result.rows[0] });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao fechar comanda.' });
    }
  } ,

  // 6. PDV: Cancelar a comanda e devolver os itens ao estoque
  async cancelTab(req, res) {
    const { id } = req.params;

    try {
      // 1. Busca todos os itens que foram lançados nesta comanda
      const itemsResult = await db.query(
        'SELECT product_id, quantity FROM sale_items WHERE sale_id = $1',
        [id]
      );

      // 2. Devolve a quantidade de cada item de volta ao estoque dos produtos
      for (let item of itemsResult.rows) {
        await db.query(
          'UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2',
          [item.quantity, item.product_id]
        );
      }

      // 3. Atualiza o status da comanda para 'cancelada'
      const result = await db.query(
        "UPDATE sales SET status = 'cancelada' WHERE id = $1 RETURNING *",
        [id]
      );

      return res.json({ message: 'Comanda cancelada e estoque devolvido!', tab: result.rows[0] });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao cancelar comanda.' });
    }
  }
};