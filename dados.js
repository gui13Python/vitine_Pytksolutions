/* =========================================================
   Base de referência de pagadoras de dividendos (B3)
   ATENÇÃO: valores ilustrativos para preencher o simulador
   rapidamente. Não são cotações em tempo real — sempre
   confira o preço e o DY atuais antes de decidir algo.
   ========================================================= */
const ATIVOS_REFERENCIA = [
  // Energia
  { ticker:"TAEE11", nome:"Taesa (units)",      preco:36.80, dy:9.8,  setor:"Energia" },
  { ticker:"TAEE3",  nome:"Taesa ON",           preco:12.10, dy:9.6,  setor:"Energia" },
  { ticker:"TAEE4",  nome:"Taesa PN",           preco:12.35, dy:9.9,  setor:"Energia" },
  { ticker:"TRPL4",  nome:"ISA CTEEP",          preco:10.40, dy:8.6,  setor:"Energia" },
  { ticker:"CMIG4",  nome:"Cemig PN",           preco:11.60, dy:8.1,  setor:"Energia" },
  { ticker:"CMIG3",  nome:"Cemig ON",           preco:11.20, dy:8.0,  setor:"Energia" },
  { ticker:"EGIE3",  nome:"Engie Brasil",       preco:42.30, dy:7.4,  setor:"Energia" },
  { ticker:"CPFE3",  nome:"CPFL Energia",       preco:36.50, dy:7.8,  setor:"Energia" },
  { ticker:"ELET3",  nome:"Eletrobras ON",      preco:41.20, dy:3.5,  setor:"Energia" },
  { ticker:"AURE3",  nome:"Auren Energia",      preco:13.80, dy:8.2,  setor:"Energia" },
  { ticker:"ALUP11", nome:"Alupar (units)",     preco:29.60, dy:6.9,  setor:"Energia" },
  // Financeiro
  { ticker:"ITSA4",  nome:"Itaúsa",             preco:10.90, dy:6.8,  setor:"Financeiro" },
  { ticker:"BBAS3",  nome:"Banco do Brasil",    preco:26.50, dy:9.2,  setor:"Financeiro" },
  { ticker:"BBSE3",  nome:"BB Seguridade",      preco:34.10, dy:8.9,  setor:"Financeiro" },
  { ticker:"SANB11", nome:"Santander Brasil",   preco:29.40, dy:7.0,  setor:"Financeiro" },
  { ticker:"BBDC4",  nome:"Bradesco PN",        preco:14.30, dy:6.5,  setor:"Financeiro" },
  { ticker:"ITUB4",  nome:"Itaú Unibanco PN",   preco:34.80, dy:5.9,  setor:"Financeiro" },
  { ticker:"PSSA3",  nome:"Porto Seguro",       preco:32.10, dy:7.1,  setor:"Financeiro" },
  { ticker:"BRSR6",  nome:"Banrisul PNB",       preco:14.60, dy:8.4,  setor:"Financeiro" },
  // Petróleo, mineração e siderurgia
  { ticker:"PETR4",  nome:"Petrobras PN",       preco:37.20, dy:12.5, setor:"Petróleo" },
  { ticker:"PETR3",  nome:"Petrobras ON",       preco:39.10, dy:12.1, setor:"Petróleo" },
  { ticker:"VALE3",  nome:"Vale",               preco:61.50, dy:8.3,  setor:"Mineração" },
  { ticker:"CSNA3",  nome:"CSN",                preco:12.80, dy:6.2,  setor:"Siderurgia" },
  { ticker:"GGBR4",  nome:"Gerdau PN",          preco:19.40, dy:6.7,  setor:"Siderurgia" },
  // Papel e celulose
  { ticker:"KLBN11", nome:"Klabin (units)",     preco:21.30, dy:5.9,  setor:"Papel e Celulose" },
  { ticker:"KLBN4",  nome:"Klabin PN",          preco:5.30,  dy:5.7,  setor:"Papel e Celulose" },
  { ticker:"SUZB3",  nome:"Suzano",             preco:53.20, dy:3.8,  setor:"Papel e Celulose" },
  // Seguros
  { ticker:"WIZC3",  nome:"Wiz Co",             preco:7.80,  dy:8.4,  setor:"Seguros" },
  { ticker:"CXSE3",  nome:"Caixa Seguridade",   preco:15.60, dy:8.7,  setor:"Seguros" },
  // Telecom e saneamento
  { ticker:"VIVT3",  nome:"Telefônica Vivo",    preco:47.90, dy:7.6,  setor:"Telecom" },
  { ticker:"TIMS3",  nome:"TIM",                preco:18.60, dy:5.4,  setor:"Telecom" },
  { ticker:"SBSP3",  nome:"Sabesp",             preco:97.30, dy:4.1,  setor:"Saneamento" },
  { ticker:"CSMG3",  nome:"Copasa",             preco:23.10, dy:6.8,  setor:"Saneamento" },
  // FIIs
  { ticker:"HGLG11", nome:"CSHG Logística FII", preco:167.00,dy:8.9,  setor:"FII - Logística" },
  { ticker:"MXRF11", nome:"Maxi Renda FII",     preco:10.20, dy:11.3, setor:"FII - Papel" },
  { ticker:"KNRI11", nome:"Kinea Renda Imob.",  preco:150.00,dy:8.0,  setor:"FII - Híbrido" },
  { ticker:"XPLG11", nome:"XP Log FII",         preco:98.50, dy:8.7,  setor:"FII - Logística" },
  { ticker:"VISC11", nome:"Vinci Shoppings",    preco:112.00,dy:8.3,  setor:"FII - Shoppings" },
  { ticker:"BTLG11", nome:"BTG Pactual Logíst.",preco:100.00,dy:8.5,  setor:"FII - Logística" },
];

// Busca a cotação em tempo real de QUALQUER ticker via brapi.dev.
// Retorna { preco, nome } ou null se não conseguir (sem token, ticker
// inválido, rate limit, etc — nesses casos o usuário preenche na mão).
async function buscarCotacaoOnline(ticker){
  const token = localStorage.getItem('redividendos_brapi_token') || '';
  const url = `https://brapi.dev/api/quote/${encodeURIComponent(ticker)}${token ? '?token='+encodeURIComponent(token) : ''}`;
  try{
    const resp = await fetch(url);
    if(!resp.ok) return null;
    const dados = await resp.json();
    const item = dados && dados.results && dados.results[0];
    if(!item || typeof item.regularMarketPrice !== 'number') return null;
    return { preco: item.regularMarketPrice, nome: item.longName || item.shortName || ticker };
  }catch(e){
    console.warn('Não foi possível buscar cotação online:', e);
    return null;
  }
}
