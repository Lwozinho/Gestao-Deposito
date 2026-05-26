const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = {
  // Cadastrar um novo usuário
  async register(req, res) {
    const { name, email, password } = req.body;

    try {
      const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
      if (userExists.rows.length > 0) {
        return res.status(400).json({ error: 'E-mail já cadastrado.' });
      }

      // Embaralha a senha antes de salvar no banco
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      const result = await db.query(
        'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
        [name, email, password_hash]
      );

      return res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao registrar usuário.' });
    }
  },

  // Fazer o Login
  async login(req, res) {
    const { email, password } = req.body;

    try {
      const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Usuário não encontrado.' });
      }

      const user = result.rows[0];

      // Compara a senha digitada com o hash do banco
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Senha incorreta.' });
      }

      // Gera o Token JWT válido por 1 dia
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: '1d'
      });

      return res.json({
        user: { id: user.id, name: user.name, email: user.email },
        token
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao fazer login.' });
    }
  }
};