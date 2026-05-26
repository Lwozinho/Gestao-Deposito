import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post('/login', { email, password });
      
      const { token, user } = response.data;
      
      // Salva o "crachá" e os dados do usuário no armazenamento do navegador
      localStorage.setItem('@Deposito:token', token);
      localStorage.setItem('@Deposito:user', JSON.stringify(user));
      
      // Redireciona o usuário para o PDV (Frente de Caixa)
      navigate('/');
    } catch (error) {
      console.error(error);
      alert('Credenciais inválidas. Verifique seu e-mail e senha.');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#ececec' }}>
      <form onSubmit={handleLogin} style={{ background: '#fff', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', width: '100%', maxWidth: '350px' }}>
        
        <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>Acesso ao Sistema</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <input 
            type="email" 
            placeholder="E-mail" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
            style={{ width: '100%', padding: '12px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }} 
          />
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <input 
            type="password" 
            placeholder="Senha" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
            style={{ width: '100%', padding: '12px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }} 
          />
        </div>
        
        <button type="submit" style={{ width: '100%', padding: '12px', background: '#28a745', color: '#fff', fontSize: '16px', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          ENTRAR
        </button>
        
      </form>
    </div>
  );
}