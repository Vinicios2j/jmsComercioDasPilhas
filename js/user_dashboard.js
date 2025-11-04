document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("userToken");
  if (!token) return (window.location.href = "login.html");

  try {
    const res = await fetch("https://jms-server-v15d.onrender.com/api/verify-login", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      localStorage.removeItem("userToken");
      window.location.href = "login.html";
      return;
    }

    const data = await res.json();
    const userEmail = data.user.email;

    // busca dados do usuário
    const userRes = await fetch(
      `https://jms-server-v15d.onrender.com/api/usuarios/${encodeURIComponent(userEmail)}`
    );
    const userData = await userRes.json();

    document.getElementById("userName").textContent = userData.nome;
    document.getElementById("userEmail").textContent = userData.email;
    document.getElementById("userCpf").textContent = userData.cpf;
    document.getElementById("userIp").textContent = userData.ip;
    document.getElementById("userCreated").textContent = new Date(
      userData.criadoEm
      
    ).toLocaleString();
    await carregarPedidosUsuario(userData.email);

    // alternar seções da sidebar
    const items = document.querySelectorAll(".sidebar li[data-section]");
    const sections = document.querySelectorAll(".info-card");


// força exibir "Meus Pedidos" como padrão
sections.forEach(sec => {
  if (sec.id === "pedidosSection") sec.classList.remove("hidden");
  else sec.classList.add("hidden");
});


    items.forEach((item) => {
      item.addEventListener("click", () => {
        items.forEach((i) => i.classList.remove("active"));
        item.classList.add("active");

        const target = item.getAttribute("data-section");
        sections.forEach((sec) =>
          sec.id.includes(target)
            ? sec.classList.remove("hidden")
            : sec.classList.add("hidden")
        );
      });
    });

// ====== MODAL DE LOGOUT ======
const logoutBtn = document.getElementById("logoutBtn");
const modal = document.getElementById("logoutModal");
const confirmLogout = document.getElementById("confirmLogout");
const cancelLogout = document.getElementById("cancelLogout");

logoutBtn.addEventListener("click", () => {
  modal.classList.remove("hidden");
});

cancelLogout.addEventListener("click", () => {
  modal.classList.add("hidden");
});

confirmLogout.addEventListener("click", () => {
  localStorage.removeItem("userToken");
  window.location.href = "login.html";
});

// ====== SUPORTE ======
const suporteForm = document.getElementById("suporteForm");
const suporteFeedback = document.getElementById("suporteFeedback");

suporteForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const assunto = document.getElementById("assunto").value.trim();
  const mensagem = document.getElementById("mensagem").value.trim();

  if (!assunto || !mensagem) return;

  try {
    // Aqui poderia enviar para a API — simulação temporária:
    await new Promise(res => setTimeout(res, 1200));

    suporteFeedback.textContent = "✅ Sua mensagem foi enviada com sucesso! Nossa equipe responderá em breve.";
    suporteFeedback.className = "suporte-feedback success";
    suporteFeedback.classList.remove("hidden");

    suporteForm.reset();
  } catch (error) {
    suporteFeedback.textContent = "❌ Ocorreu um erro ao enviar sua mensagem. Tente novamente.";
    suporteFeedback.className = "suporte-feedback error";
    suporteFeedback.classList.remove("hidden");
  }
});


  } catch (error) {
    console.error("Erro ao verificar login:", error);
    localStorage.removeItem("userToken");
    window.location.href = "login.html";
  }

  // ===============================
// 🔄 CARREGAR PEDIDOS DO USUÁRIO
// ===============================
async function carregarPedidosUsuario(email) {
  const pedidosSection = document.getElementById("pedidosSection");
  pedidosSection.innerHTML = `
    <h2><i class="fas fa-box"></i> Meus Pedidos</h2>
    <p style="color:#aaa;">Carregando seus pedidos...</p>
  `;

  try {
    const res = await fetch("https://jms-server-v15d.onrender.com/api/pedidos");
    if (!res.ok) throw new Error("Erro ao buscar pedidos.");

    const pedidos = await res.json();

    // Filtra apenas os pedidos do usuário logado
    const pedidosUsuario = pedidos.filter(p => p.email?.toLowerCase() === email.toLowerCase());

    if (!pedidosUsuario.length) {
      pedidosSection.innerHTML = `
        <h2><i class="fas fa-box"></i> Meus Pedidos</h2>
        <p>Você ainda não possui pedidos cadastrados.</p>
      `;
      return;
    }

    // Monta a tabela
    let pedidosHTML = `
      <h2><i class="fas fa-box"></i> Meus Pedidos</h2>
      <table class="tabela-pedidos">
        <thead>
          <tr>
            <th>ID</th>
            <th>Data</th>
            <th>Total + Frete</th>
            <th id="sts">Status</th>
            <th>Rastreio</th>
          </tr>
        </thead>
        <tbody>
    `;

    pedidosUsuario.forEach(p => {
      const dataFormatada = new Date(p.dataPedido).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });

      pedidosHTML += `
        <tr>
          <td>#${p.id}</td>
          <td>${dataFormatada}</td>
          <td>R$ ${(p.total + p.frete).toFixed(2)}</td>
          <td><span class="status ${p.status.toLowerCase().replace(/\s+/g, "-")}">${p.status}</span></td>
          <td>${p.codigoRastreio ? `<a href="https://www2.correios.com.br/sistemas/rastreamento/default.cfm" target="_blank">${p.codigoRastreio}</a>` : "-"}</td>
        </tr>
      `;
    });

    pedidosHTML += `</tbody></table>`;
    pedidosSection.innerHTML = pedidosHTML;
  } catch (err) {
    console.error("Erro ao carregar pedidos:", err);
    pedidosSection.innerHTML = `
      <h2><i class="fas fa-box"></i> Meus Pedidos</h2>
      <p style="color:red;">Erro ao carregar seus pedidos. Tente novamente mais tarde.</p>
    `;
  }
}

// ===============================
// 📱 MENU MOBILE - ABRIR / FECHAR (SEM OVERLAY)
// ===============================
const menuBtn = document.getElementById("menuToggle");
const sidebar = document.querySelector(".sidebar");

// Abre o menu
menuBtn.addEventListener("click", (e) => {
  e.stopPropagation(); // evita fechar ao clicar no botão
  sidebar.classList.add("mobile-active");
});

// Fecha ao clicar em item da sidebar
document.querySelectorAll(".sidebar li").forEach(item => {
  item.addEventListener("click", () => {
    sidebar.classList.remove("mobile-active");
  });
});

// Fecha se clicar fora da sidebar e fora do botão
document.addEventListener("click", (e) => {
  const clicouForaSidebar = !sidebar.contains(e.target);
  const clicouForaBotao = !menuBtn.contains(e.target);

  if (clicouForaSidebar && clicouForaBotao && sidebar.classList.contains("mobile-active")) {
    sidebar.classList.remove("mobile-active");
  }
});

// ====== BOTÃO VOLTAR PARA COMPRAS ======
const backToShop = document.getElementById("backToShop");
if (backToShop) {
  backToShop.addEventListener("click", () => {
    window.location.href = "index.html";
  });
}

});
