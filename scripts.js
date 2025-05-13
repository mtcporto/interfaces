// Arquivo: scripts.js
// Script principal do sistema de interfaceamento
// Este arquivo contém funções essenciais que dependem dos módulos especializados em js/*.js

document.addEventListener('DOMContentLoaded', function() {
  // Configuração inicial
  showSection('intro'); // Mostrar seção inicial por default
  const firstNavButton = document.querySelector('nav button');
  if (firstNavButton) {
    firstNavButton.classList.add('active');
  }
  
  // Configurar datas atuais para relatórios
  setCurrentDates();
  
  // Inicializar o visualizador OHIF/Cornerstone para DICOM
  if (typeof initOHIFViewer === 'function') {
    console.log('Inicializando visualizador OHIF/Cornerstone');
    setTimeout(() => {
      initOHIFViewer();
      
      // Carregar imagem de exemplo se estivermos na seção DICOM
      if (document.getElementById('dicom').classList.contains('active')) {
        const localDicomSelect = document.getElementById('localDicomSelect');
        if (localDicomSelect && localDicomSelect.options.length > 1) {
          loadLocalDicomFile(localDicomSelect.options[1].value);
        }
      }
    }, 500);
  }
  
  // Verificar preferência de tema escuro
  if (localStorage.getItem('darkMode') === 'enabled') {
    document.body.classList.add('dark-mode');
    document.querySelector('.theme-toggle i').classList.replace('fa-moon', 'fa-sun');
  }

  // Configurar listeners para os seletores e interações
  setupEventListeners();
});

// Configurar Event Listeners 
function setupEventListeners() {
  // DICOM dropzone
  if (typeof setupDicomDropzone === 'function') {
    setupDicomDropzone();
  }
  
  // Lista de arquivos DICOM locais
  if (typeof loadLocalDicomFiles === 'function') {
    loadLocalDicomFiles();
  }
  
  // Seletor de DICOM online
  const onlineDicomSelect = document.getElementById('onlineDicomSelect');
  if (onlineDicomSelect) {
    onlineDicomSelect.addEventListener('change', function() {
      if (this.value && typeof downloadOnlineDicom === 'function') {
        downloadOnlineDicom(this.value);
      }
    });
  }
}

// Funções para a interface de usuário
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

function switchTab(showTabId, hideTabId, clickedTab) {
  document.getElementById(showTabId).classList.add('active');
  document.getElementById(hideTabId).classList.remove('active');
  
  // Atualizar destaque da aba ativa
  clickedTab.classList.add('active');
  const tabs = clickedTab.parentElement.querySelectorAll('.tab');
  tabs.forEach(tab => {
    if (tab !== clickedTab) tab.classList.remove('active');
  });
}

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

// Função utilitária para configurar datas atuais nos relatórios
function setCurrentDates() {
  const now = new Date();
  const formattedDate = now.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  if (document.getElementById('csv-current-date')) {
    document.getElementById('csv-current-date').textContent = formattedDate;
  }
  if (document.getElementById('txt-current-date')) {
    document.getElementById('txt-current-date').textContent = formattedDate;
  }
  if (document.getElementById('xml-current-date')) {
    document.getElementById('xml-current-date').textContent = formattedDate;
  }
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
