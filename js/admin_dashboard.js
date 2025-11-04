// ===============================
// BOTÃO DE SAIR
// ===============================
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('adminTokenJMS');
  window.location.href = "login.html";
});

// ===============================
// TROCAR CONTEÚDO AO CLICAR NA SIDEBAR
// ===============================
const sidebarItems = document.querySelectorAll('.sidebar li');
const contentBox = document.getElementById('contentBox');

sidebarItems.forEach(item => {
  item.addEventListener('click', async () => {
    sidebarItems.forEach(i => i.classList.remove('active'));
    item.classList.add('active');

    const section = item.getAttribute('data-section');

    switch (section) {
      case 'clientes':
        contentBox.innerHTML = `
          <h2>📋 Gerenciar Clientes</h2>
          <p>Visualize, edite e remova clientes cadastrados.</p>
          <button class="btn-add">+ Adicionar Cliente</button>
          <div class="data-box"><p>Nenhum cliente cadastrado ainda.</p></div>
        `;
        break;

      case 'produtos':
        await carregarProdutos();
        break;

      case 'secoes':
        contentBox.innerHTML = `
          <h2>📁 Gerenciar Seções</h2>
          <p>Organize as seções principais do site e do catálogo.</p>
          <button class="btn-add">+ Adicionar Seção</button>
          <div class="data-box"><p>Nenhuma seção criada ainda.</p></div>
        `;
        break;

      case 'pedidos':
        await carregarPedidos();
        break;
    }

    // animação suave
    contentBox.classList.remove("fade");
    void contentBox.offsetWidth;
    contentBox.classList.add("fade");
  });
});

// ===============================
// ABA DE PEDIDOS (com busca)
// ===============================
async function carregarPedidos() {
  contentBox.innerHTML = `
    <h2>📦 Gerenciar Pedidos</h2>
    <p>Controle o andamento dos pedidos dos clientes JMS.</p>

    <div class="pedidos-topbar">
      <input type="text" id="searchPedido" placeholder="🔍 Buscar por nome, telefone ou status...">
    </div>

    <div class="data-box">
      <table class="tabela-pedidos">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Email</th>
            <th>Telefone</th>
            <th>Endereço</th>
            <th>Total + Frete</th>
            <th>Status</th>
            <th>Ação</th>
          </tr>
        </thead>
        <tbody id="tabelaPedidosBody">
          <tr><td colspan="6" style="text-align:center;">Carregando pedidos...</td></tr>
        </tbody>
      </table>
    </div>
  `;

  const tabelaBody = document.getElementById("tabelaPedidosBody");
  const searchInput = document.getElementById("searchPedido");

  let pedidos = [];

  try {
    const res = await fetch("https://jms-server-v15d.onrender.com/api/pedidos");
    if (!res.ok) throw new Error("Rota /api/pedidos não encontrada");
    pedidos = await res.json();
  } catch (err) {
    console.warn("⚠️ Erro ao buscar pedidos:", err.message);
    tabelaBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; color:#aaa;">
          ⚠️ Não foi possível carregar os pedidos.<br>
          <small>${err.message}</small>
        </td>
      </tr>
    `;
    return;
  }

  // Função para renderizar lista filtrada
  function renderPedidos(lista) {
    tabelaBody.innerHTML = "";

    if (!lista.length) {
      tabelaBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Nenhum pedido encontrado.</td></tr>`;
      return;
    }

lista.forEach(p => {
  tabelaBody.insertAdjacentHTML("beforeend", `
    <tr data-id="${p.id}">
      <td>${p.nomeCliente}</td>
      <td>${p.email}</td>
      <td>${p.telefone}</td>
      <td>${p.endereco}</td>
      <td>R$ ${(p.total + p.frete).toFixed(2)}</td>
      <td class="status">${p.status}</td>
      <td><button class="btn-proximo">➡ Próximo</button></td>
    </tr>
  `);
});

document.querySelectorAll('.btn-proximo').forEach(btn => {
  btn.addEventListener('click', async (e) => {
    const row = e.target.closest('tr');
    const idPedido = row.dataset.id;
    const statusAtual = row.querySelector('.status').textContent.trim();

    let novoStatus = "";

    // ✅ Fluxo de status manual (sem webhooks)
    if (statusAtual === "Aguardando pagamento") novoStatus = "Pagamento aprovado";
    else if (statusAtual === "Pagamento aprovado") novoStatus = "Em separação";
    else if (statusAtual === "Em separação") return abrirModalRastreio(idPedido, row);
    else if (statusAtual === "Enviado") novoStatus = "Entregue";
    else if (statusAtual === "Entregue") {
      alert("🚀 Pedido já finalizado!");
      return;
    }

    if (novoStatus) {
      await atualizarStatusPedido(idPedido, novoStatus);
      row.querySelector('.status').textContent = novoStatus;
      alert(`✅ Pedido atualizado para "${novoStatus}"`);
    }
  });
});


  }

  // Inicializa com todos
  renderPedidos(pedidos);

  // 🔍 Filtro de busca
  searchInput.addEventListener("input", () => {
    const termo = searchInput.value.toLowerCase().trim();
    const filtrados = pedidos.filter(p =>
      p.nomeCliente?.toLowerCase().includes(termo) ||
      p.telefone?.toLowerCase().includes(termo) ||
      p.status?.toLowerCase().includes(termo)
    );
    renderPedidos(filtrados);
  });
}


