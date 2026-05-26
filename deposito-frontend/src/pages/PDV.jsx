import { useEffect, useState } from 'react';
import { api } from '../api';

export default function PDV() {
  const [produtos, setProdutos] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [busca, setBusca] = useState('');
  
  const [formaPagamento, setFormaPagamento] = useState('Pix');
  const [nomeCliente, setNomeCliente] = useState('');
  
  const [comandas, setComandas] = useState([]);
  const [comandaSelecionadaId, setComandaSelecionadaId] = useState('');

  const [isModalComandaOpen, setIsModalComandaOpen] = useState(false);
  const [comandaDetalhe, setComandaDetalhe] = useState(null);

  const [isModalPagamentoOpen, setIsModalPagamentoOpen] = useState(false);
  const [comandaParaPagar, setComandaParaPagar] = useState(null);
  const [metodoPagamentoComanda, setMetodoPagamentoComanda] = useState('Pix');

  useEffect(() => {
    carregarProdutos();
    carregarComandas();
  }, []);

  const carregarProdutos = () => {
    api.get('/products')
      .then(response => setProdutos(response.data))
      .catch(error => console.error(error));
  };

  const carregarComandas = () => {
    api.get('/tabs')
      .then(response => setComandas(response.data))
      .catch(error => console.error(error));
  };

  const adicionarAoCarrinho = (produtoClick) => {
    const produtoNoEstoque = produtos.find(p => p.id === produtoClick.id);
    if (produtoNoEstoque.stock_quantity <= 0) return alert("Sem estoque!");

    const itemExistente = carrinho.find(item => item.id === produtoClick.id);
    if (itemExistente) {
      setCarrinho(carrinho.map(item => item.id === produtoClick.id ? { ...item, quantidade: item.quantidade + 1 } : item));
    } else {
      setCarrinho([...carrinho, { ...produtoClick, quantidade: 1 }]);
    }
    setProdutos(produtos.map(p => p.id === produtoClick.id ? { ...p, stock_quantity: p.stock_quantity - 1 } : p));
  };

  const removerDoCarrinho = (idProduto) => {
    const itemSendoRemovido = carrinho.find(item => item.id === idProduto);
    if (itemSendoRemovido) {
      setProdutos(produtos.map(p => p.id === idProduto ? { ...p, stock_quantity: p.stock_quantity + itemSendoRemovido.quantidade } : p));
    }
    setCarrinho(carrinho.filter(item => item.id !== idProduto));
  };

  const totalVenda = carrinho.reduce((total, item) => total + (item.sell_price * item.quantidade), 0);

  const processarAcaoCarrinho = async () => {
    if (carrinho.length === 0) return alert("Carrinho vazio.");

    const itensMapeados = carrinho.map(item => ({
      product_id: item.id,
      quantity: item.quantidade,
      unit_price: item.sell_price
    }));

    try {
      if (comandaSelecionadaId) {
        await api.post(`/tabs/${comandaSelecionadaId}/add`, {
          items_to_add: itensMapeados,
          additional_amount: totalVenda
        });
        alert("Itens adicionados à comanda!");
      } else if (nomeCliente.trim() !== '') {
        await api.post('/sales', {
          total_amount: totalVenda,
          status: 'aberta',
          customer_name: nomeCliente,
          items: itensMapeados
        });
        alert("Comanda aberta com sucesso!");
      } else {
        await api.post('/sales', {
          total_amount: totalVenda,
          status: 'fechada',
          payment_method: formaPagamento,
          items: itensMapeados
        });
        alert("Venda finalizada com sucesso!");
      }

      setCarrinho([]);
      setNomeCliente('');
      setComandaSelecionadaId('');
      setFormaPagamento('Pix');
    } catch (error) {
      console.error(error);
      alert("Erro ao processar a operação.");
    } finally {
      carregarProdutos();
      carregarComandas();
    }
  };

  const abrirModalPagamento = (comanda) => {
    setComandaParaPagar(comanda);
    setMetodoPagamentoComanda('Pix');
    setIsModalPagamentoOpen(true);
  };

  const confirmarPagamentoComanda = async () => {
    try {
      await api.put(`/tabs/${comandaParaPagar.id}/close`, { payment_method: metodoPagamentoComanda });
      alert("Comanda fechada com sucesso!");
      setIsModalPagamentoOpen(false);
      setComandaParaPagar(null);
      if (comandaDetalhe && comandaDetalhe.id === comandaParaPagar.id) {
        fecharDetalhesComanda();
      }
      carregarComandas();
    } catch (error) {
      console.error(error);
      alert("Erro ao fechar comanda.");
    }
  };

  // Função para cancelar comanda com aviso de confirmação
  const handleCancelarComanda = async (id, nome) => {
    const confirmar = window.confirm(`Tem certeza que deseja CANCELAR a comanda de "${nome}"?\nTodos os produtos retornarão ao estoque.`);
    
    if (confirmar) {
      try {
        await api.put(`/tabs/${id}/cancel`);
        alert("Comanda cancelada e estoque recomposto!");
        setIsModalComandaOpen(false);
        setComandaDetalhe(null);
        carregarComandas();
        carregarProdutos(); // Recarrega os produtos para atualizar o estoque na tela
      } catch (error) {
        console.error(error);
        alert("Erro ao cancelar comanda.");
      }
    }
  };

  const abrirDetalhesComanda = (comanda) => {
    setComandaDetalhe(comanda);
    setIsModalComandaOpen(true);
  };

  const fecharDetalhesComanda = () => {
    setIsModalComandaOpen(false);
    setComandaDetalhe(null);
  };

  const produtosFiltrados = produtos.filter(p => p.name.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div style={{ padding: '20px', display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 500px', background: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
        <h2>Produtos</h2>
        <input type="text" placeholder="Buscar produto..." value={busca} onChange={e => setBusca(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', maxHeight: '600px', overflowY: 'auto' }}>
          {produtosFiltrados.map(produto => (
            <button key={produto.id} onClick={() => adicionarAoCarrinho(produto)} disabled={produto.stock_quantity <= 0} style={{ padding: '15px', width: '140px', background: produto.stock_quantity > 0 ? '#fff' : '#ffeaea', border: '1px solid #ddd', borderRadius: '8px', cursor: produto.stock_quantity > 0 ? 'pointer' : 'not-allowed' }}>
              <strong>{produto.name}</strong><br/>
              <span style={{ color: '#28a745' }}>R$ {parseFloat(produto.sell_price).toFixed(2)}</span><br/>
              <small style={{ color: produto.stock_quantity <= produto.min_stock_limit ? 'red' : '#333' }}>Estoque: {produto.stock_quantity}</small>
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ background: '#fff', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h2>Carrinho Atual</h2>
          {carrinho.length === 0 ? <p>Vazio.</p> : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {carrinho.map(item => (
                <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                  <div><strong>{item.name}</strong><br/>{item.quantidade}x R$ {parseFloat(item.sell_price).toFixed(2)}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <strong>R$ {(item.quantidade * item.sell_price).toFixed(2)}</strong>
                    <button onClick={() => removerDoCarrinho(item.id)} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer' }}>X</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          
          <h3 style={{ borderTop: '2px solid #333', paddingTop: '15px' }}>Total: R$ {totalVenda.toFixed(2)}</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
            <select value={comandaSelecionadaId} onChange={e => { setComandaSelecionadaId(e.target.value); setNomeCliente(''); }} style={{ padding: '10px', borderRadius: '4px' }}>
              <option value="">-- Nova Venda / Nova Comanda --</option>
              {comandas.map(c => <option key={c.id} value={c.id}>Lançar na {c.customer_name} (Atual: R$ {parseFloat(c.total_amount).toFixed(2)})</option>)}
            </select>

            {!comandaSelecionadaId && (
              <>
                <input type="text" placeholder="Nome do Cliente/Mesa (Opcional)" value={nomeCliente} onChange={e => setNomeCliente(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                {!nomeCliente && (
                  <select value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)} style={{ padding: '10px', borderRadius: '4px' }}>
                    <option value="Pix">Pix</option><option value="Dinheiro">Dinheiro</option><option value="Débito">Débito</option><option value="Crédito">Crédito</option>
                  </select>
                )}
              </>
            )}

            <button onClick={processarAcaoCarrinho} style={{ padding: '15px', background: comandaSelecionadaId ? '#17a2b8' : (nomeCliente ? '#ffc107' : '#007bff'), color: comandaSelecionadaId || !nomeCliente ? 'white' : 'black', fontSize: '16px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
              {comandaSelecionadaId ? 'LANÇAR NA COMANDA' : (nomeCliente ? 'ABRIR NOVA COMANDA' : 'FINALIZAR VENDA DIRETA')}
            </button>
          </div>
        </div>

        <div style={{ background: '#fff', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h2>Comandas em Aberto</h2>
          {comandas.length === 0 ? <p>Nenhuma comanda aberta.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {comandas.map(comanda => (
                <div key={comanda.id} style={{ background: '#f8f9fa', padding: '15px', border: '1px solid #dee2e6', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '18px' }}>{comanda.customer_name}</strong>
                    <span style={{ fontWeight: 'bold', color: '#007bff' }}>R$ {parseFloat(comanda.total_amount).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button onClick={() => abrirDetalhesComanda(comanda)} style={{ flex: 1, background: '#17a2b8', color: 'white', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                      DETALHES
                    </button>
                    <button onClick={() => abrirModalPagamento(comanda)} style={{ flex: 1, background: '#28a745', color: 'white', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                      PAGAR
                    </button>
                    <button onClick={() => handleCancelarComanda(comanda.id, comanda.customer_name)} style={{ flex: 1, background: '#dc3545', color: 'white', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                      CANCELAR
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isModalComandaOpen && comandaDetalhe && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '8px', width: '100%', maxWidth: '500px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Comanda: {comandaDetalhe.customer_name}</h3>
              <button onClick={fecharDetalhesComanda} style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
            </div>
            
            <p style={{ margin: '5px 0' }}><strong>Status:</strong> Aberta</p>
            <p style={{ margin: '5px 0' }}><strong>Total Parcial:</strong> R$ {parseFloat(comandaDetalhe.total_amount).toFixed(2)}</p>
            
            <h4 style={{ marginTop: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Itens Consumidos</h4>
            <ul style={{ listStyle: 'none', padding: 0, maxHeight: '250px', overflowY: 'auto' }}>
              {comandaDetalhe.items && comandaDetalhe.items.length > 0 ? (
                comandaDetalhe.items.map((item, index) => (
                  <li key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f4f4f4' }}>
                    <span><strong>{item.quantity}x</strong> {item.name}</span>
                    <span>R$ {(parseFloat(item.unit_price) * item.quantity).toFixed(2)}</span>
                  </li>
                ))
              ) : (
                <li>Nenhum item lançado.</li>
              )}
            </ul>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button 
                onClick={() => abrirModalPagamento(comandaDetalhe)} 
                style={{ flex: 1, padding: '12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                PAGAR CONTA
              </button>
              <button 
                onClick={() => handleCancelarComanda(comandaDetalhe.id, comandaDetalhe.customer_name)} 
                style={{ flex: 1, padding: '12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                CANCELAR COMANDA
              </button>
              <button 
                onClick={fecharDetalhesComanda} 
                style={{ flex: 1, padding: '12px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalPagamentoOpen && comandaParaPagar && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1050
        }}>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '8px', width: '100%', maxWidth: '400px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 20px 0' }}>Pagamento da Comanda</h3>
            <p><strong>Cliente/Mesa:</strong> {comandaParaPagar.customer_name}</p>
            <p style={{ marginBottom: '20px' }}><strong>Valor Total:</strong> R$ {parseFloat(comandaParaPagar.total_amount).toFixed(2)}</p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Forma de Pagamento:</label>
              <select 
                value={metodoPagamentoComanda} 
                onChange={e => setMetodoPagamentoComanda(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '16px' }}
              >
                <option value="Pix">Pix</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Débito">Débito</option>
                <option value="Crédito">Crédito</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={confirmarPagamentoComanda} 
                style={{ flex: 2, padding: '12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                CONFIRMAR
              </button>
              <button 
                onClick={() => setIsModalPagamentoOpen(false)} 
                style={{ flex: 1, padding: '12px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}