const API = "https://jms-server-v15d.onrender.com/api";
const urlParams = new URLSearchParams(window.location.search);
const codigo = urlParams.get("codigo");

const imgEl = document.getElementById("productImage");
const nameEl = document.getElementById("productName");
const codeEl = document.getElementById("productCode");
const descEl = document.getElementById("productDesc");
const varejoEl = document.getElementById("priceVarejo");
const atacadoEl = document.getElementById("priceAtacado");
const qtyInput = document.getElementById("qtyInput");
const cartQty = document.getElementById("cartQty");

let carrinho = JSON.parse(localStorage.getItem("carrinhoJMS") || "[]");
const fmt = (n) => `R$ ${Number(n).toFixed(2).replace(".", ",")}`;
const setYear = () => { document.getElementById("year").textContent = new Date().getFullYear(); };
const setCartQty = () => { cartQty.textContent = carrinho.reduce((a,b)=>a+(b.qty||1),0) || 0; };

// ================================
// Carregar produto
// ================================
(async ()=>{
  setYear(); setCartQty();

  if(!codigo){
    document.querySelector(".product-page").innerHTML = "<p style='color:#ccc;'>Produto não encontrado.</p>";
    return;
  }

  try{
    const res = await fetch(`${API}/produtos`);
    const produtos = await res.json();
    const p = produtos.find(x=>x.codigo===codigo);

    if(!p){
      document.querySelector(".product-page").innerHTML = "<p style='color:#ccc;'>Produto não encontrado.</p>";
      return;
    }

    imgEl.src = p.fotos;
    imgEl.alt = p.nome;
    nameEl.textContent = p.nome;
    codeEl.textContent = `Código: ${p.codigo}`;
    descEl.textContent = p.descricao || "Sem descrição";

// Mostrar/ocultar descrição
const toggleBtn = document.getElementById("toggleDesc");
let expanded = false;
toggleBtn.addEventListener("click", ()=>{
  expanded = !expanded;
  descEl.classList.toggle("expanded", expanded);
  toggleBtn.textContent = expanded ? "Ver menos" : "Ver mais";
});

// Produtos relacionados simples
const relatedGrid = document.getElementById("relatedGrid");
const relacionados = produtos.filter(x=>x.codigo!==codigo).slice(0,4);
relacionados.forEach(r=>{
  relatedGrid.insertAdjacentHTML("beforeend", `
    <div class="card-product">
      <img src="${r.fotos}" alt="${r.nome}">
      <p>${r.nome}</p>
      <button onclick="window.location.href='product.html?codigo=${encodeURIComponent(r.codigo)}'" class="btn-small">Ver</button>
    </div>
  `);
});

    varejoEl.textContent = `${fmt(p.precoVarejoDinheiro)} (dinheiro) / ${fmt(p.precoVarejoCartao)} (cartão)`;
    atacadoEl.textContent = `${fmt(p.precoAtacadoDinheiro)} (dinheiro) / ${fmt(p.precoAtacadoCartao)} (cartão)`;

    // botão adicionar
    document.getElementById("addToCart").addEventListener("click", ()=>{
      const qty = Number(qtyInput.value) || 1;
      const preco = qty >= 5 ? p.precoAtacadoDinheiro : p.precoVarejoDinheiro;
      const found = carrinho.find(x=>x.codigo===p.codigo);

      if(found){ found.qty += qty; }
      else { carrinho.push({...p, qty, precoUnit: preco}); }

      localStorage.setItem("carrinhoJMS", JSON.stringify(carrinho));
      setCartQty();

      alert(`✅ ${qty}x ${p.nome} adicionado${qty>1?'s':''} ao carrinho.\n${qty>=5?'Preço de atacado aplicado!':''}`);
    });

  }catch(err){
    console.error(err);
    document.querySelector(".product-page").innerHTML = "<p style='color:#ccc;'>Erro ao carregar produto.</p>";
  }
})();

// ================================
// Voltar
// ================================
document.getElementById("btnBack").addEventListener("click", ()=> window.location.href="index.html");
document.getElementById("btnCart").addEventListener("click", ()=> alert("Carrinho (itens: "+(cartQty.textContent||0)+")"));