// ===============================
// FUNÇÃO: ABRIR MODAL PARA RASTREIO
// ===============================
function abrirModalRastreio(idPedido, row) {
  const modal = document.createElement("div");
  modal.classList.add("modal-overlay");
  modal.innerHTML = `
    <div class="modal-content">
      <h3>📦 Enviar Pedido</h3>
      <p>Informe o código de rastreio para o cliente:</p>
      <input type="text" id="codigoRastreio" placeholder="Ex: BR123456789BR" required>
      <div class="modal-actions">
        <button id="confirmarEnvio">Confirmar Envio</button>
        <button id="cancelarEnvio" class="cancelar">Cancelar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector("#cancelarEnvio").onclick = () => modal.remove();

  modal.querySelector("#confirmarEnvio").onclick = async () => {
    const codigo = document.getElementById("codigoRastreio").value.trim();
    if (!codigo) {
      alert("Digite o código de rastreio!");
      return;
    }

    await atualizarStatusPedido(idPedido, "Enviado", codigo);
    row.querySelector(".status").textContent = "Enviado";
    alert(`Pedido marcado como "Enviado" com o rastreio: ${codigo}`);
    modal.remove();
  };
}


// ===============================
// FUNÇÃO: ATUALIZAR STATUS NO SERVIDOR
// ===============================
async function atualizarStatusPedido(id, novoStatus, codigo = "") {
  const token = localStorage.getItem("adminTokenJMS");

  try {
    const res = await fetch(`https://jms-server-v15d.onrender.com/api/pedidos/${id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ status: novoStatus, codigoRastreio: codigo })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
  } catch (err) {
    console.error("Erro ao atualizar pedido:", err);
    alert("Erro ao atualizar pedido!");
  }
}


// ===============================
// FUNÇÃO: CARREGAR PRODUTOS (com busca)
// ===============================
async function carregarProdutos() {
  const token = localStorage.getItem('adminTokenJMS');
  const res = await fetch('https://jms-server-v15d.onrender.com/api/produtos');
  const produtos = await res.json();

  contentBox.innerHTML = `
    <h2>🛒 Gerenciar Produtos</h2>
    <p>Adicione, edite ou remova produtos do catálogo JMS.</p>

    <div class="produtos-topbar">
      <button class="btn-add" id="addProductBtn">+ Adicionar Produto</button>
      <input type="text" id="searchProduct" placeholder="🔍 Buscar produto por nome ou código...">
    </div>

    <div class="data-box" id="produtosList"></div>
  `;

  const produtosList = document.getElementById('produtosList');
  const searchInput = document.getElementById('searchProduct');

  function renderProdutos(lista) {
    produtosList.innerHTML = '';

    if (lista.length === 0) {
      produtosList.innerHTML = `<p>Nenhum produto encontrado.</p>`;
      return;
    }

    lista.forEach(p => {
      produtosList.insertAdjacentHTML('beforeend', `
        <div class="produto-item" style="border-bottom:1px solid rgba(255,215,0,0.1); padding:10px 0;">
          <strong>${p.nome}</strong> <small>(${p.codigo})</small><br>
          <span style="color:#ccc; font-size:0.9em;">Atacado (R$${p.precoAtacadoDinheiro} / ${p.precoAtacadoCartao})</span> | 
          <span style="color:#ccc; font-size:0.9em;">Varejo (R$${p.precoVarejoDinheiro} / ${p.precoVarejoCartao})</span><br>
          <span style="color:#aaa; font-size:0.9em;">📦 Estoque: ${p.estoque || 0} unidades</span><br>
          
          <div style="margin-top:8px;">
            <button class="btn-edit" data-codigo="${p.codigo}">✏️ Editar</button>
            <button class="btn-delete" data-codigo="${p.codigo}" style="margin-left:5px; background:#7b0000; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">🗑 Excluir</button>
          </div>
        </div>
      `);
    });

    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const codigo = btn.dataset.codigo;
        const produto = lista.find(p => p.codigo === codigo);
        showEditModal(produto);
      });
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        const codigo = btn.dataset.codigo;
        if (confirm(`Tem certeza que deseja excluir o produto "${codigo}"?`)) {
          await excluirProduto(codigo);
        }
      });
    });
  }

  searchInput.addEventListener('input', () => {
    const termo = searchInput.value.toLowerCase().trim();
    const filtrados = produtos.filter(p =>
      p.nome.toLowerCase().includes(termo) ||
      p.codigo.toLowerCase().includes(termo)
    );
    renderProdutos(filtrados);
  });

  renderProdutos(produtos);
  document.getElementById('addProductBtn').addEventListener('click', showProductModal);
}

