// js/carrinho.js
document.addEventListener("DOMContentLoaded", () => {
  // ==========================
  // ELEMENTOS
  // ==========================
  const lista = document.getElementById("cartList");
  const empty = document.getElementById("cartEmpty");
  const subtotalEl = document.getElementById("subtotal");
  const freteEl = document.getElementById("frete");
  const totalEl = document.getElementById("total");
  const limparBtn = document.getElementById("limparCarrinho");
  const finalizarBtn = document.getElementById("finalizarCompra");
  const cepInput = document.getElementById("cepInput");
  const freteInfo = document.getElementById("freteInfo");
  const btnFrete = document.getElementById("btnFrete");
  const freteSection = document.querySelector(".frete-section");
  const backShop = document.querySelector(".back-shop");

  // ENTREGAS
  const tipoEntregaSection = document.getElementById("tipoEntregaSection");
  const btnEntregaDomicilio = document.getElementById("btnEntregaDomicilio");
  const btnRetirarLoja = document.getElementById("btnRetirarLoja");
  const enderecoSection = document.getElementById("enderecoSection");
  const confirmarEnderecoBtn = document.getElementById("confirmarEndereco");

  // PAGAMENTO
  const pagamentoSection = document.getElementById("pagamentoSection");
  const payOptions = document.querySelectorAll(".pay-option");
  const payPix = document.getElementById("payPix");
  const payCartao = document.getElementById("payCartao");
  const boxParcelas = document.getElementById("boxParcelas");
  const selectParcelas = document.getElementById("selectParcelas");
  const previewParcelas = document.getElementById("previewParcelas");
  const totalPagamentoEl = document.getElementById("totalPagamento");
  const confirmarPagamentoBtn = document.getElementById("confirmarPagamento");

  // RESUMO
  const resumoSection = document.getElementById("resumoPedidoSection");
  const resumoDadosCliente = document.getElementById("resumoDadosCliente");
  const resumoEndereco = document.getElementById("resumoEndereco");
  const resumoPagamento = document.getElementById("resumoPagamento");
  const resumoItens = document.getElementById("resumoItens");
  const resumoTotal = document.getElementById("resumoTotal");
  const btnConcluirPedido = document.getElementById("btnConcluirPedido");

  // ==========================
  // ESTADO
  // ==========================
  let carrinho = JSON.parse(localStorage.getItem("carrinhoJMS") || "[]");
  let freteValor = 0;
  let freteCalculado = false;

  // fluxo
  let formaEntrega = null; // 'retirada' | 'domicilio'
  let formaPagamento = null; // 'pix' | 'cartao'
  let parcelas = 1;
  let enderecoEntrega = null;

  // formatação
  const fmt = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;
  const unfmt = (s) => Number(String(s).replace(/[^\d.,]/g, "").replace(".", "").replace(",", "."));

  // ==========================
  // HELPERS
  // ==========================
  function getDadosItem(item) {
    if (!item) return {};
    const keys = Object.keys(item || {});
    if (keys.length === 1 && item[keys[0]] && item[keys[0]].codigo) return item[keys[0]];
    return item;
  }

  function getUnitPrice(dados, qty, formaPag) {
    const usarAtacado = qty >= 5;
    if (usarAtacado) {
      return formaPag === "cartao"
        ? Number(dados.precoAtacadoCartao || 0)
        : Number(dados.precoAtacadoDinheiro || 0);
    } else {
      return formaPag === "cartao"
        ? Number(dados.precoVarejoCartao || 0)
        : Number(dados.precoVarejoDinheiro || 0);
    }
  }

  function getFreteAtual() {
    return formaEntrega === "retirada" ? 0 : Number(freteValor || 0);
  }

  function calcularSubtotalAtual() {
    const fp = formaPagamento || "pix";
    let subtotal = 0;
    for (const item of carrinho) {
      const dados = getDadosItem(item);
      const qty = Number(item.qty || 1);
      subtotal += getUnitPrice(dados, qty, fp) * qty;
    }
    return subtotal;
  }

  function atualizarResumoGeral() {
    const subtotal = calcularSubtotalAtual();
    const freteEfetivo = getFreteAtual();
    const total = subtotal + freteEfetivo;

    subtotalEl && (subtotalEl.textContent = fmt(subtotal));
    freteEl && (freteEl.textContent = fmt(freteEfetivo));
    totalEl && (totalEl.textContent = fmt(total));

    if (pagamentoSection && pagamentoSection.style.display !== "none") {
      totalPagamentoEl && (totalPagamentoEl.textContent = fmt(total));
      if (formaPagamento === "cartao") {
        const n = Number(selectParcelas.value || 1);
        previewParcelas && (previewParcelas.textContent = `${n}x de ${fmt(total / n)} (sem juros)`);
      } else if (formaPagamento === "pix") {
        previewParcelas && (previewParcelas.textContent = "Pagamento à vista via PIX.");
      }
    }
  }

  function persistirPedidoBasico() {
    const subtotal = calcularSubtotalAtual();
    const freteEfetivo = getFreteAtual();
    const total = subtotal + freteEfetivo;

    const fp = formaPagamento || "pix";
    const carrinhoPedido = carrinho.map((item) => {
      const dados = getDadosItem(item);
      const qty = Number(item.qty || 1);
      const usarAtacado = qty >= 5;
      const unit = getUnitPrice(dados, qty, fp);
      return {
        codigo: dados.codigo,
        nome: dados.nome,
        quantidade: qty,
        precoUnitario: unit,
        tipoPreco: usarAtacado ? "Atacado" : "Varejo",
        formaPagamentoConsiderada: fp === "cartao" ? "Cartão" : "PIX",
        subtotal: unit * qty,
      };
    });

    const pedido = JSON.parse(localStorage.getItem("pedidoAtualJMS") || "{}");
    const novo = {
      ...pedido,
      carrinho: carrinhoPedido,
      subtotal,
      frete: freteEfetivo,
      total,
      data: pedido.data || new Date().toISOString(),
      entrega: pedido.entrega || null,
      pagamento: pedido.pagamento || null,
    };
    localStorage.setItem("pedidoAtualJMS", JSON.stringify(novo));
  }

  document.getElementById("year") && (document.getElementById("year").textContent = new Date().getFullYear());

  // ==========================
  // RENDERIZAÇÃO
  // ==========================
  function render() {
    if (!lista) return;
    lista.innerHTML = "";
    const temItens = Array.isArray(carrinho) && carrinho.length > 0;

    lista.style.display = temItens ? "block" : "none";
    empty && (empty.style.display = temItens ? "none" : "flex");
    backShop && (backShop.style.display = temItens ? "block" : "none");
    freteSection && (freteSection.style.display = temItens ? "block" : "none");

    if (!temItens) {
      freteValor = 0;
      freteCalculado = false;
      atualizarResumoGeral();
      return;
    }

    carrinho.forEach((item, i) => {
      const dados = getDadosItem(item);

      const estoque = Number(dados.estoque) || 0;
      const nome = dados.nome || "Produto";
      const codigo = dados.codigo || "N/D";
      const foto = dados.fotos || "https://via.placeholder.com/120x120?text=Sem+Imagem";
      const qty = item.qty || 1;
      const usarAtacado = qty >= 5;

      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML = `
        <img src="${foto}" alt="${nome}">
        <div class="cart-item-info">
          <h3>${nome}</h3>
          <p><strong>Código:</strong> ${codigo}</p>
          <div class="price-block">
            <p><strong>Varejo:</strong> ${fmt(Number(dados.precoVarejoDinheiro||0))} (PIX) / ${fmt(Number(dados.precoVarejoCartao||0))} (Cartão)</p>
            <p><strong>Atacado:</strong> ${fmt(Number(dados.precoAtacadoDinheiro||0))} (PIX) / ${fmt(Number(dados.precoAtacadoCartao||0))} (Cartão)</p>
          </div>
          ${usarAtacado ? `<p class="alerta-atacado">💰 Preço de atacado aplicado a partir de 5 unidades.</p>` : ""}
          <p class="preco-aplicado" data-i="${i}"></p>
        </div>
        <div class="cart-item-actions">
          <button class="qty-btn minus" data-i="${i}">-</button>
          <span>${qty}</span>
          <button class="qty-btn plus" data-i="${i}" data-estoque="${estoque}">+</button>
          <button class="btn-remove" data-i="${i}">🗑</button>
        </div>
      `;
      lista.appendChild(row);
    });

    atualizarPrecosAplicadosPorItem();
    atualizarResumoGeral();
    aplicarEventos();
  }

  function atualizarPrecosAplicadosPorItem() {
    const fp = formaPagamento || "pix";
    document.querySelectorAll(".preco-aplicado").forEach((el) => {
      const idx = Number(el.getAttribute("data-i"));
      const item = carrinho[idx] || {};
      const dados = getDadosItem(item);
      const qty = Number(item.qty || 1);
      const usarAtacado = qty >= 5;
      const unit = getUnitPrice(dados, qty, fp);
      const labelFP = fp === "cartao" ? "Cartão" : "PIX";
      el.textContent = `Preço aplicado (${usarAtacado ? "Atacado" : "Varejo"} • ${labelFP}): ${fmt(unit)} — Subtotal item: ${fmt(unit * qty)}`;
    });
  }

  // ==========================
  // EVENTOS ITENS
  // ==========================
  function aplicarEventos() {
    // diminuir
    lista.querySelectorAll(".minus").forEach((b) => {
      b.onclick = () => {
        const i = Number(b.dataset.i);
        if (!carrinho[i]) return;
        if (carrinho[i].qty > 1) carrinho[i].qty--;
        else carrinho.splice(i, 1);
        salvar();
      };
    });

    // aumentar
    lista.querySelectorAll(".plus").forEach((b) => {
      b.onclick = () => {
        const i = Number(b.dataset.i);
        const item = carrinho[i];
        if (!item) return;
        const dados = getDadosItem(item);
        const estoque = Number(dados.estoque) || 0;
        if ((item.qty || 1) < estoque) {
          item.qty = (item.qty || 1) + 1;
          salvar();
        } else {
          alert(`⚠️ Estoque máximo atingido (${estoque} unidades disponíveis).`);
        }
      };
    });

    // remover
    lista.querySelectorAll(".btn-remove").forEach((b) => {
      b.onclick = () => {
        const i = Number(b.dataset.i);
        carrinho.splice(i, 1);
        salvar();
      };
    });
  }

  // ==========================
  // FRETE
  // ==========================
  btnFrete && btnFrete.addEventListener("click", async () => {
    const cep = (cepInput.value || "").trim();
    if (!cep.match(/^[0-9]{5}-?[0-9]{3}$/)) {
      freteInfo.textContent = "❌ CEP inválido. Exemplo: 22041-001";
      freteInfo.style.color = "#ff6b6b";
      return;
    }
    freteInfo.style.color = "#fff";
    freteInfo.innerHTML = "⏳ Calculando frete...";

    try {
      const produtos = carrinho.map((p) => {
        const d = getDadosItem(p);
        return {
          nome: d.nome || "Produto",
          peso: p.peso || 500,
        };
      });

      const response = await fetch("https://jms-server-v15d.onrender.com/api/frete/calcular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cepDestino: cep.replace("-", ""), produtos }),
      });

      const data = await response.json();

      const opcoesValidas = (data.opcoesFrete || []).filter((f) => f.valor > 0 && f.prazo);
      if (opcoesValidas.length === 0) {
        freteInfo.innerHTML = "⚠️ Nenhuma opção de envio disponível.";
        return;
      }

      freteInfo.innerHTML = opcoesValidas
        .map(
          (f, i) => `
            <div class="frete-opcao">
              <input type="radio" name="frete" id="frete-${i}" value="${f.valor}">
              <label for="frete-${i}">
                ${f.nome} - ${f.empresa} | Prazo: ${f.prazo} dia(s) | ${fmt(f.valor)}
              </label>
            </div>`
        )
        .join("");

      document.querySelectorAll('input[name="frete"]').forEach((radio) =>
        radio.addEventListener("change", (e) => {
          freteValor = parseFloat(e.target.value);
          freteCalculado = true;
          atualizarResumoGeral();
          finalizarBtn.disabled = false;
          persistirPedidoBasico();
        })
      );
    } catch (err) {
      console.error(err);
      freteInfo.textContent = "❌ Erro de conexão.";
    }
  });

  // ==========================
  // FINALIZAR COMPRA → ENTREGA
  // ==========================
  finalizarBtn && finalizarBtn.addEventListener("click", async () => {
    if (!freteCalculado) {
      const prosseguir = confirm(
        "Você ainda não calculou o frete.\n• Se escolher RETIRAR NA LOJA, tudo certo (frete = R$ 0,00).\n• Para ENTREGA, será necessário calcular o frete.\n\nDeseja continuar?"
      );
      if (!prosseguir) return;
    }

    const userToken = localStorage.getItem("userToken");
    if (!userToken) {
      alert("⚠️ Você precisa estar logado para finalizar a compra.");
      window.location.href = "login.html";
      return;
    }

    let usuario = null;
    try {
      const res = await fetch("https://jms-server-v15d.onrender.com/api/verify-login", {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (!res.ok) {
        alert("⚠️ Sessão expirada. Faça login novamente.");
        localStorage.removeItem("userToken");
        window.location.href = "login.html";
        return;
      }
      const data = await res.json();
      const email = data.user?.email;
      const userRes = await fetch(`https://jms-server-v15d.onrender.com/api/usuarios/${encodeURIComponent(email)}`);
      const userData = await userRes.json();
      usuario = {
        nome: userData.nome || "Desconhecido",
        cpf: userData.cpf || "Não informado",
        email: userData.email || email || "Não informado",
      };
    } catch (err) {
      console.error("Erro ao buscar perfil do usuário:", err);
      alert("❌ Erro ao verificar login. Tente novamente.");
      return;
    }

    const subtotal = calcularSubtotalAtual();
    const total = subtotal + getFreteAtual();
    const fp = formaPagamento || "pix";

    const resumoCarrinho = carrinho.map((item) => {
      const dados = getDadosItem(item);
      const qty = Number(item.qty || 1);
      const unit = getUnitPrice(dados, qty, fp);
      return {
        codigo: dados.codigo,
        nome: dados.nome,
        quantidade: qty,
        precoUnitario: unit,
        tipoPreco: qty >= 5 ? "Atacado" : "Varejo",
        formaPagamentoConsiderada: fp === "cartao" ? "Cartão" : "PIX",
        subtotal: unit * qty,
      };
    });

    const dadosPedido = {
      usuario,
      carrinho: resumoCarrinho,
      subtotal,
      frete: getFreteAtual(),
      total,
      data: new Date().toISOString(),
      entrega: null,
      pagamento: null,
    };

    localStorage.setItem("pedidoAtualJMS", JSON.stringify(dadosPedido));

    document.querySelector(".cart-container") && (document.querySelector(".cart-container").style.display = "none");
    tipoEntregaSection && (tipoEntregaSection.style.display = "flex");
  });

  // ==========================
  // ENTREGA DOMICÍLIO / RETIRADA
  // ==========================
  btnEntregaDomicilio && btnEntregaDomicilio.addEventListener("click", async () => {
    formaEntrega = "domicilio";
    tipoEntregaSection.style.display = "none";
    enderecoSection.style.display = "block";

    const cep = (document.getElementById("cepInput").value || "").trim().replace("-", "");
    if (!cep || !cep.match(/^[0-9]{8}$/)) {
      alert("⚠️ Digite um CEP válido antes de escolher entrega em domicílio!");
      enderecoSection.style.display = "none";
      tipoEntregaSection.style.display = "flex";
      return;
    }

    try {
      const viaCepRes = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await viaCepRes.json();
      if (data.erro) {
        alert("❌ CEP não encontrado. Verifique e tente novamente.");
        enderecoSection.style.display = "none";
        tipoEntregaSection.style.display = "block";
        return;
      }
      document.getElementById("enderecoCep").value = data.cep || "";
      document.getElementById("enderecoRua").value = data.logradouro || "";
      document.getElementById("enderecoBairro").value = data.bairro || "";
      document.getElementById("enderecoCidade").value = data.localidade || "";
      document.getElementById("enderecoEstado").value = data.uf || "";
    } catch (err) {
      console.error("Erro ao buscar endereço via CEP:", err);
      alert("⚠️ Não foi possível carregar o endereço automaticamente.");
    }
  });

  btnRetirarLoja && btnRetirarLoja.addEventListener("click", () => {
    formaEntrega = "retirada";
    freteValor = 0;
    freteCalculado = true;
    document.querySelectorAll('input[name="frete"]').forEach((r) => (r.checked = false));
    atualizarResumoGeral();

    const pedido = JSON.parse(localStorage.getItem("pedidoAtualJMS") || "{}") || {};
    const subtotal = calcularSubtotalAtual();
    const freteEfetivo = 0;
    pedido.frete = freteEfetivo;
    pedido.subtotal = subtotal;
    pedido.total = subtotal + freteEfetivo;
    pedido.entrega = {
      tipo: "retirada",
      local: {
        rua: "Andradas",
        numero: "29",
        bairro: "Centro",
        cidade: "Rio de Janeiro",
        uf: "RJ",
        cep: "20051-001",
      },
    };
    localStorage.setItem("pedidoAtualJMS", JSON.stringify(pedido));
    tipoEntregaSection.style.display = "none";
    pagamentoSection.style.display = "block";
    atualizarPainelPagamento();
  });

  confirmarEnderecoBtn && confirmarEnderecoBtn.addEventListener("click", () => {
    const nomeEntrega = (document.getElementById("enderecoNome").value || "").trim();
    const telefoneEntrega = (document.getElementById("enderecoTelefone").value || "").trim();
    const numero = (document.getElementById("enderecoNumero").value || "").trim();
    const complemento = (document.getElementById("enderecoComplemento").value || "").trim();
    const cep = (document.getElementById("enderecoCep").value || "").trim();
    const rua = (document.getElementById("enderecoRua").value || "").trim();
    const bairro = (document.getElementById("enderecoBairro").value || "").trim();
    const cidade = (document.getElementById("enderecoCidade").value || "").trim();
    const estado = (document.getElementById("enderecoEstado").value || "").trim();

    if (!nomeEntrega || !telefoneEntrega || !numero) {
      alert("⚠️ Preencha todos os campos obrigatórios.");
      return;
    }

    enderecoEntrega = { nomeEntrega, telefoneEntrega, cep, rua, numero, bairro, cidade, estado, complemento };
    const pedido = JSON.parse(localStorage.getItem("pedidoAtualJMS") || "{}");
    if (pedido && typeof pedido === "object") {
      pedido.entrega = {
        tipo: "domicilio",
        endereco: enderecoEntrega,
      };
      pedido.subtotal = calcularSubtotalAtual();
      pedido.frete = getFreteAtual();
      pedido.total = pedido.subtotal + Number(pedido.frete || 0);
      localStorage.setItem("pedidoAtualJMS", JSON.stringify(pedido));
    }
    enderecoSection.style.display = "none";
    pagamentoSection.style.display = "block";
    atualizarPainelPagamento();
  });

  // ==========================
  // PAGAMENTO
  // ==========================
  function limparSelecaoPagamento() {
    payOptions.forEach((o) => o.classList.remove("selected"));
  }

  function atualizarPedidoComFormaPagamento(fp) {
    formaPagamento = fp;
    const pedido = JSON.parse(localStorage.getItem("pedidoAtualJMS") || "{}");
    if (!pedido || typeof pedido !== "object") return;

    const carrinhoPedido = carrinho.map((item) => {
      const dados = getDadosItem(item);
      const qty = Number(item.qty || 1);
      const unit = getUnitPrice(dados, qty, fp);
      return {
        codigo: dados.codigo,
        nome: dados.nome,
        quantidade: qty,
        precoUnitario: unit,
        tipoPreco: qty >= 5 ? "Atacado" : "Varejo",
        formaPagamentoConsiderada: fp === "cartao" ? "Cartão" : "PIX",
        subtotal: unit * qty,
      };
    });

    const subtotal = carrinhoPedido.reduce((t, i) => t + i.subtotal, 0);
    const freteEfetivo = getFreteAtual();
    const total = subtotal + freteEfetivo;

    pedido.carrinho = carrinhoPedido;
    pedido.subtotal = subtotal;
    pedido.frete = freteEfetivo;
    pedido.total = total;
    localStorage.setItem("pedidoAtualJMS", JSON.stringify(pedido));

    atualizarPrecosAplicadosPorItem();
    atualizarResumoGeral();
  }

  function atualizarPainelPagamento() {
    const subtotal = calcularSubtotalAtual();
    const total = subtotal + getFreteAtual();
    totalPagamentoEl && (totalPagamentoEl.textContent = fmt(total));
    limparSelecaoPagamento();
    boxParcelas && (boxParcelas.style.display = "none");
    selectParcelas && (selectParcelas.value = "1");
    previewParcelas && (previewParcelas.textContent = "");
    confirmarPagamentoBtn && (confirmarPagamentoBtn.disabled = true);
  }

  function marcarOpcaoPagamento(elem) {
    limparSelecaoPagamento();
    elem.classList.add("selected");
  }

  payPix && payPix.addEventListener("click", () => {
    marcarOpcaoPagamento(payPix);
    atualizarPedidoComFormaPagamento("pix");
    parcelas = 1;
    boxParcelas.style.display = "none";
    confirmarPagamentoBtn.disabled = false;
    const pedido = JSON.parse(localStorage.getItem("pedidoAtualJMS") || "{}");
    const totalPix = Number(pedido?.subtotal || calcularSubtotalAtual()) + getFreteAtual();
    totalPagamentoEl && (totalPagamentoEl.textContent = fmt(totalPix));
    previewParcelas && (previewParcelas.textContent = "Pagamento à vista via PIX.");
  });

  payCartao && payCartao.addEventListener("click", () => {
    marcarOpcaoPagamento(payCartao);
    atualizarPedidoComFormaPagamento("cartao");
    boxParcelas.style.display = "block";
    const totalBase = calcularSubtotalAtual() + getFreteAtual();
    selectParcelas.innerHTML = "";
    if (totalBase < 180) {
      const opt = document.createElement("option");
      opt.value = "1";
      opt.textContent = "1x (à vista)";
      selectParcelas.appendChild(opt);
    } else if (totalBase >= 180 && totalBase <= 300) {
      for (let i = 1; i <= 2; i++) {
        const opt = document.createElement("option");
        opt.value = String(i);
        opt.textContent = `${i}x (sem juros)`;
        selectParcelas.appendChild(opt);
      }
    } else {
      for (let i = 1; i <= 12; i++) {
        const opt = document.createElement("option");
        opt.value = String(i);
        opt.textContent = i <= 2 ? `${i}x (sem juros)` : `${i}x (com juros)`;
        selectParcelas.appendChild(opt);
      }
    }
    const n = Number(selectParcelas.value || 1);
    totalPagamentoEl && (totalPagamentoEl.textContent = fmt(totalBase));
    previewParcelas && (previewParcelas.textContent = `${n}x de ${fmt(totalBase / n)} (sem juros)`);
    confirmarPagamentoBtn.disabled = false;
  });

  selectParcelas && selectParcelas.addEventListener("change", () => {
    const base = calcularSubtotalAtual() + getFreteAtual();
    parcelas = Number(selectParcelas.value || 1);
    let totalComJuros = base;
    let jurosInfo = "(sem juros)";
    if (parcelas >= 3) {
      const taxaMensal = 0.02;
      totalComJuros = base * Math.pow(1 + taxaMensal, parcelas - 2);
      jurosInfo = "(com juros de 2% a.m)";
    }
    const valorParcela = totalComJuros / parcelas;
    previewParcelas && (previewParcelas.textContent = `${parcelas}x de ${fmt(valorParcela)} ${jurosInfo}`);
    totalPagamentoEl && (totalPagamentoEl.textContent = fmt(totalComJuros));
    const pedido = JSON.parse(localStorage.getItem("pedidoAtualJMS") || "{}") || {};
    pedido.total = Number(totalComJuros.toFixed(2));
    pedido.frete = getFreteAtual();
    pedido.pagamento = {
      metodo: "Cartão",
      parcelas,
      valorParcela: Number(valorParcela.toFixed(2)),
      total: Number(totalComJuros.toFixed(2)),
      observacao: jurosInfo.includes("juros") ? "Com juros" : "Sem juros",
    };
    localStorage.setItem("pedidoAtualJMS", JSON.stringify(pedido));
  });

  confirmarPagamentoBtn && confirmarPagamentoBtn.addEventListener("click", () => {
    if (!formaPagamento) {
      alert("⚠️ Selecione uma forma de pagamento (PIX ou Cartão).");
      return;
    }
    const pedido = JSON.parse(localStorage.getItem("pedidoAtualJMS") || "{}");
    if (!pedido || typeof pedido !== "object") {
      alert("❌ Não foi possível carregar o pedido. Volte e tente novamente.");
      return;
    }
    const total = Number(pedido.total || (calcularSubtotalAtual() + getFreteAtual()));
    let detalhesPagamento;
    if (formaPagamento === "pix") {
      parcelas = 1;
      detalhesPagamento = { metodo: "PIX", parcelas: 1, total: total, observacao: "À vista via PIX" };
    } else {
      parcelas = Number(selectParcelas.value || 1);
      const valorParcela = total / parcelas;
      const observacao = parcelas >= 3 ? "Com juros" : "Sem juros";
      detalhesPagamento = { metodo: "Cartão", parcelas, valorParcela: Number(valorParcela.toFixed(2)), total, observacao };
    }
    pedido.pagamento = detalhesPagamento;
    localStorage.setItem("pedidoAtualJMS", JSON.stringify(pedido));
    pagamentoSection.style.display = "none";
    montarResumoFinal();
    resumoSection.style.display = "block";
  });

  // ==========================
  // RESUMO FINAL
  // ==========================
  function montarResumoFinal() {
    const pedido = JSON.parse(localStorage.getItem("pedidoAtualJMS") || "{}");
    if (!pedido || typeof pedido !== "object") return;
    const u = pedido.usuario || {};
    resumoDadosCliente.innerHTML = `
      <h3>👤 Dados do Cliente</h3>
      <p><strong>Nome:</strong> ${u.nome || "-"}</p>
      <p><strong>CPF:</strong> ${u.cpf || "-"}</p>
      <p><strong>E-mail:</strong> ${u.email || "-"}</p>
    `;
    const e = pedido.entrega || {};
    if (e.tipo === "retirada") {
      const l = e.local || {};
      resumoEndereco.innerHTML = `
        <h3>🏬 Retirada na Loja</h3>
        <p>${l.rua || "-"}, Nº ${l.numero || "-"}</p>
        <p>${l.bairro || "-"} - ${l.cidade || "-"}/${l.uf || "-"}</p>
        <p>CEP: ${l.cep || "-"}</p>
        <p>Frete: Grátis 🏆</p>
      `;
    } else {
      const d = e.endereco || {};
      resumoEndereco.innerHTML = `
        <h3>🏠 Endereço de Entrega</h3>
        <p><strong>Destinatário:</strong> ${d.nomeEntrega || "-"}</p>
        <p><strong>Contato:</strong> ${d.telefoneEntrega || "-"}</p>
        <p>${d.rua || "-"}, Nº ${d.numero || "-"}</p>
        <p>${d.bairro || "-"} - ${d.cidade || "-"}/${d.estado || "-"}</p>
        <p>CEP: ${d.cep || "-"}</p>
        <p>Complemento: ${d.complemento || "-"}</p>
        <p><strong>Frete:</strong> ${fmt(Number(pedido.frete || 0))}</p>
      `;
    }
    const p = pedido.pagamento || {};
    if (p.metodo === "Cartão") {
      resumoPagamento.innerHTML = `
        <h3>💳 Pagamento</h3>
        <p><strong>Método:</strong> Cartão</p>
        <p><strong>Parcelas:</strong> ${p.parcelas}x de ${fmt(p.valorParcela || (p.total / (p.parcelas || 1)))} ${p.observacao ? `(${p.observacao})` : ""}</p>
        <p><strong>Total:</strong> ${fmt(Number(p.total || pedido.total || 0))}</p>
      `;
    } else {
      resumoPagamento.innerHTML = `
        <h3>⚡ Pagamento</h3>
        <p><strong>Método:</strong> PIX</p>
        <p><strong>Total:</strong> ${fmt(Number(p.total || pedido.total || 0))} ${p.observacao ? `(${p.observacao})` : ""}</p>
      `;
    }
    const itensHTML = (pedido.carrinho || [])
      .map((i) => `<p>${i.nome} — ${i.quantidade}x (${i.tipoPreco} • ${i.formaPagamentoConsiderada}) — ${fmt(i.subtotal)}</p>`)
      .join("");
    resumoItens.innerHTML = `
      <h3>🛍 Itens do Pedido</h3>
      ${itensHTML || "<p>(vazio)</p>"}
    `;
    resumoTotal.textContent = fmt(Number(pedido.total || 0));
  }

  // ===============================
// 📞 VALIDAÇÃO DO TELEFONE NO RESUMO
// ===============================
const inputTelefoneResumo = document.getElementById("telefoneResumo");
const avisoTelefone = document.getElementById("telefoneAviso");
const btnConcluir = document.getElementById("btnConcluirPedido");

function validarTelefone(tel) {
  // Aceita formato (99) 99999-9999
  return /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/.test(tel);
}

if (inputTelefoneResumo) {
  inputTelefoneResumo.addEventListener("input", (e) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 6) {
      e.target.value = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
    } else if (v.length > 2) {
      e.target.value = `(${v.slice(0, 2)}) ${v.slice(2)}`;
    } else {
      e.target.value = v;
    }

    const valido = validarTelefone(e.target.value);
    if (valido) {
      btnConcluir.disabled = false;
      avisoTelefone.style.display = "none";
    } else {
      btnConcluir.disabled = true;
      avisoTelefone.style.display = "block";
    }
  });
}

  // ==========================
  // SALVAR / LIMPAR / INIT
  // ==========================
  function salvar() {
    localStorage.setItem("carrinhoJMS", JSON.stringify(carrinho));
    setCartQty();
    render();
    persistirPedidoBasico();
  }

  limparBtn && limparBtn.addEventListener("click", () => {
    if (confirm("Deseja realmente esvaziar o carrinho?")) {
      carrinho = [];
      salvar();
    }
  });

  const cartQty = document.getElementById("cartQty");
  const setCartQty = () => {
    if (!cartQty) return;
    cartQty.textContent = carrinho.reduce((a, b) => a + (b.qty || 1), 0) || 0;
  };

  // ==========================
  // MODAL SIMULAÇÃO
  // ==========================
  function criarModalSimulacao(html) {
    // remove modal anterior se existir
    let modal = document.getElementById("modalSimulacao");
    if (modal) modal.remove();
    modal = document.createElement("div");
    modal.id = "modalSimulacao";
    modal.style.cssText = `position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 9999; padding: 20px;`;
    modal.innerHTML = `
      <div style="
        background:#111; color:#fff; border-radius:12px;
        max-width:480px; width:100%; padding:24px; text-align:center;
        border:1px solid rgba(255,215,0,0.18);
        position:relative;
        box-shadow:0 0 20px rgba(255,215,0,0.12);
      ">
        <button id="fecharModal" style="position:absolute; top:8px; right:12px; background:none; border:none; color:#aaa; font-size:1.2rem; cursor:pointer;">✖</button>
        ${html}
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector("#fecharModal").onclick = () => modal.remove();
    return modal;
  }

  // ==========================
  // MÁSCARAS - cartão (robusta)
  // ==========================
  function aplicarMascaraCartao() {
    const modal = document.getElementById("modalSimulacao");
    if (!modal) return;
    const cardNumber = modal.querySelector("#cardNumber");
    const cardExpiration = modal.querySelector("#cardExpiration");
    const cardCVV = modal.querySelector("#cardCVV");
    const cardName = modal.querySelector("#cardName");

    // ---- número do cartão ----
    if (cardNumber) {
      cardNumber.setAttribute("inputmode", "numeric");
      cardNumber.setAttribute("maxlength", "19"); // 16 dígitos + 3 espaços
      cardNumber.autocomplete = "cc-number";

      const formatNumber = (digits) => {
        digits = digits.replace(/\D/g, "").slice(0, 16);
        return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
      };

      cardNumber.addEventListener("input", (e) => {
        const el = e.target;
        const old = el.value;
        const newVal = formatNumber(old);
        el.value = newVal;
      });

      cardNumber.addEventListener("paste", (e) => {
        e.preventDefault();
        const texto = (e.clipboardData || window.clipboardData).getData("text");
        e.target.value = formatNumber(texto);
        e.target.dispatchEvent(new Event("input", { bubbles: true }));
      });

      cardNumber.addEventListener("keydown", (e) => {
        const permitido = ["Backspace", "ArrowLeft", "ArrowRight", "Tab", "Delete"];
        if (permitido.includes(e.key)) return;
        if (!/^\d$/.test(e.key)) e.preventDefault();
      });
    }

    // ---- validade MM/AA ----
    if (cardExpiration) {
      cardExpiration.setAttribute("inputmode", "numeric");
      cardExpiration.setAttribute("maxlength", "5");
      cardExpiration.autocomplete = "cc-exp";

      const formatExp = (digits) => {
        digits = digits.replace(/\D/g, "").slice(0, 4);
        if (digits.length >= 3) return digits.replace(/(\d{2})(\d{1,2})/, "$1/$2");
        if (digits.length === 1 && Number(digits) > 1) digits = "0" + digits;
        return digits;
      };

      cardExpiration.addEventListener("input", (e) => {
        e.target.value = formatExp(e.target.value);
      });

      cardExpiration.addEventListener("paste", (e) => {
        e.preventDefault();
        const texto = (e.clipboardData || window.clipboardData).getData("text");
        e.target.value = formatExp(texto);
        e.target.dispatchEvent(new Event("input", { bubbles: true }));
      });

      cardExpiration.addEventListener("keydown", (e) => {
        const permitido = ["Backspace", "ArrowLeft", "ArrowRight", "Tab", "Delete"];
        if (permitido.includes(e.key)) return;
        if (!/^\d$/.test(e.key)) e.preventDefault();
      });
    }

    // ---- CVV ----
    if (cardCVV) {
      cardCVV.setAttribute("inputmode", "numeric");
      cardCVV.setAttribute("maxlength", "4");
      cardCVV.autocomplete = "cc-csc";
      cardCVV.addEventListener("input", (e) => {
        e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4);
      });
      cardCVV.addEventListener("keydown", (e) => {
        const permitido = ["Backspace", "ArrowLeft", "ArrowRight", "Tab", "Delete"];
        if (permitido.includes(e.key)) return;
        if (!/^\d$/.test(e.key)) e.preventDefault();
      });
    }

    // ---- Nome ----
    if (cardName) {
      cardName.setAttribute("maxlength", "60");
      cardName.setAttribute("autocomplete", "cc-name");
      cardName.addEventListener("input", (e) => {
        e.target.value = e.target.value.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, "");
      });
    }
  }

  // ==========================
  // CHECKOUT FINAL (PIX & CARTÃO)
  // ==========================
btnConcluirPedido && btnConcluirPedido.addEventListener("click", async () => {
  const pedido = JSON.parse(localStorage.getItem("pedidoAtualJMS") || "{}");
  if (!pedido || !pedido.usuario) {
    alert("❌ Dados do pedido inválidos!");
    return;
  }

  const telefoneResumo = document.getElementById("telefoneResumo")?.value.trim();
if (!validarTelefone(telefoneResumo)) {
  alert("⚠️ Digite um número de telefone válido antes de concluir o pedido.");
  return;
}
pedido.usuario.telefone = telefoneResumo;


  try {
    // ===============================
    // 🧾 CRIA O PEDIDO NO BANCO (API)
    // ===============================
    const resposta = await fetch("https://jms-server-v15d.onrender.com/api/pedidos/criar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pedido),
    });

    const data = await resposta.json();
    if (!data.sucesso) {
      alert("⚠️ Não foi possível registrar o pedido no servidor.");
      console.error(data);
    } else {
      console.log("✅ Pedido criado com sucesso:", data.pedido);
    }
  } catch (err) {
    console.error("❌ Erro ao enviar pedido para o servidor:", err);
    alert("Erro ao criar pedido no servidor.");
  }

  // ===============================
  // 💬 MENSAGEM AUTOMÁTICA WHATSAPP
  // ===============================
  const numeroDestino = "5521990440544"; // <-- Seu número do WhatsApp
  const nomeCliente = pedido.usuario?.nome || "Cliente";
  const total = pedido.total
    ? `R$ ${pedido.total.toFixed(2).replace(".", ",")}`
    : "valor não identificado";

  // 📦 ENTREGA
  let infoEntrega = "";
  if (pedido.entrega?.tipo === "domicilio" && pedido.entrega.endereco) {
    const e = pedido.entrega.endereco;
    infoEntrega = `📦 *Endereço de Entrega:*\n${e.rua || ""}, Nº ${e.numero || ""}\n${e.bairro || ""} - ${e.cidade || ""}/${e.estado || ""}\nCEP: ${e.cep || ""}${e.complemento ? "\nComplemento: " + e.complemento : ""}`;
  } else if (pedido.entrega?.tipo === "retirada") {
    infoEntrega = "🏬 *Retirada na Loja:*\nRua Andradas, 29 - Centro, Rio de Janeiro - RJ";
  }

  // 💳 PAGAMENTO
  let infoPagamento = "";
  const p = pedido.pagamento || {};
  if (p.metodo === "PIX") {
    infoPagamento = "💸 *Forma de Pagamento:* PIX (à vista)";
  } else if (p.metodo === "Cartão") {
    const parc = p.parcelas
      ? `${p.parcelas}x de R$ ${p.valorParcela?.toFixed(2).replace(".", ",")} ${p.observacao ? `(${p.observacao})` : ""}`
      : "Cartão de crédito";
    infoPagamento = `💳 *Forma de Pagamento:* Cartão\n${parc}`;
  } else {
    infoPagamento = "💰 *Forma de Pagamento:* Não especificada";
  }

  // 🛍️ ITENS — mostra todos do pedido
  const listaItens = (pedido.carrinho || pedido.itens || [])
    .map(
      (i) =>
        `• ${i.nome} — ${i.quantidade}x ${i.tipoPreco ? `(${i.tipoPreco})` : ""} • ${i.formaPagamentoConsiderada || ""}\n   Subtotal: R$ ${(
          i.subtotal || i.precoUnitario * i.quantidade
        )
          .toFixed(2)
          .replace(".", ",")}`
    )
    .join("\n");

  // 📲 MENSAGEM FINAL
  const mensagem = encodeURIComponent(
    `🧾 *Pedido criado com sucesso!*\n\n` +
      `👤 *Cliente:* ${nomeCliente}\n` +
      `💰 *Total:* ${total}\n\n` +
      `${infoPagamento}\n\n` +
      `🛍️ *Itens do Pedido:*\n${listaItens}\n\n` +
      `${infoEntrega ? infoEntrega + "\n\n" : ""}` +
      `Aguardando confirmação do pedido. Obrigado! 🙏`
  );

  const linkWhatsApp = `https://wa.me/${numeroDestino}?text=${mensagem}`;
  window.open(linkWhatsApp, "_blank");

  // ===============================
  // 🧹 LIMPA O CARRINHO APÓS FINALIZAR
  // ===============================
  localStorage.removeItem("carrinhoJMS");
  localStorage.removeItem("pedidoAtualJMS");
  carrinho = [];
  render();
  setCartQty();
  console.log("🧹 Carrinho limpo após finalização do pedido!");
});





  // ==========================
  // INIT
  // ==========================
  (function init() {
    setCartQty();
    render();
    persistirPedidoBasico();
  })();
});
