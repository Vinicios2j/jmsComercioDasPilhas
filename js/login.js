const API_URL = "https://jms-server-v15d.onrender.com/api";
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const showRegister = document.getElementById("showRegister");
const showLogin = document.getElementById("showLogin");

// ==========================================
// 🔐 Verificar se o usuário já está logado
// ==========================================
(async () => {
  const userToken = localStorage.getItem("userToken");
  const adminToken = localStorage.getItem("adminTokenJMS");

  if (userToken) {
    try {
      const res = await fetch("https://jms-server-v15d.onrender.com/api/verify-login", {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (res.ok) {
        // Usuário logado -> redireciona para o painel
        window.location.href = "user_dashboard.html";
        return;
      } else {
        localStorage.removeItem("userToken");
      }
    } catch (err) {
      console.warn("Falha ao verificar userToken:", err);
      localStorage.removeItem("userToken");
    }
  }

  if (adminToken) {
    try {
      const res = await fetch("https://jms-server-v15d.onrender.com/api/admin/verificar", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        // Admin logado -> redireciona para painel admin
        window.location.href = "admin_dashboard.html";
        return;
      } else {
        localStorage.removeItem("adminTokenJMS");
      }
    } catch (err) {
      console.warn("Falha ao verificar adminToken:", err);
      localStorage.removeItem("adminTokenJMS");
    }
  }
})();

// ==========================================
// Trocar formulários (login <-> cadastro)
// ==========================================
function showForm(which) {
  const isLogin = which === "login";
  loginForm.classList.toggle("active", isLogin);
  loginForm.classList.toggle("hidden", !isLogin);
  registerForm.classList.toggle("active", !isLogin);
  registerForm.classList.toggle("hidden", isLogin);

  document.getElementById("formTitle").textContent = isLogin ? "Bem-vindo à JMS" : "Criar Conta";
  document.getElementById("formSubtitle").textContent = isLogin
    ? "Acesse sua conta para continuar"
    : "Preencha os dados para se registrar";
}

showRegister.addEventListener("click", (e) => {
  e.preventDefault();
  showForm("register");
});

showLogin.addEventListener("click", (e) => {
  e.preventDefault();
  showForm("login");
});

// ==========================================
// Máscaras CPF e Telefone
// ==========================================
const cpfInput = document.getElementById("registerCpf");
const phoneInput = document.getElementById("registerPhone");

// máscara CPF -> 000.000.000-00 (corrigida)
cpfInput?.addEventListener("input", (e) => {
  let value = e.target.value.replace(/\D/g, ""); // remove tudo que não é número
  if (value.length > 11) value = value.slice(0, 11);

  // aplica os pontos e o traço conforme digita
  if (value.length > 9) {
    value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
  } else if (value.length > 6) {
    value = value.replace(/(\d{3})(\d{3})(\d+)/, "$1.$2.$3");
  } else if (value.length > 3) {
    value = value.replace(/(\d{3})(\d+)/, "$1.$2");
  }

  e.target.value = value;
});

// máscara Telefone -> (99) 99999-9999
phoneInput?.addEventListener("input", (e) => {
  let value = e.target.value.replace(/\D/g, "");
  if (value.length > 11) value = value.slice(0, 11);
  value = value.replace(/^(\d{2})(\d)/g, "($1) $2");
  value = value.replace(/(\d{5})(\d{4})$/, "$1-$2");
  e.target.value = value;
});

// ==========================================
// LOGIN
// ==========================================
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  const message = document.getElementById("loginMessage");

  message.textContent = "Verificando...";
  message.style.color = "#FFD700";

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

if (res.ok) {
  message.style.color = "lightgreen";
  message.textContent = "✅ Login realizado! Redirecionando...";

  // 🔥 Salva o token certo de acordo com o tipo de usuário
  if (data.role === "admin") {
    localStorage.setItem("adminTokenJMS", data.token);
  } else {
    localStorage.setItem("userToken", data.token);
  }

  setTimeout(() => {
    window.location.href =
      data.role === "admin"
        ? "admin_dashboard.html"
        : "user_dashboard.html";
  }, 1200);
}
 else {
      message.style.color = "#e74c3c";
      message.textContent = data.message || "Usuário ou senha incorretos.";
    }
  } catch (err) {
    console.error(err);
    message.style.color = "#e74c3c";
    message.textContent = "Erro ao conectar ao servidor.";
  }
});

// ==========================================
// CADASTRO
// ==========================================
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("registerName").value.trim();
  const cpf = document.getElementById("registerCpf").value.replace(/\D/g, ""); // remove máscara
  const email = document.getElementById("registerEmail").value.trim();
  const phone = document.getElementById("registerPhone").value.replace(/\D/g, ""); // remove máscara
  const password = document.getElementById("registerPassword").value.trim();
  const message = document.getElementById("registerMessage");

  message.textContent = "Criando conta...";
  message.style.color = "#FFD700";

  try {
    const res = await fetch(`${API_URL}/usuarios/cadastrar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, cpf, email, phone, password }),
    });

    const data = await res.json();

    if (res.ok) {
      message.style.color = "lightgreen";
      message.textContent = "✅ Conta criada com sucesso! Faça login.";
      setTimeout(() => showForm("login"), 1500);
    } else {
      message.style.color = "#e74c3c";
      message.textContent = data.message || "Erro ao criar conta.";
    }
  } catch (err) {
    console.error(err);
    message.style.color = "#e74c3c";
    message.textContent = "Erro ao conectar ao servidor.";
  }
});
