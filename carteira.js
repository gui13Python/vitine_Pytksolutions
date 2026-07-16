const CHAVE_STORAGE = 'redividendos_carteira';

function carregarCarteira(){
  try{
    const raw = localStorage.getItem(CHAVE_STORAGE);
    return raw ? JSON.parse(raw) : [];
  }catch(e){
    console.error('Não foi possível ler a carteira salva:', e);
    return [];
  }
}
function salvarCarteira(lista){
  localStorage.setItem(CHAVE_STORAGE, JSON.stringify(lista));
}

function montarChipsSugestoes(){
  const el = document.getElementById('chipsSugestoes');
  el.innerHTML = ATIVOS_REFERENCIA.map(a=>
    `<span class="chip" data-ticker="${a.ticker}">${a.ticker} <small>DY ${formatarNum(a.dy,1)}%</small></span>`
  ).join('');
  el.addEventListener('click', (ev)=>{
    const chip = ev.target.closest('.chip');
    if(!chip) return;
    const a = ATIVOS_REFERENCIA.find(x=>x.ticker === chip.dataset.ticker);
    document.getElementById('cTicker').value = a.ticker;
    document.getElementById('cPrecoMedio').value = a.preco.toFixed(2);
    document.getElementById('cPrecoAtual').value = a.preco.toFixed(2);
    document.getElementById('cDy').value = a.dy.toFixed(1);
    document.getElementById('cQtd').focus();
  });
}

function preencherViaQueryString(){
  const params = new URLSearchParams(window.location.search);
  if(params.get('add') !== '1') return;
  if(params.get('ticker')) document.getElementById('cTicker').value = params.get('ticker');
  if(params.get('qtd')) document.getElementById('cQtd').value = params.get('qtd');
  if(params.get('preco')){
    document.getElementById('cPrecoMedio').value = params.get('preco');
    document.getElementById('cPrecoAtual').value = params.get('preco');
  }
  if(params.get('dy')) document.getElementById('cDy').value = params.get('dy');
  document.getElementById('cTicker').scrollIntoView({behavior:'smooth', block:'center'});
}

function adicionarAtivo(){
  const ticker = document.getElementById('cTicker').value.trim().toUpperCase();
  const qtd = parseFloat(document.getElementById('cQtd').value);
  const precoMedio = parseFloat(document.getElementById('cPrecoMedio').value);
  const precoAtual = parseFloat(document.getElementById('cPrecoAtual').value) || precoMedio;
  const dy = parseFloat(document.getElementById('cDy').value) || 0;

  if(!ticker){ alert('Informe o ticker do ativo.'); return; }
  if(!qtd || qtd <= 0){ alert('Informe uma quantidade válida.'); return; }
  if(!precoMedio || precoMedio <= 0){ alert('Informe o preço médio pago.'); return; }

  const lista = carregarCarteira();
  lista.push({
    id: Date.now().toString(36),
    ticker, qtd, precoMedio, precoAtual, dy
  });
  salvarCarteira(lista);
  limparFormulario();
  renderizarCarteira();
}

function limparFormulario(){
  document.getElementById('cTicker').value = '';
  document.getElementById('cQtd').value = 100;
  document.getElementById('cPrecoMedio').value = '';
  document.getElementById('cPrecoAtual').value = '';
  document.getElementById('cDy').value = '';
}

function removerAtivo(id){
  if(!confirm('Remover este ativo da carteira?')) return;
  const lista = carregarCarteira().filter(a=>a.id !== id);
  salvarCarteira(lista);
  renderizarCarteira();
}

