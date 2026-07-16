function popularSelectAtivos(){
  const sel = document.getElementById('fAtivo');
  ATIVOS_REFERENCIA.forEach((a,i)=>{
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `${a.ticker} — ${a.nome} (DY ${formatarNum(a.dy,1)}%)`;
    sel.appendChild(opt);
  });
  const custom = document.createElement('option');
  custom.value = 'custom';
  custom.textContent = 'Outro ativo (informar manualmente)';
  sel.appendChild(custom);
}

function aoTrocarAtivo(){
  const sel = document.getElementById('fAtivo');
  const campoCustom = document.getElementById('campoTickerCustom');
  if(sel.value === 'custom'){
    campoCustom.style.display = 'block';
    return;
  }
  campoCustom.style.display = 'none';
  const a = ATIVOS_REFERENCIA[sel.value];
  document.getElementById('fPreco').value = a.preco.toFixed(2);
  document.getElementById('fDy').value = a.dy.toFixed(1);
}

async function buscarCotacaoSimClique(){
  const ticker = document.getElementById('fTickerCustom').value.trim().toUpperCase();
  const status = document.getElementById('statusBuscaSim');
  const btn = document.getElementById('btnBuscarCotacaoSim');
  if(!ticker){ status.textContent = 'Informe o ticker primeiro.'; return; }

  btn.disabled = true;
  const textoOriginal = btn.textContent;
  btn.textContent = 'Buscando...';
  status.textContent = '';

  const resultado = await buscarCotacaoOnline(ticker);

  btn.disabled = false;
  btn.textContent = textoOriginal;

  if(resultado){
    document.getElementById('fPreco').value = resultado.preco.toFixed(2);
    status.textContent = `✓ ${resultado.nome}: ${formatarBRL(resultado.preco)} — informe o DY manualmente.`;
    status.style.color = 'var(--green)';
  }else{
    status.textContent = 'Não encontrei esse ticker (ou faltou token/limite de requisições). Preencha o preço manualmente. Configure um token grátis na página Minha Carteira.';
    status.style.color = 'var(--brick)';
  }
}

function calcularSimulacao(){
  const qtdInicial = Math.max(parseFloat(document.getElementById('fQtd').value) || 0, 0);
  let preco = Math.max(parseFloat(document.getElementById('fPreco').value) || 0, 0.01);
  let dyPct = Math.max(parseFloat(document.getElementById('fDy').value) || 0, 0);
  const anos = Math.min(Math.max(parseInt(document.getElementById('fAnos').value) || 1, 1), 30);
  const valorizPct = parseFloat(document.getElementById('fValoriz').value) || 0;
  const crescPct = parseFloat(document.getElementById('fCresc').value) || 0;
  const aporteMensal = Math.max(parseFloat(document.getElementById('fAporte').value) || 0, 0);
  const reinveste = document.getElementById('fReinveste').checked;

  let acoes = qtdInicial;
  let dividendoPorAcao = preco * (dyPct/100);
  const valorInvestidoInicial = acoes * preco;
  let totalAportado = valorInvestidoInicial;
  let dividendosAcumulados = 0;

  const linhas = [];
  linhas.push({
    ano:0, acoes, preco, valor: acoes*preco, dividendoAno:0, dividendosAcumulados:0
  });

  for(let ano=1; ano<=anos; ano++){
    // dividendos pagos ao longo do ano, na quantidade de ações do início do ano
    const dividendoAno = acoes * dividendoPorAcao;
    dividendosAcumulados += dividendoAno;

    // aporte mensal compra ações ao preço do ano (simplificado, preço médio do ano)
    const aporteAno = aporteMensal * 12;
    totalAportado += aporteAno;
    let caixaParaComprar = aporteAno + (reinveste ? dividendoAno : 0);
    acoes += caixaParaComprar / preco;

    // reajusta preço e dividendo por ação para o próximo ano
    preco = preco * (1 + valorizPct/100);
    dividendoPorAcao = dividendoPorAcao * (1 + crescPct/100);

    linhas.push({
      ano, acoes, preco, valor: acoes*preco, dividendoAno, dividendosAcumulados
    });
  }

  renderizarResultados(linhas, valorInvestidoInicial, totalAportado, reinveste);
  atualizarLinkCarteira();
}

function atualizarLinkCarteira(){
  const link = document.getElementById('linkAddCarteira');
  if(!link) return;
  const sel = document.getElementById('fAtivo');
  const ticker = sel.value === 'custom' ? '' : ATIVOS_REFERENCIA[sel.value].ticker;
  const params = new URLSearchParams({
    add:'1',
    ticker: ticker,
    qtd: document.getElementById('fQtd').value,
    preco: document.getElementById('fPreco').value,
    dy: document.getElementById('fDy').value,
  });
  link.href = 'carteira.html?' + params.toString();
}

function renderizarResultados(linhas, valorInvestidoInicial, totalAportado, reinveste){
  const ultima = linhas[linhas.length-1];
  const rendaMensalEstimada = (ultima.dividendoAno || 0) / 12;

  document.getElementById('cardsResumo').innerHTML = `
    <div class="stat-card paper"><div class="k">Total investido</div><div class="v">${formatarBRL(totalAportado)}</div></div>
    <div class="stat-card"><div class="k">Valor final da carteira</div><div class="v">${formatarBRL(ultima.valor)}</div></div>
    <div class="stat-card gold"><div class="k">Dividendos acumulados</div><div class="v">${formatarBRL(ultima.dividendosAcumulados)}</div></div>
    <div class="stat-card paper"><div class="k">Renda passiva/mês (ano ${ultima.ano})</div><div class="v">${formatarBRL(rendaMensalEstimada)}</div></div>
  `;

  desenharBarras(document.getElementById('chartValor'),
    linhas.map(l=>({label:'Ano '+l.ano, valor:l.valor})), {cor:'#1F4D36'});

  desenharBarras(document.getElementById('chartDiv'),
    linhas.filter(l=>l.ano>0).map(l=>({label:'Ano '+l.ano, valor:l.dividendoAno})), {cor:'#C9A227'});

  const tbody = document.querySelector('#tabelaAnos tbody');
  tbody.innerHTML = '';
  linhas.forEach(l=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${l.ano === 0 ? 'Hoje' : 'Ano '+l.ano}</td>
      <td class="num">${formatarNum(l.acoes,2)}</td>
      <td class="num">${formatarBRL(l.preco)}</td>
      <td class="num">${formatarBRL(l.valor)}</td>
      <td class="num">${formatarBRL(l.dividendoAno)}</td>
      <td class="num tag-up">${formatarBRL(l.dividendosAcumulados)}</td>`;
    tbody.appendChild(tr);
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  popularSelectAtivos();
  document.getElementById('fAtivo').addEventListener('change', aoTrocarAtivo);
  document.getElementById('btnCalcular').addEventListener('click', calcularSimulacao);
  document.getElementById('btnBuscarCotacaoSim').addEventListener('click', buscarCotacaoSimClique);
  window.addEventListener('resize', ()=>{
    // redesenha gráficos ao redimensionar, se já houver dados
    if(document.querySelector('#tabelaAnos tbody').children.length) calcularSimulacao();
  });
  calcularSimulacao(); // roda com valores padrão ao carregar
});
