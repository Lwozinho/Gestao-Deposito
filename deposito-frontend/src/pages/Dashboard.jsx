import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Dashboard() {
  const [vendas, setVendas] = useState([]);
  
  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vendaSelecionada, setVendaSelecionada] = useState(null);
  
  const [isModalFluxoOpen, setIsModalFluxoOpen] = useState(false);
  const [periodoFluxo, setPeriodoFluxo] = useState('Diário');

  const [isModalDesempenhoOpen, setIsModalDesempenhoOpen] = useState(false);
  const [periodoDesempenho, setPeriodoDesempenho] = useState('Diário');

  useEffect(() => {
    api.get('/sales')
      .then(response => setVendas(response.data))
      .catch(error => console.error("Erro ao buscar vendas:", error));
  }, []);

  const totalFaturamento = vendas.reduce((acc, venda) => acc + parseFloat(venda.total_amount), 0);

  // --- LÓGICA DE FILTRO DE DATAS ---
  const filtrarVendasPorPeriodo = (periodo) => {
    const agora = new Date();
    const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const inicioSemana = new Date(inicioHoje);
    inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

    return vendas.filter(venda => {
      const dataVenda = new Date(venda.created_at);
      if (periodo === 'Diário') return dataVenda >= inicioHoje;
      if (periodo === 'Semanal') return dataVenda >= inicioSemana;
      if (periodo === 'Mensal') return dataVenda >= inicioMes;
      return true;
    });
  };

  // --- CÁLCULOS DO FLUXO DE CAIXA ---
  const vendasFluxo = filtrarVendasPorPeriodo(periodoFluxo);
  const totalFaturamentoFluxo = vendasFluxo.reduce((acc, venda) => acc + parseFloat(venda.total_amount), 0);
  const totaisPorMetodo = vendasFluxo.reduce((acc, venda) => {
    const metodo = venda.payment_method || 'Dinheiro';
    acc[metodo] = (acc[metodo] || 0) + parseFloat(venda.total_amount);
    return acc;
  }, { 'Pix': 0, 'Dinheiro': 0, 'Débito': 0, 'Crédito': 0 });

  // --- CÁLCULOS DE DESEMPENHO E LUCRO ---
  const vendasDesempenho = filtrarVendasPorPeriodo(periodoDesempenho);
  
  let receitaTotal = 0;
  let custoTotal = 0;
  const contagemProdutos = {};

  vendasDesempenho.forEach(venda => {
    receitaTotal += parseFloat(venda.total_amount);
    
    if (venda.items) {
      venda.items.forEach(item => {
        // Soma do custo (quantidade * preço de custo)
        custoTotal += (item.quantity * parseFloat(item.cost_price || 0));
        
        // Contagem para o ranking de mais vendidos
        if (contagemProdutos[item.name]) {
          contagemProdutos[item.name] += item.quantity;
        } else {
          contagemProdutos[item.name] = item.quantity;
        }
      });
    }
  });

  const lucroBruto = receitaTotal - custoTotal;
  const margemLucro = receitaTotal > 0 ? (lucroBruto / receitaTotal) * 100 : 0;

  // Transforma o objeto de contagem em um array ordenado (Ranking)
  const rankingProdutos = Object.entries(contagemProdutos)
    .map(([nome, quantidade]) => ({ nome, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade);

  // --- FUNÇÕES DE MODAL (DETALHES) ---
  const abrirModal = (venda) => {
    setVendaSelecionada(venda);
    setIsModalOpen(true);
  };

  const fecharModal = () => {
    setIsModalOpen(false);
    setVendaSelecionada(null);
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2>Controle Financeiro</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setIsModalFluxoOpen(true)}
            style={{ padding: '12px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            📊 FLUXO DE CAIXA
          </button>
          <button 
            onClick={() => setIsModalDesempenhoOpen(true)}
            style={{ padding: '12px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            📈 DESEMPENHO E LUCRO
          </button>
        </div>
      </div>
      
      {/* Resumo Geral da Tela */}
      <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #dee2e6' }}>
        <h3 style={{ margin: 0, color: '#495057' }}>Faturamento Histórico (Bruto)</h3>
        <h1 style={{ margin: '10px 0 0 0', color: '#333' }}>R$ {totalFaturamento.toFixed(2)}</h1>
      </div>
      
      <h3>Histórico de Transações (Apenas Vendas Fechadas)</h3>
      <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '10px' }}>
        <thead>
          <tr style={{ background: '#f4f4f4' }}>
            <th>ID da Venda</th>
            <th>Data e Hora</th>
            <th>Forma de Pgto.</th>
            <th>Valor da Venda</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {vendas.length === 0 ? (
            <tr><td colSpan="5" style={{ textAlign: 'center' }}>Nenhuma venda registrada.</td></tr>
          ) : (
            vendas.map(venda => (
              <tr key={venda.id}>
                <td>#{venda.id}</td>
                <td>{new Date(venda.created_at).toLocaleString('pt-BR')}</td>
                <td>
                  <span style={{ background: '#e9ecef', padding: '3px 8px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold' }}>
                    {venda.payment_method || 'Dinheiro'}
                  </span>
                </td>
                <td>R$ {parseFloat(venda.total_amount).toFixed(2)}</td>
                <td>
                  <button 
                    onClick={() => abrirModal(venda)}
                    style={{ background: '#17a2b8', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Ver Detalhes
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* ========================================== */}
      {/* MODAL 1: FLUXO DE CAIXA */}
      {/* ========================================== */}
      {isModalFluxoOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '8px', width: '100%', maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Fluxo de Caixa</h2>
              <button onClick={() => setIsModalFluxoOpen(false)} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
              {['Diário', 'Semanal', 'Mensal'].map(periodo => (
                <button 
                  key={periodo} onClick={() => setPeriodoFluxo(periodo)}
                  style={{ flex: 1, padding: '10px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', border: 'none', background: periodoFluxo === periodo ? '#007bff' : '#e9ecef', color: periodoFluxo === periodo ? 'white' : '#333' }}
                >
                  {periodo}
                </button>
              ))}
            </div>

            <div style={{ background: '#d4edda', padding: '20px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', color: '#155724' }}>
              <p style={{ margin: '0 0 5px 0', fontSize: '16px' }}>Total Recebido ({periodoFluxo})</p>
              <h1 style={{ margin: 0 }}>R$ {totalFaturamentoFluxo.toFixed(2)}</h1>
            </div>

            <h4 style={{ borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Entradas por Método de Pagamento</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '15px' }}>
              {Object.entries(totaisPorMetodo).map(([metodo, valor]) => (
                <div key={metodo} style={{ flex: '1 1 45%', background: '#f8f9fa', padding: '15px', borderRadius: '4px', border: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ color: '#495057' }}>{metodo}</strong>
                  <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#007bff' }}>R$ {valor.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 2: DESEMPENHO E LUCRO (NOVO) */}
      {/* ========================================== */}
      {isModalDesempenhoOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '8px', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Desempenho Estratégico</h2>
              <button onClick={() => setIsModalDesempenhoOpen(false)} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
              {['Diário', 'Semanal', 'Mensal'].map(periodo => (
                <button 
                  key={periodo} onClick={() => setPeriodoDesempenho(periodo)}
                  style={{ flex: 1, padding: '10px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', border: 'none', background: periodoDesempenho === periodo ? '#28a745' : '#e9ecef', color: periodoDesempenho === periodo ? 'white' : '#333' }}
                >
                  {periodo}
                </button>
              ))}
            </div>

            {/* Painel de Lucro */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <div style={{ flex: 1, background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                <small style={{ color: '#6c757d', fontWeight: 'bold' }}>Receita Bruta</small>
                <h3 style={{ margin: '5px 0 0 0' }}>R$ {receitaTotal.toFixed(2)}</h3>
              </div>
              <div style={{ flex: 1, background: '#fff3cd', padding: '15px', borderRadius: '8px', border: '1px solid #ffeeba', textAlign: 'center' }}>
                <small style={{ color: '#856404', fontWeight: 'bold' }}>Custo dos Produtos</small>
                <h3 style={{ margin: '5px 0 0 0', color: '#856404' }}>- R$ {custoTotal.toFixed(2)}</h3>
              </div>
              <div style={{ flex: 1, background: '#d4edda', padding: '15px', borderRadius: '8px', border: '1px solid #c3e6cb', textAlign: 'center' }}>
                <small style={{ color: '#155724', fontWeight: 'bold' }}>Lucro Bruto</small>
                <h3 style={{ margin: '5px 0 0 0', color: '#155724' }}>R$ {lucroBruto.toFixed(2)}</h3>
              </div>
            </div>

            <div style={{ background: '#e2e3e5', padding: '10px', borderRadius: '4px', textAlign: 'center', marginBottom: '30px' }}>
              <strong>Margem de Lucro Média: </strong> 
              <span style={{ fontSize: '18px', color: margemLucro >= 30 ? '#28a745' : '#dc3545', fontWeight: 'bold' }}>
                {margemLucro.toFixed(2)}%
              </span>
            </div>

            {/* Curva ABC / Mais Vendidos */}
            <h4 style={{ borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Top Produtos Mais Vendidos ({periodoDesempenho})</h4>
            <ul style={{ listStyle: 'none', padding: 0, maxHeight: '200px', overflowY: 'auto' }}>
              {rankingProdutos.length === 0 ? (
                <p style={{ color: '#666' }}>Nenhum produto vendido neste período.</p>
              ) : (
                rankingProdutos.map((prod, index) => (
                  <li key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #f4f4f4', background: index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                    <span><strong>{index + 1}º</strong> {prod.nome}</span>
                    <span style={{ background: '#007bff', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                      {prod.quantidade} un.
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 3: DETALHES DA VENDA */}
      {/* ========================================== */}
      {isModalOpen && vendaSelecionada && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1050 }}>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '8px', width: '100%', maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Venda #{vendaSelecionada.id}</h3>
              <button onClick={fecharModal} style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
            </div>
            
            <p><strong>Pagamento:</strong> {vendaSelecionada.payment_method || 'Dinheiro'}</p>
            <p><strong>Total Pago:</strong> R$ {parseFloat(vendaSelecionada.total_amount).toFixed(2)}</p>
            
            <h4 style={{ marginTop: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Itens</h4>
            <ul style={{ listStyle: 'none', padding: 0, maxHeight: '250px', overflowY: 'auto' }}>
              {vendaSelecionada.items && vendaSelecionada.items.map((item, index) => (
                <li key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f4f4f4' }}>
                  <span><strong>{item.quantity}x</strong> {item.name}</span>
                  <span>R$ {(parseFloat(item.unit_price) * item.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}