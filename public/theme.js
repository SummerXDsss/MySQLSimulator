const themeToggle = document.querySelector("#themeToggle");

function refreshThemeIcons() {
  window.lucide?.createIcons({ attrs: { "stroke-width": 1.5 } });
}

function applyPageTheme(theme) {
  const nextTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = nextTheme;
  localStorage.setItem("mysql-simulator-theme", nextTheme);
  if (themeToggle) {
    themeToggle.innerHTML = nextTheme === "dark"
      ? '<i data-lucide="sun"></i><span>浅色模式</span>'
      : '<i data-lucide="moon"></i><span>深色模式</span>';
  }
  refreshThemeIcons();
}

if (themeToggle) {
  applyPageTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  themeToggle.addEventListener("click", () => {
    applyPageTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  });
}
