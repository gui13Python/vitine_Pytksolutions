/* ============================================================
   PyTK Solutions — Catálogo de utilitários
   ------------------------------------------------------------
   Para adicionar um novo produto no futuro, basta copiar um
   objeto da lista PRODUCTS abaixo, preencher os campos e
   salvar. O card aparece automaticamente na vitrine, sem
   precisar mexer no HTML ou no CSS.

   Campos:
   - code:      código do catálogo, ex: "PYTK-002" (mostrado no topo do card)
   - name:      nome do produto
   - tagline:   descrição curta (1 linha)
   - icon:      um emoji ou caractere que represente o produto
   - price:     texto do preço, ex: "R$ 37,00". Deixe "" se ainda não tiver preço.
   - status:    "disponivel" ou "em-breve"
   - url:       link para a página do produto. Use "#" enquanto não tiver.
   ============================================================ */

const PRODUCTS = [
  {
    code: "PYTK-001",
    name: "Tecla Ghost Fix",
    tagline: "Bloqueia ou remapeia teclas com defeito sem trocar o teclado.",
    icon: "⌘",
    price: "R$ 37,00",
    status: "disponivel",
    url: "https://www.pytksolutions.com.br/"
  },
  {
    code: "PYTK-002",
    name: "Próximo utilitário",
    tagline: "Mais um programa da oficina está sendo desenvolvido no momento.",
    icon: "⚙",
    price: "",
    status: "em-breve",
    url: "#"
  },
  {
    code: "PYTK-003",
    name: "Vaga na oficina",
    tagline: "Tem uma ideia de utilitário? Esse espaço pode ser o próximo.",
    icon: "＋",
    price: "",
    status: "em-breve",
    url: "#"
  }
];

function createCard(product) {
  const isAvailable = product.status === "disponivel";

  const card = document.createElement("article");
  card.className = "card" + (isAvailable ? "" : " is-placeholder");

  const statusLabel = isAvailable ? "Disponível" : "Em breve";
  const statusClass = isAvailable ? "disponivel" : "em-breve";

  const priceHtml = product.price
    ? `<span class="card-price">${product.price}</span>`
    : `<span class="card-price"></span>`;

  const ctaHtml = isAvailable
    ? `<a class="card-cta" href="${product.url}" target="_blank" rel="noopener noreferrer">Ver produto →</a>`
    : `<span class="card-cta is-disabled">Em construção</span>`;

  card.innerHTML = `
    <div class="card-tab">
      <span class="card-code">${product.code}</span>
      <span class="card-status ${statusClass}">${statusLabel}</span>
    </div>
    <div class="card-perf" aria-hidden="true"></div>
    <div class="card-body">
      <div class="card-icon">${product.icon}</div>
      <h3>${product.name}</h3>
      <p>${product.tagline}</p>
      <div class="card-footer">
        ${priceHtml}
        ${ctaHtml}
      </div>
    </div>
  `;

  return card;
}

function renderCatalog() {
  const grid = document.getElementById("catalog-grid");
  if (!grid) return;

  grid.innerHTML = "";
  PRODUCTS.forEach((product) => {
    grid.appendChild(createCard(product));
  });
}

function renderStats() {
  const disponivelEl = document.getElementById("stat-disponivel");
  const construcaoEl = document.getElementById("stat-construcao");
  if (!disponivelEl || !construcaoEl) return;

  const disponivel = PRODUCTS.filter((p) => p.status === "disponivel").length;
  const construcao = PRODUCTS.filter((p) => p.status === "em-breve").length;

  disponivelEl.textContent = disponivel;
  construcaoEl.textContent = construcao;
}

document.addEventListener("DOMContentLoaded", () => {
  renderCatalog();
  renderStats();
});