async function excluirProduto(codigo) {
  const token = localStorage.getItem('adminTokenJMS');

  try {
    const res = await fetch(`https://jms-server-v15d.onrender.com/api/produtos/excluir/${codigo}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await res.json();
    alert(data.message);

    if (res.ok) carregarProdutos();
  } catch (error) {
    alert('Erro ao excluir produto. Verifique o console.');
    console.error('Erro ao excluir produto:', error);
  }
}


// ===============================
// MODAL: ADICIONAR PRODUTO
// ===============================
function showProductModal() {
  criarModal('Adicionar Novo Produto', 'POST', 'adicionar');
}

// MODAL: EDITAR PRODUTO
function showEditModal(produto) {
  criarModal('Editar Produto', 'PUT', `editar/${produto.codigo}`, produto);
}

// ===============================
// FUNÇÃO BASE PARA MODAL (usada por adicionar e editar)
// ===============================
// ===============================
// FUNÇÃO BASE PARA MODAL (usada por adicionar e editar)
// ===============================
function criarModal(titulo, metodo, rota, produto = null) {
  const modalHTML = `
    <div id="productModal" class="modal-overlay">
      <div class="modal-content">
        <span class="close-modal">&times;</span>
        <h2>${titulo}</h2>
        <p>${metodo === 'POST'
          ? 'Preencha os dados para cadastrar um novo produto.'
          : 'Altere os dados desejados e salve as mudanças.'}</p>

        <form id="productForm" class="form-product">
          <label for="codigoProduto">Código do Produto</label>
          <input type="text" id="codigoProduto" placeholder="Ex: Ben1717"
                 required value="${produto?.codigo || ''}">

          <label for="nomeProduto">Nome do Produto</label>
          <input type="text" id="nomeProduto" value="${produto?.nome || ''}" required>
          
          <label for="estoqueProduto">Estoque</label>
          <input type="number" id="estoqueProduto" min="0" placeholder="Quantidade disponível" value="${produto?.estoque || 0}" required>

          <h3 style="color:#FFD700; margin-top:10px;">💰 Preços de Atacado</h3>
          <label>Dinheiro</label>
          <input type="number" id="precoAtacadoDinheiro"
                 value="${produto?.precoAtacadoDinheiro || ''}" required>
          <label>Cartão</label>
          <input type="number" id="precoAtacadoCartao"
                 value="${produto?.precoAtacadoCartao || ''}">

          <h3 style="color:#FFD700; margin-top:10px;">🏪 Preços de Varejo</h3>
          <label>Dinheiro</label>
          <input type="number" id="precoVarejoDinheiro"
                 value="${produto?.precoVarejoDinheiro || ''}" required>
          <label>Cartão</label>
          <input type="number" id="precoVarejoCartao"
                 value="${produto?.precoVarejoCartao || ''}">

          <label for="descricao">Descrição</label>
          <textarea id="descricao" rows="3">${produto?.descricao || ''}</textarea>

          <label for="fotos">Fotos (URL)</label>
          <input type="url" id="fotos" value="${produto?.fotos || ''}" required>

          <label for="video">Vídeo (URL - opcional)</label>
          <input type="url" id="video" value="${produto?.video || ''}" placeholder="https://exemplo.com/video.mp4">

          <button type="submit" class="btn-enviar">
            ${metodo === 'POST' ? 'Cadastrar' : 'Salvar Alterações'}
          </button>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const modal = document.getElementById('productModal');
  const closeBtn = modal.querySelector('.close-modal');
  const form = modal.querySelector('#productForm');

  closeBtn.addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('adminTokenJMS');

    const videoValue = document.getElementById('video').value.trim();
    const produtoData = {
      codigo: document.getElementById('codigoProduto').value.trim(),
      nome: document.getElementById('nomeProduto').value.trim(),
      estoque: parseInt(document.getElementById('estoqueProduto').value) || 0,
      precoAtacadoDinheiro: document.getElementById('precoAtacadoDinheiro').value,
      precoAtacadoCartao: document.getElementById('precoAtacadoCartao').value,
      precoVarejoDinheiro: document.getElementById('precoVarejoDinheiro').value,
      precoVarejoCartao: document.getElementById('precoVarejoCartao').value,
      descricao: document.getElementById('descricao').value.trim(),
      fotos: document.getElementById('fotos').value.trim(),
      ...(videoValue && { video: videoValue }) // ✅ só envia se tiver preenchido
    };

    const url = metodo === 'POST'
      ? `https://jms-server-v15d.onrender.com/api/produtos/${rota}`
      : `https://jms-server-v15d.onrender.com/api/produtos/${rota}`;

    const res = await fetch(url, {
      method: metodo,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(produtoData)
    });

    const data = await res.json();
    alert(data.message);

    if (res.ok) {
      modal.remove();
      carregarProdutos();
    }
  });
}

// ===============================
// CARREGAR PRODUTOS AO INICIAR
// ===============================
window.addEventListener('DOMContentLoaded', () => {
  const produtosMenu = document.querySelector('[data-section="produtos"]');
  produtosMenu.click();
});
