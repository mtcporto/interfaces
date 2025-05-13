/**
 * MVP de Interfaceamento Laboratorial - Funções Utilitárias
 */

// Função para determinar se um valor está fora do intervalo de referência
function isAbnormalValue(value, referenceRange) {
  if (!value || !referenceRange) return false;
  
  // Converter para número se for um valor numérico
  let numValue = parseFloat(value);
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
  if (referenceRange.startsWith('<')) {
    const maxValue = parseFloat(referenceRange.substring(1).trim());
    if (!isNaN(maxValue)) {
      return numValue >= maxValue;
    }
  }
  
  if (referenceRange.startsWith('<=')) {
    const maxValue = parseFloat(referenceRange.substring(2).trim());
    if (!isNaN(maxValue)) {
      return numValue > maxValue;
    }
  }
  
  if (referenceRange.startsWith('>')) {
    const minValue = parseFloat(referenceRange.substring(1).trim());
    if (!isNaN(minValue)) {
      return numValue <= minValue;
    }
  }
  
  if (referenceRange.startsWith('>=')) {
    const minValue = parseFloat(referenceRange.substring(2).trim());
    if (!isNaN(minValue)) {
      return numValue < minValue;
    }
  }
  
  return false; // Se não conseguimos determinar
}

// Função para formatar data em formato local
function formatBrazilianDate(dateString) {
  // Se a data já estiver no formato correto ou for nula
  if (!dateString) return '';
  
  // Tentar analisar como ISO 8601
  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('pt-BR');
    }
  } catch (e) {
    // Se falhar, continuar para próximas tentativas
  }
  
  // Tentar formato YYYYMMDD
  if (/^\d{8}$/.test(dateString)) {
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    return `${day}/${month}/${year}`;
  }
  
  return dateString; // Retornar como está se não reconhecido
}

// Função para mostrar mensagem de notificação
function showNotification(message, type = 'info') {
  // Criar elemento de notificação
  const notificationEl = document.createElement('div');
  notificationEl.className = `notification ${type}`;
  notificationEl.innerHTML = `
    <span class="notification-message">${message}</span>
    <button class="notification-close">&times;</button>
  `;
  
  // Adicionar ao DOM
  document.body.appendChild(notificationEl);
  
  // Animação de entrada
  setTimeout(() => {
    notificationEl.classList.add('show');
  }, 10);
  
  // Botão para fechar
  const closeButton = notificationEl.querySelector('.notification-close');
  closeButton.addEventListener('click', () => {
    notificationEl.classList.remove('show');
    setTimeout(() => {
      notificationEl.remove();
    }, 300);
  });
  
  // Remover automaticamente após 5 segundos
  setTimeout(() => {
    if (document.body.contains(notificationEl)) {
      notificationEl.classList.remove('show');
      setTimeout(() => {
        if (document.body.contains(notificationEl)) {
          notificationEl.remove();
        }
      }, 300);
    }
  }, 5000);
}

// Função para alternar entre tabs
function switchTab(tabId) {
  // Ocultar todas as abas
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Mostrar a aba selecionada
  document.getElementById(tabId).classList.add('active');
  
  // Atualizar as tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active');
    if (tab.getAttribute('data-tab') === tabId) {
      tab.classList.add('active');
    }
  });
  
  // Salvar a preferência do usuário
  localStorage.setItem('activeTab', tabId);
}

// Função para inicializar tooltips
function initTooltips() {
  document.querySelectorAll('[data-tooltip]').forEach(element => {
    element.addEventListener('mouseenter', (e) => {
      const tooltip = document.createElement('div');
      tooltip.className = 'tooltip';
      tooltip.textContent = e.target.getAttribute('data-tooltip');
      
      document.body.appendChild(tooltip);
      
      const rect = e.target.getBoundingClientRect();
      tooltip.style.left = (rect.left + rect.width / 2 - tooltip.offsetWidth / 2) + 'px';
      tooltip.style.top = (rect.top - tooltip.offsetHeight - 10) + 'px';
      
      setTimeout(() => tooltip.classList.add('tooltip-visible'), 10);
      
      e.target.addEventListener('mouseleave', () => {
        tooltip.classList.remove('tooltip-visible');
        setTimeout(() => tooltip.remove(), 200);
      }, { once: true });
    });
  });
}

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

// Método alternativo para copiar para área de transferência
function fallbackCopyToClipboard(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  
  // Evitar scroll
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
  textArea.focus();
  textArea.select();
  
  try {
    const successful = document.execCommand('copy');
    if (successful) {
      showNotification('Conteúdo copiado para a área de transferência!', 'success');
    } else {
      showNotification('Não foi possível copiar o texto', 'error');
    }
  } catch (err) {
    console.error('Erro ao copiar para área de transferência:', err);
    showNotification('Erro ao copiar para área de transferência', 'error');
  }
  
  document.body.removeChild(textArea);
}