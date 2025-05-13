/**
 * MVP de Interfaceamento Laboratorial - Funções de utilidade compartilhadas
 * Arquivo consolidado de utils.js e utilities.js
 */

// ========== FUNÇÕES DE INTERFACE ==========

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

// Função para alternar entre fontes DICOM
function switchDicomSource(showTabId, hideTab1Id, hideTab2Id, clickedTab) {
  document.getElementById(showTabId).classList.add('active');
  document.getElementById(hideTab1Id).classList.remove('active');
  document.getElementById(hideTab2Id).classList.remove('active');
  
  // Atualizar destaque da aba ativa
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

// Função para mostrar notificações
function showNotification(message, type = 'info', duration = 3000) {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = message;
  
  document.body.appendChild(notification);
  
  // Mostrar a notificação
  setTimeout(() => {
    notification.classList.add('visible');
  }, 10);
  
  // Remover notificação após o tempo especificado
  setTimeout(() => {
    notification.classList.remove('visible');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, duration);
}

// ========== FUNÇÕES DE MANIPULAÇÃO DE DADOS =========

// Função para determinar se um valor está fora dos limites de referência
function isAbnormalValue(value, referenceRange) {
  if (!value || !referenceRange) return false;
  
  // Converter para número se for um valor numérico
  let numValue = parseFloat(value.toString().replace(/[^\d.-]/g, ''));
  if (isNaN(numValue)) return false; // Não é um valor numérico
  
  // Verificar possíveis formatos de intervalo de referência
  // Exemplos comuns: "10-20", "<10", ">5", "<=7.2", ">=3.5"
  
  // Tentar intervalo no formato "min-max"
  if (referenceRange.includes('-')) {
    const [min, max] = referenceRange.split('-').map(v => parseFloat(v.trim()));
    if (!isNaN(min) && !isNaN(max)) {
      return numValue < min || numValue > max;
    }
  }
  
  // Verificar outros formatos
  if (referenceRange.startsWith('<=')) {
    const maxValue = parseFloat(referenceRange.substring(2).trim());
    if (!isNaN(maxValue)) {
      return numValue > maxValue;
    }
  } else if (referenceRange.startsWith('<')) {
    const maxValue = parseFloat(referenceRange.substring(1).trim());
    if (!isNaN(maxValue)) {
      return numValue >= maxValue;
    }
  }
  
  if (referenceRange.startsWith('>=')) {
    const minValue = parseFloat(referenceRange.substring(2).trim());
    if (!isNaN(minValue)) {
      return numValue < minValue;
    }
  } else if (referenceRange.startsWith('>')) {
    const minValue = parseFloat(referenceRange.substring(1).trim());
    if (!isNaN(minValue)) {
      return numValue <= minValue;
    }
  }
  
  return false;
}

// Função para formatação de números
function formatNumber(value, decimalPlaces = 2, prefix = '', suffix = '') {
  if (value === null || value === undefined || value === '') return '';
  
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  
  return `${prefix}${num.toFixed(decimalPlaces)}${suffix}`;
}

// Função para formatação de datas
function formatDate(dateString, format = 'dd/mm/yyyy') {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return format
    .replace('dd', day)
    .replace('mm', month)
    .replace('yyyy', year)
    .replace('yy', String(year).substring(2));
}

// ========== FUNÇÕES DE UTILIDADE PARA ARQUIVOS ==========

// Função para salvar o conteúdo como arquivo
function saveAsFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  
  // Método mais compatível para disparar clique
  a.dispatchEvent(new MouseEvent('click'));
  
  // Liberar a URL
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
}

// Função para copiar texto para a área de transferência
function copyToClipboard(text) {
  // Usar a API de área de transferência se disponível
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => {
        showNotification('Conteúdo copiado para a área de transferência!', 'success');
      })
      .catch(err => {
        console.error('Erro ao copiar para área de transferência:', err);
        fallbackCopyToClipboard(text);
      });
  } else {
    fallbackCopyToClipboard(text);
  }
}

// Método alternativo para copiar para a área de transferência
function fallbackCopyToClipboard(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  
  // Tornar o textarea invisível
  textArea.style.position = 'fixed';
  textArea.style.top = '0';
  textArea.style.left = '0';
  textArea.style.width = '2em';
  textArea.style.height = '2em';
  textArea.style.padding = '0';
  textArea.style.border = 'none';
  textArea.style.outline = 'none';
  textArea.style.boxShadow = 'none';
  textArea.style.background = 'transparent';
  
  document.body.appendChild(textArea);
  textArea.select();
  
  try {
    const successful = document.execCommand('copy');
    showNotification(successful ? 'Conteúdo copiado!' : 'Não foi possível copiar', successful ? 'success' : 'error');
  } catch (err) {
    console.error('Erro ao tentar copiar:', err);
    showNotification('Falha ao copiar para área de transferência.', 'error');
  }
  
  document.body.removeChild(textArea);
}