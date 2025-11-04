// Config
const API = "https://jms-server-v15d.onrender.com/api";
const grid = document.getElementById("gridProdutos");
const resultCount = document.getElementById("resultCount");
const emptyState = document.getElementById("emptyState");
const cartQty = document.getElementById("cartQty");
const priceMode = document.getElementById("priceMode");

// Estado
let produtos = [];
let filtrados = [];
let carrinho = JSON.parse(localStorage.getItem("carrinhoJMS") || "[]");

// Utils
const fmt = (n) => `R$ ${Number(n).toFixed(2).replace(".", ",")}`;
const setCartQty = () => { cartQty.textContent = carrinho.reduce((a,b)=>a+(b.qty||1),0) || 0; }
const setYear = () => { document.getElementById("year").textContent = new Date().getFullYear(); };

function priceByMode(p){
  switch(priceMode.value){
    case "varejo-cartao": return p.precoVarejoCartao ?? p.precoVarejoDinheiro;
    case "atacado-dinheiro": return p.precoAtacadoDinheiro ?? p.precoVarejoDinheiro;
    case "atacado-cartao": return p.precoAtacadoCartao ?? p.precoAtacadoDinheiro;
    default: return p.precoVarejoDinheiro ?? p.precoVarejoCartao;
  }
}

// Renderização
// Renderização
function render(list){
  grid.innerHTML = "";
  resultCount.textContent = list.length ? `${list.length} produto(s)` : "";
  emptyState.classList.toggle("hidden", list.length > 0);

  list.forEach(p=>{
    const price = priceByMode(p);
    const card = document.createElement("article");
    card.className = "card-product";
    card.innerHTML = `
      <div class="card-media">
        ${p.fotos ? `<img src="${p.fotos}" alt="${p.nome}">` : "Sem imagem"}
      </div>
      <div class="card-body">
        <div class="code">${p.codigo}</div>
        <div class="title">${p.nome}</div>
        <div class="price">${fmt(price)}</div>
        <div class="line"></div>
        <div class="card-actions">
          <button class="btn-gold add" data-cod="${p.codigo}">Adicionar</button>
          <button class="btn-small details" data-cod="${p.codigo}">Detalhes</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  // evento para botão de adicionar
  grid.querySelectorAll(".add").forEach(btn => {
  btn.addEventListener("click", () => {
    const cod = btn.dataset.cod;
    const item = list.find(x => x.codigo === cod);
    if (!item) return alert("Produto não encontrado.");

    const estoque = Number(item.estoque) || 0; // ✅ garante número
    const found = carrinho.find(x => x.codigo === cod);

    if (found) {
      if (found.qty < estoque) {
        found.qty++;
      } else {
        alert(`⚠️ Estoque máximo atingido (${estoque} unidades disponíveis).`);
        return;
      }
    } else {
      if (estoque > 0) {
        carrinho.push({ ...item, qty: 1 });
      } else {
        alert("❌ Produto sem estoque disponível.");
        return;
      }
    }

    localStorage.setItem("carrinhoJMS", JSON.stringify(carrinho));
    setCartQty();
  });
});


  // evento para botão de detalhes → redireciona para página do produto
  grid.querySelectorAll(".details").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const cod = btn.dataset.cod;
      window.location.href = `product.html?codigo=${encodeURIComponent(cod)}`;
    });
  });
}


// Filtros
function applyFilters(){
  const q = document.getElementById("searchInput").value.trim().toLowerCase();
  const active = document.querySelector(".main-nav .nav-link[aria-current='page']")?.dataset.section || "todos";

  filtrados = produtos.filter(p=>{
    const textOK = !q || p.nome.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q);
    // por enquanto seção é fictícia — se quiser, salve p.secao no backend e filtre aqui:
    const secOK = active==="todos" || (p.secao||"todos")===active;
    return textOK && secOK;
  });

  render(filtrados);
}

// Eventos de navegação e busca
document.querySelectorAll(".main-nav .nav-link").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    document.querySelectorAll(".main-nav .nav-link").forEach(b=>b.removeAttribute("aria-current"));
    btn.setAttribute("aria-current","page");
    applyFilters();
  });
});

document.getElementById("searchBtn").addEventListener("click", applyFilters);
document.getElementById("searchInput").addEventListener("keydown", (e)=>{ if(e.key==="Enter") applyFilters(); });
priceMode.addEventListener("change", ()=> render(filtrados));

// Footer links disparam filtro de seção
document.querySelectorAll(".footer-link[data-section]").forEach(a=>{
  a.addEventListener("click",(e)=>{
    e.preventDefault();
    const sec = a.dataset.section;
    const btn = document.querySelector(`.main-nav .nav-link[data-section="${sec}"]`);
    if(btn) btn.click();
  });
});

// Mock conta/carrinho
// Redirecionar para a página de login/registro
document.getElementById("btnAccount").addEventListener("click", () => {
  window.location.href = "login.html";
});

// Redirecionar para a página do carrinho
document.getElementById("btnCart").addEventListener("click", () => {
  window.location.href = "carrinho.html";
});


// Newsletter
document.getElementById("newsForm").addEventListener("submit",(e)=>{
  e.preventDefault();
  alert("Obrigado! Você foi inscrito.");
  e.target.reset();
});

// Boot
(async function init(){
  setYear(); setCartQty();

  try{
    const res = await fetch(`${API}/produtos`);
    produtos = await res.json();

    // garante números
produtos = produtos.map(p => ({
  ...p,
  estoque: Number(p.estoque || 0), // ✅ converte estoque corretamente
  precoVarejoDinheiro: Number(p.precoVarejoDinheiro || 0),
  precoVarejoCartao: Number(p.precoVarejoCartao || 0),
  precoAtacadoDinheiro: Number(p.precoAtacadoDinheiro || 0),
  precoAtacadoCartao: Number(p.precoAtacadoCartao || 0),
}));

    // inicia com “Todos”
    document.querySelector('.main-nav .nav-link[data-section="todos"]').click();
  }catch(err){
    console.error(err);
    emptyState.classList.remove("hidden");
    emptyState.textContent = "Erro ao carregar catálogo.";
  }
})();
