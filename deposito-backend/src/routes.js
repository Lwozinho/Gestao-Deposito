const { Router } = require('express');
const ProductController = require('./controllers/ProductController');
const SaleController = require('./controllers/SaleController');
const AuthController = require('./controllers/AuthController');
const authMiddleware = require('./middlewares/auth'); // Importando o cadeado

const routes = Router();

// 🟢 ROTAS PÚBLICAS (Qualquer um acessa)
routes.post('/register', AuthController.register);
routes.post('/login', AuthController.login);

// 🔒 APLICANDO O CADEADO (Tudo abaixo desta linha exige o Token)
routes.use(authMiddleware);

// 🔴 ROTAS PRIVADAS (Estoque e Frente de Caixa)
routes.get('/products', ProductController.index);
routes.post('/products', ProductController.store);
routes.put('/products/:id', ProductController.update);
routes.delete('/products/:id', ProductController.delete);

// Rotas de Vendas (Dashboard Financeiro)
routes.get('/sales', SaleController.index);

// Rotas de Frente de Caixa e Comandas
routes.post('/sales', SaleController.store); // Criar venda ou comanda
routes.get('/tabs', SaleController.getOpenTabs); // Listar abertas
routes.post('/tabs/:id/add', SaleController.addItemsToTab); // Lançar mais produtos
routes.put('/tabs/:id/close', SaleController.closeTab); // Pagar a comanda
routes.put('/tabs/:id/cancel', SaleController.cancelTab);

module.exports = routes;