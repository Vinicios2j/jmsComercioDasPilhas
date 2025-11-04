document.addEventListener("DOMContentLoaded", async () => {
  const isAdminPage = window.location.pathname.includes("admin");
  const token = localStorage.getItem(isAdminPage ? "adminTokenJMS" : "userToken");

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch("https://jms-server-v15d.onrender.com/api/verify-login", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      localStorage.removeItem(isAdminPage ? "adminTokenJMS" : "userToken");
      window.location.href = "login.html";
      return;
    }

    const data = await res.json();

    // Bloqueia se o admin não for admin de verdade
    if (isAdminPage && data.user.role !== "admin") {
      alert("Acesso negado! Somente administradores podem acessar esta página.");
      localStorage.removeItem("adminTokenJMS");
      window.location.href = "login.html";
      return;
    }

    console.log("✅ Usuário autenticado:", data.user);
  } catch (err) {
    console.error("Erro de autenticação:", err);
    localStorage.removeItem(isAdminPage ? "adminTokenJMS" : "userToken");
    window.location.href = "login.html";
  }
});
