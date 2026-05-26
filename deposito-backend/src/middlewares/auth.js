const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (req, res, next) => {
  // Pega o token enviado no cabeçalho da requisição
  const authHeader = req.headers.authorization;

  // Se não mandou token nenhum, já bloqueia na porta
  if (!authHeader) {
    return res.status(401).json({ error: 'Acesso negado: Token não fornecido.' });
  }

  // O padrão do header é "Bearer o_seu_token_gigante", então nós separamos para pegar só o token
  const [, token] = authHeader.split(' ');

  try {
    // Tenta decodificar usando a chave secreta do seu .env
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Se deu certo, injeta o ID do usuário na requisição para podermos usar depois e manda seguir (next)
    req.userId = decoded.id;
    return next();
  } catch (err) {
    // Se o token for falso, expirado ou alterado, barra aqui
    return res.status(401).json({ error: 'Acesso negado: Token inválido ou expirado.' });
  }
};