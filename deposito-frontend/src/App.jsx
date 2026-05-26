import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import PDV from './pages/PDV';
import Estoque from './pages/Estoque';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login'; // Nova importação

// Criamos um componente separado para o Menu para podermos usar o hook useLocation
function Navegacao() {
  const location = useLocation();
  
  // Se a página atual for o Login, não mostra o menu
  if (location.pathname === '/login') {
    return null; 
  }

  return (
    <nav style={{ padding: '15px', background: '#333', color: '#fff', marginBottom: '20px' }}>
      <Link to="/" style={{ color: '#fff', marginRight: '20px', textDecoration: 'none', fontWeight: 'bold' }}>Frente de Caixa</Link>
      <Link to="/estoque" style={{ color: '#fff', marginRight: '20px', textDecoration: 'none', fontWeight: 'bold' }}>Estoque</Link>
      <Link to="/dashboard" style={{ color: '#fff', textDecoration: 'none', fontWeight: 'bold' }}>Painel Financeiro</Link>
      
      {/* Botão de Sair simples */}
      <button 
        onClick={() => {
          localStorage.clear();
          window.location.href = '/login';
        }} 
        style={{ float: 'right', background: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
        Sair
      </button>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Navegacao />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PDV />} />
        <Route path="/estoque" element={<Estoque />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;