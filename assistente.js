const CHAVE_GROQ_STORAGE = 'redividendos_groq_key_b64';

// obfuscação simples (não é criptografia de verdade, só evita texto plano cru)
function ofuscar(txt){ return btoa(unescape(encodeURIComponent(txt))); }
function desofuscar(txt){ try{ return decodeURIComponent(escape(atob(txt))); }catch(e){ return ''; } }

function carregarGroqKey(){
  const raw = localStorage.getItem(CHAVE_GROQ_STORAGE);
  return raw ? desofuscar(raw) : '';
}
function salvarGroqKey(key){
  localStorage.setItem(CHAVE_GROQ_STORAGE, ofuscar(key));
}

function montarConfigGroq(){
  const input = document.getElementById('groqKey');
  input.value = carregarGroqKey();

  document.getElementById('btnSalvarGroqKey').addEventListener('click', ()=>{
    salvarGroqKey(input.value.trim());
    const btn = document.getElementById('btnSalvarGroqKey');
    btn.textContent = 'Salva ✓';
    setTimeout(()=>{ btn.textContent = 'Salvar chave'; }, 1500);
  });

  document.getElementById('btnResetarGroqKey').addEventListener('click', ()=>{
    if(!confirm('Isso apaga a chave da Groq salva neste navegador. Continuar?')) return;
    localStorage.removeItem(CHAVE_GROQ_STORAGE);
    input.value = '';
  });
}

function montarPrompt(perfil){
  const universo = ATIVOS_REFERENCIA.map(a=>
    `${a.ticker} (${a.nome}, setor ${a.setor}, preço ref. R$${a.preco.toFixed(2)}, DY ref. ${a.dy.toFixed(1)}%)`
  ).join('; ');

  return `Você é um assistente que sugere composições de carteira de dividendos na bolsa brasileira (B3), com fins educativos.

Perfil do investidor:
- Objetivo: ${perfil.objetivo}
- Valor mensal disponível: R$ ${perfil.valorMensal}
- Horizonte: ${perfil.horizonte} anos
- Tolerância a risco: ${perfil.risco}
- Setores de interesse: ${perfil.setores || 'qualquer setor'}
- Quantidade de ativos desejada: ${perfil.qtdAtivos}

Universo de referência (priorize estes, mas pode citar outros ativos conhecidos da B3 se fizer muito sentido para o perfil, deixando claro que o preço/DY precisa ser conferido): ${universo}

Responda SOMENTE em formato JSON, com esta estrutura exata:
{
  "resumo": "um parágrafo curto (até 400 caracteres) explicando a lógica geral da sugestão",
  "sugestoes": [
    { "ticker": "XXXX3", "nome": "Nome da empresa", "setor": "Setor", "percentual": 20, "justificativa": "até 200 caracteres explicando por que esse ativo entra na carteira para esse perfil" }
  ]
}
Os percentuais devem somar aproximadamente 100. Não inclua texto fora do JSON.`;
}

async function chamarGroq(prompt, apiKey){
  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role:'system', content:'Você responde sempre em JSON válido, em português do Brasil, e nunca inclui texto fora do JSON.' },
        { role:'user', content: prompt },
      ],
      temperature: 0.4,
      response_format: { type:'json_object' },
    }),
  });

  if(!resp.ok){
    const texto = await resp.text().catch(()=> '');
    throw new Error(`Groq respondeu ${resp.status}: ${texto.slice(0,200)}`);
  }
  const dados = await resp.json();
  const conteudo = dados.choices && dados.choices[0] && dados.choices[0].message && dados.choices[0].message.content;
  if(!conteudo) throw new Error('Resposta da IA veio vazia.');
  return JSON.parse(conteudo);
}

function renderizarResultadoIA(json){
  const area = document.getElementById('areaResultadoIA');
  const sugestoes = Array.isArray(json.sugestoes) ? json.sugestoes : [];

  if(sugestoes.length === 0){
    area.innerHTML = `<div class="empty"><h3>A IA não retornou sugestões</h3><p>Tente gerar novamente ou ajuste o perfil.</p></div>`;
    return;
  }

  const cards = sugestoes.map(s=>{
    const referencia = ATIVOS_REFERENCIA.find(a=>a.ticker === (s.ticker||'').toUpperCase());
    return `
      <div class="card" style="margin-bottom:14px;">
        <div style="display:flex; justify-content:space-between; align-items:baseline; gap:12px;">
          <h3 style="margin-bottom:2px;">${(s.ticker||'').toUpperCase()}</h3>
          <span class="badge">${s.percentual != null ? formatarNum(s.percentual,0)+'% da carteira' : ''}</span>
        </div>
        <p class="small" style="margin-bottom:8px;">${s.nome || ''}${s.setor ? ' · '+s.setor : ''}${referencia ? ' · preço ref. '+formatarBRL(referencia.preco)+' · DY ref. '+formatarNum(referencia.dy,1)+'%' : ' · confira cotação e DY atuais'}</p>
        <p style="margin-bottom:0;">${s.justificativa || ''}</p>
      </div>`;
  }).join('');

  area.innerHTML = `
    <div class="panel" style="margin-bottom:20px;">
      <div class="badge" style="margin-bottom:10px;">Resumo da IA</div>
      <p style="margin-bottom:0;">${json.resumo || ''}</p>
    </div>
    ${cards}
    <p class="small">Sugestão gerada por IA a partir do perfil informado. Não é recomendação de investimento — confira cotações, DY e fundamentos atuais antes de decidir.</p>
  `;
}

async function gerarSugestaoClique(){
  const apiKey = carregarGroqKey();
  const area = document.getElementById('areaResultadoIA');
  const btn = document.getElementById('btnGerarSugestao');

  if(!apiKey){
    area.innerHTML = `<div class="empty"><h3>Falta cadastrar sua chave da Groq</h3><p>Abra "Configurar chave da API Groq" ao lado, cole sua chave gratuita e salve.</p></div>`;
    return;
  }

  const perfil = {
    objetivo: document.getElementById('iaObjetivo').value,
    valorMensal: document.getElementById('iaValorMensal').value,
    horizonte: document.getElementById('iaHorizonte').value,
    risco: document.getElementById('iaRisco').value,
    setores: document.getElementById('iaSetores').value.trim(),
    qtdAtivos: document.getElementById('iaQtdAtivos').value,
  };

  btn.disabled = true;
  const textoOriginal = btn.textContent;
  btn.textContent = 'Gerando sugestão...';
  area.innerHTML = `<div class="empty"><h3>Pensando...</h3><p>A IA está montando sua sugestão, leva só alguns segundos.</p></div>`;

  try{
    const prompt = montarPrompt(perfil);
    const json = await chamarGroq(prompt, apiKey);
    renderizarResultadoIA(json);
  }catch(e){
    console.error(e);
    area.innerHTML = `<div class="empty"><h3>Não deu pra gerar a sugestão</h3><p>${(e.message||'Erro desconhecido').replace(/</g,'&lt;')}</p><p class="small">Confira se a chave da Groq está correta e se você tem créditos/limite disponível.</p></div>`;
  }finally{
    btn.disabled = false;
    btn.textContent = textoOriginal;
  }
}

document.addEventListener('DOMContentLoaded', ()=>{
  montarConfigGroq();
  document.getElementById('btnGerarSugestao').addEventListener('click', gerarSugestaoClique);
});
