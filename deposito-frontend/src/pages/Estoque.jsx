import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Estoque() {
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState(''); 
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [minStockLimit, setMinStockLimit] = useState('');

  useEffect(() => {
    carregarProdutos();
  }, []);

  const carregarProdutos = () => {
    api.get('/products')
      .then(response => setProdutos(response.data))
      .catch(error => console.error("Erro ao buscar produtos:", error));
  };

  const limparFormulario = () => {
    setEditId(null);
    setName('');
    setCostPrice('');
    setSellPrice('');
    setStockQuantity('');
    setMinStockLimit('');
  };

  const abrirModalCadastro = () => {
    limparFormulario();
    setIsModalOpen(true);
  };

  const handleEditar = (produto) => {
    setEditId(produto.id);
    setName(produto.name);
    setCostPrice(produto.cost_price);
    setSellPrice(produto.sell_price);
    setStockQuantity(produto.stock_quantity);
    setMinStockLimit(produto.min_stock_limit);
    setIsModalOpen(true);
  };

  const fecharModal = () => {
    setIsModalOpen(false);
    limparFormulario();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name,
      cost_price: parseFloat(costPrice),
      sell_price: parseFloat(sellPrice),
      stock_quantity: parseInt(stockQuantity, 10),
      min_stock_limit: parseInt(minStockLimit, 10)
    };

    try {
      if (editId) {
        await api.put(`/products/${editId}`, payload);
      } else {
        await api.post('/products', payload);
      }
      
      fecharModal();
      carregarProdutos(); 
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || "Falha ao salvar produto.");
    }
  };

  // Função para excluir produto com confirmação de segurança
  const handleExcluir = async (id, nome) => {
    const confirmar = window.confirm(`Tem certeza que deseja excluir o produto "${nome}"?`);
    
    if (confirmar) {
      try {
        await api.delete(`/products/${id}`);
        carregarProdutos(); // Atualiza a tabela após a exclusão
      } catch (error) {
        console.error(error);
        alert(error.response?.data?.error || "Erro ao excluir o produto. Verifique se ele já não está atrelado a uma venda.");
      }
    }
  };

  const produtosFiltrados = produtos.filter(produto => 
    produto.name.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Gestão de Estoque</h2>
        <button 
          onClick={abrirModalCadastro} 
          style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          + Novo Produto
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="Buscar produto pelo nome..." 
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{ width: '100%', maxWidth: '400px', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '16px' }}
        />
      </div>
      
      <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ background: '#f4f4f4' }}>
            <th>Cód.</th>
            <th>Produto</th>
            <th>Preço de Custo</th>
            <th>Preço de Venda</th>
            <th>Estoque Atual</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {produtosFiltrados.length === 0 ? (
            <tr><td colSpan="6" style={{ textAlign: 'center' }}>Nenhum produto encontrado.</td></tr>
          ) : (
            produtosFiltrados.map(produto => (
              <tr key={produto.id}>
                <td>{produto.id}</td>
                <td>{produto.name}</td>
                <td>R$ {parseFloat(produto.cost_price).toFixed(2)}</td>
                <td>R$ {parseFloat(produto.sell_price).toFixed(2)}</td>
                <td style={{ 
                  color: produto.stock_quantity <= produto.min_stock_limit ? 'red' : 'black',
                  fontWeight: produto.stock_quantity <= produto.min_stock_limit ? 'bold' : 'normal'
                }}>
                  {produto.stock_quantity} {produto.stock_quantity <= produto.min_stock_limit && '(Baixo)'}
                </td>
                <td>
                  <button 
                    onClick={() => handleEditar(produto)} 
                    style={{ background: '#ffc107', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' }}
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => handleExcluir(produto.id, produto.name)} 
                    style={{ background: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '8px', width: '100%', maxWidth: '400px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', textAlign: 'center' }}>
              {editId ? 'Editar Bebida' : 'Cadastrar Nova Bebida'}
            </h3>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input type="text" placeholder="Nome do Produto" value={name} onChange={e => setName(e.target.value)} required style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
              <input type="number" step="0.01" placeholder="Preço Custo (R$)" value={costPrice} onChange={e => setCostPrice(e.target.value)} required style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
              <input type="number" step="0.01" placeholder="Preço Venda (R$)" value={sellPrice} onChange={e => setSellPrice(e.target.value)} required style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
              <input type="number" placeholder="Estoque Atual" value={stockQuantity} onChange={e => setStockQuantity(e.target.value)} required style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
              <input type="number" placeholder="Alerta Estoque Mínimo" value={minStockLimit} onChange={e => setMinStockLimit(e.target.value)} required style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={{ flex: 1, padding: '12px', background: editId ? '#007bff' : '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                  {editId ? 'Atualizar' : 'Salvar'}
                </button>
                <button type="button" onClick={fecharModal} style={{ flex: 1, padding: '12px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}