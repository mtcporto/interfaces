/**
 * MVP de Interfaceamento Laboratorial - Funções de utilidade compartilhadas
 */

// Função para alternar o tema entre claro e escuro
function toggleTheme() {
  const body = document.body;
  body.classList.toggle('dark-mode');
  
  const themeIcon = document.querySelector('.theme-toggle i');
  if (body.classList.contains('dark-mode')) {
    themeIcon.classList.replace('fa-moon', 'fa-sun');
    localStorage.setItem('darkMode', 'enabled');
  } else {
    themeIcon.classList.replace('fa-sun', 'fa-moon');
    localStorage.setItem('darkMode', 'disabled');
  }
}

// Função para alterar a seção visível
function showSection(sectionId) {
  const sections = document.querySelectorAll('.protocol-section');
  sections.forEach(section => {
    section.classList.remove('active');
  });
  document.getElementById(sectionId).classList.add('active');

  const navButtons = document.querySelectorAll('nav button');
  navButtons.forEach(button => {
    button.classList.remove('active');
    if (button.getAttribute('onclick').includes(sectionId)) {
      button.classList.add('active');
    }
  });
}

// Função para alternar entre abas
function switchTab(showTabId, hideTabId, clickedTab) {
  document.getElementById(showTabId).classList.add('active');
  document.getElementById(hideTabId).classList.remove('active');
  
  // Atualizar aba ativa
  clickedTab.classList.add('active');
  const tabs = clickedTab.parentElement.querySelectorAll('.tab');
  tabs.forEach(tab => {
    if (tab !== clickedTab) tab.classList.remove('active');
  });
}

// Função para definir as datas atuais nos relatórios
function setCurrentDates() {
  const now = new Date();
  const formattedDate = now.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  document.getElementById('csv-current-date').textContent = formattedDate;
  document.getElementById('txt-current-date').textContent = formattedDate;
  document.getElementById('xml-current-date').textContent = formattedDate;
}

// Função auxiliar para determinar se um valor está fora dos limites de referência
function isAbnormalValue(value, reference) {
  if (!reference || reference === 'N/A') return false;
  
  // Remover caracteres não-numéricos que não sejam operadores
  value = value.toString().replace(/[^\d.-]/g, '');
  
  // Processando diferentes formatos de referência
  if (reference.includes('-')) {
    // Intervalo: "10-20"
    const [min, max] = reference.split('-').map(v => parseFloat(v));
    const numValue = parseFloat(value);
    return numValue < min || numValue > max;
  } else if (reference.startsWith('<')) {
    // Limite superior: "<200"
    const max = parseFloat(reference.substring(1));
    const numValue = parseFloat(value);
    return numValue >= max;
  } else if (reference.startsWith('>')) {
    // Limite inferior: ">40"
    const min = parseFloat(reference.substring(1));
    const numValue = parseFloat(value);
    return numValue <= min;
  }
  
  return false;
}