function renderizarCarteira(){
  const lista = carregarCarteira();
  const tbody = document.querySelector('#tabelaCarteira tbody');
  const vazio = document.getElementById('estadoVazio');
  const tabela = document.getElementById('tabelaCarteira');

  if(lista.length === 0){
    tabela.style.display = 'none';
    vazio.style.display = 'block';
  }else{
    tabela.style.display = 'table';
    vazio.style.display = 'none';
  }

  tbody.innerHTML = '';
  let totalInvestido = 0, totalAtual = 0, rendaMensal = 0;

  lista.forEach(a=>{
    const investido = a.qtd * a.precoMedio;
    const atual = a.qtd * a.precoAtual;
    const resultadoPct = investido > 0 ? ((atual-investido)/investido)*100 : 0;
    const rendaAnual = atual * (a.dy/100);
    const rendaMes = rendaAnual/12;

    totalInvestido += investido;
    totalAtual += atual;
    rendaMensal += rendaMes;

    const tr = document.createElement('tr');
    const classeResultado = resultadoPct >= 0 ? 'tag-up' : 'tag-down';
    tr.innerHTML = `
      <td><b>${a.ticker}</b></td>
      <td class="num">${formatarNum(a.qtd,0)}</td>
      <td class="num">${formatarBRL(a.precoMedio)}</td>
      <td class="num">${formatarBRL(a.precoAtual)}</td>
      <td class="num">${formatarBRL(investido)}</td>
      <td class="num">${formatarBRL(atual)}</td>
      <td class="num ${classeResultado}">${resultadoPct>=0?'+':''}${formatarNum(resultadoPct,1)}%</td>
      <td class="num">${formatarBRL(rendaMes)}</td>
      <td><button class="btn btn-danger btn-sm" data-id="${a.id}">Remover</button></td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('button[data-id]').forEach(btn=>{
    btn.addEventListener('click', ()=>removerAtivo(btn.dataset.id));
  });

  const resultadoTotalPct = totalInvestido > 0 ? ((totalAtual-totalInvestido)/totalInvestido)*100 : 0;
  document.getElementById('cardsCarteira').innerHTML = `
    <div class="stat-card paper"><div class="k">Total investido</div><div class="v">${formatarBRL(totalInvestido)}</div></div>
    <div class="stat-card"><div class="k">Valor atual</div><div class="v">${formatarBRL(totalAtual)}</div></div>
    <div class="stat-card ${resultadoTotalPct>=0?'gold':'paper'}"><div class="k">Resultado</div><div class="v">${resultadoTotalPct>=0?'+':''}${formatarNum(resultadoTotalPct,1)}%</div></div>
    <div class="stat-card"><div class="k">Renda passiva estimada/mês</div><div class="v">${formatarBRL(rendaMensal)}</div></div>
  `;
}

function montarConfigApi(){
  const input = document.getElementById('brapiToken');
  const btn = document.getElementById('btnSalvarToken');
  if(!input || !btn) return;
  input.value = localStorage.getItem('redividendos_brapi_token') || '';
  btn.addEventListener('click', ()=>{
    localStorage.setItem('redividendos_brapi_token', input.value.trim());
    btn.textContent = 'Salvo ✓';
    setTimeout(()=>{ btn.textContent = 'Salvar token'; }, 1500);
  });
}

async function buscarCotacaoClique(){
  const ticker = document.getElementById('cTicker').value.trim().toUpperCase();
  const status = document.getElementById('statusBusca');
  const btn = document.getElementById('btnBuscarCotacao');
  if(!ticker){ status.textContent = 'Informe o ticker primeiro.'; return; }

  btn.disabled = true;
  const textoOriginal = btn.textContent;
  btn.textContent = 'Buscando...';
  status.textContent = '';

  const resultado = await buscarCotacaoOnline(ticker);

  btn.disabled = false;
  btn.textContent = textoOriginal;

  if(resultado){
    document.getElementById('cPrecoAtual').value = resultado.preco.toFixed(2);
    if(!document.getElementById('cPrecoMedio').value){
      document.getElementById('cPrecoMedio').value = resultado.preco.toFixed(2);
    }
    status.textContent = `✓ ${resultado.nome}: ${formatarBRL(resultado.preco)}`;
    status.style.color = 'var(--green)';
  }else{
    status.textContent = 'Não encontrei esse ticker (ou faltou token/limite de requisições). Preencha o preço manualmente.';
    status.style.color = 'var(--brick)';
  }
}

document.addEventListener('DOMContentLoaded', ()=>{
  montarChipsSugestoes();
  preencherViaQueryString();
  montarConfigApi();
  document.getElementById('btnAdicionar').addEventListener('click', adicionarAtivo);
  document.getElementById('btnBuscarCotacao').addEventListener('click', buscarCotacaoClique);
  renderizarCarteira();
});
