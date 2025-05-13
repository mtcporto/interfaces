/**
 * MVP de Interfaceamento Laboratorial - Web Serial API
 */

// Variáveis para conexão serial
let port = null;
let reader = null;
let readableStreamClosed;
let keepReading = true;
let textEncoder;
let writableStreamClosed;
let writer;

// Configurações de porta padrão
let serialConfig = {
  baudRate: 9600,
  dataBits: 8,
  stopBits: 1,
  parity: 'none',
  flowControl: 'none'
};

// Verificar se o navegador suporta Web Serial API
function isSerialSupported() {
  return 'serial' in navigator;
}

// Conectar à porta serial
async function connectToSerialPort() {
  if (!isSerialSupported()) {
    showNotification('Seu navegador não suporta Web Serial API. Use Chrome/Edge 89+ ou Opera 76+', 'error');
    return;
  }
  
  if (port) {
    showNotification('Já está conectado a uma porta serial. Desconecte primeiro.', 'warning');
    return;
  }
  
  try {
    // Solicitar porta serial
    port = await navigator.serial.requestPort();
    
    // Atualizar UI para mostrar que estamos conectando
    document.getElementById('connectButton').textContent = 'Conectando...';
    
    // Obter configurações do formulário
    const baudRate = parseInt(document.getElementById('baudRate').value) || 9600;
    const dataBits = parseInt(document.getElementById('dataBits').value) || 8;
    const stopBits = parseInt(document.getElementById('stopBits').value) || 1;
    const parity = document.getElementById('parity').value || 'none';
    const flowControl = document.getElementById('flowControl').value || 'none';
    
    // Salvar configurações
    serialConfig = { baudRate, dataBits, stopBits, parity, flowControl };
    
    // Abrir a porta com as configurações
    await port.open(serialConfig);
    
    // Preparar leitura/escrita
    setupSerialReaderWriter();
    
    // Atualizar UI
    document.getElementById('connectButton').textContent = 'Desconectar';
    document.getElementById('connectButton').className = 'button disconnect';
    document.getElementById('serialStatus').textContent = 'Conectado';
    document.getElementById('serialStatus').className = 'connected';
    document.getElementById('serialConfig').disabled = true;
    
    // Habilitar área de envio
    document.getElementById('sendButton').disabled = false;
    document.getElementById('serialDataToSend').disabled = false;
    
    showNotification('Conexão estabelecida com sucesso!', 'success');
    
    // Registrar quando a porta for desconectada
    port.addEventListener('disconnect', () => {
      disconnectFromSerialPort(false); // Não tentar fechar a porta novamente
    });
    
  } catch (error) {
    console.error('Erro ao conectar:', error);
    
    if (error.name === 'NotFoundError') {
      showNotification('Nenhuma porta serial selecionada.', 'info');
    } else {
      showNotification(`Erro ao conectar: ${error.message}`, 'error');
    }
    
    document.getElementById('connectButton').textContent = 'Conectar';
    document.getElementById('connectButton').className = 'button connect';
    port = null;
  }
}

// Desconectar da porta serial
async function disconnectFromSerialPort(closePort = true) {
  if (!port) {
    showNotification('Não está conectado a nenhuma porta serial.', 'warning');
    return;
  }
  
  // Parar de ler
  keepReading = false;
  
  try {
    // Fechar reader e writer se existirem
    if (reader) {
      await reader.cancel();
      await readableStreamClosed.catch(() => {});
      reader = null;
    }
    
    if (writer) {
      await writer.close();
      await writableStreamClosed;
      writer = null;
    }
    
    // Fechar a porta se necessário
    if (closePort && port.readable) {
      await port.close();
    }
    
    // Atualizar UI
    document.getElementById('connectButton').textContent = 'Conectar';
    document.getElementById('connectButton').className = 'button connect';
    document.getElementById('serialStatus').textContent = 'Desconectado';
    document.getElementById('serialStatus').className = 'disconnected';
    document.getElementById('serialConfig').disabled = false;
    
    // Desabilitar área de envio
    document.getElementById('sendButton').disabled = true;
    document.getElementById('serialDataToSend').disabled = true;
    
    showNotification('Desconectado da porta serial.', 'info');
  } catch (error) {
    console.error('Erro ao desconectar:', error);
    showNotification(`Erro ao desconectar: ${error.message}`, 'error');
  }
  
  port = null;
}

// Configurar reader e writer para a porta serial
function setupSerialReaderWriter() {
  // Configurar textEncoder para envio de dados
  textEncoder = new TextEncoder();
  
  // Preparar para leitura
  const textDecoder = new TextDecoder();
  keepReading = true;
  
  // Criar reader a partir do fluxo de entrada
  const readableStream = port.readable;
  reader = readableStream.getReader();
  
  // Iniciar leitura contínua
  readableStreamClosed = readSerialData(textDecoder);
  
  // Preparar writer para envio
  const writableStream = port.writable;
  writer = writableStream.getWriter();
  
  // Esta promessa será resolvida quando o writer for fechado
  writableStreamClosed = new Promise(resolve => {
    writer.closed.then(() => {
      resolve();
    });
  });
}

// Função para leitura contínua de dados seriais
async function readSerialData(textDecoder) {
  while (port && keepReading) {
    try {
      const { value, done } = await reader.read();
      
      if (done) {
        reader.releaseLock();
        break;
      }
      
      if (value) {
        const text = textDecoder.decode(value);
        addReceivedSerialData(text);
      }
    } catch (error) {
      console.error('Erro ao ler dados seriais:', error);
      if (error.name !== 'NetworkError') {
        showNotification(`Erro ao ler dados: ${error.message}`, 'error');
      }
      break;
    }
  }
  
  // Se o reader ainda existir, liberar o lock
  if (reader) {
    reader.releaseLock();
  }
}

// Adicionar dados recebidos ao console
function addReceivedSerialData(text) {
  const serialConsole = document.getElementById('serialConsole');
  const shouldAutoscroll = serialConsole.scrollTop + serialConsole.clientHeight >= serialConsole.scrollHeight - 5;
  
  // Adicionar timestamp e dados
  const timestamp = new Date().toLocaleTimeString();
  const dataDiv = document.createElement('div');
  dataDiv.className = 'received-data';
  dataDiv.innerHTML = `<span class="timestamp">[${timestamp}]</span> <span class="data">${escapeHTML(text)}</span>`;
  
  serialConsole.appendChild(dataDiv);
  
  // Limitar número de linhas (manter as últimas 1000 linhas)
  const maxLines = 1000;
  while (serialConsole.childElementCount > maxLines) {
    serialConsole.removeChild(serialConsole.firstChild);
  }
  
  // Auto-scroll se o usuário estava no final
  if (shouldAutoscroll) {
    serialConsole.scrollTop = serialConsole.scrollHeight;
  }
  
  // Analisar dados recebidos para protocolos conhecidos
  analyzeReceivedData(text);
}

// Enviar dados pela porta serial
async function sendSerialData() {
  if (!port || !writer) {
    showNotification('Não está conectado a uma porta serial.', 'error');
    return;
  }
  
  const dataToSend = document.getElementById('serialDataToSend').value;
  if (!dataToSend) {
    showNotification('Digite dados para enviar.', 'warning');
    return;
  }
  
  try {
    // Obter opção de final de linha
    const lineEnding = document.getElementById('lineEnding').value;
    let fullData = dataToSend;
    
    // Adicionar terminador de linha apropriado
    switch (lineEnding) {
      case 'crlf':
        fullData += '\r\n';
        break;
      case 'cr':
        fullData += '\r';
        break;
      case 'lf':
        fullData += '\n';
        break;
      case 'none':
      default:
        // Não adicionar nada
        break;
    }
    
    // Codificar e enviar
    const data = textEncoder.encode(fullData);
    await writer.write(data);
    
    // Mostrar na console o que foi enviado
    const timestamp = new Date().toLocaleTimeString();
    const dataDiv = document.createElement('div');
    dataDiv.className = 'sent-data';
    dataDiv.innerHTML = `<span class="timestamp">[${timestamp}]</span> <span class="label">ENVIADO:</span> <span class="data">${escapeHTML(fullData)}</span>`;
    
    const serialConsole = document.getElementById('serialConsole');
    serialConsole.appendChild(dataDiv);
    serialConsole.scrollTop = serialConsole.scrollHeight;
    
    // Opcional: limpar input ou manter
    if (document.getElementById('clearAfterSend').checked) {
      document.getElementById('serialDataToSend').value = '';
    }
    
  } catch (error) {
    console.error('Erro ao enviar dados:', error);
    showNotification(`Erro ao enviar dados: ${error.message}`, 'error');
  }
}

// Limpar o console serial
function clearSerialConsole() {
  document.getElementById('serialConsole').innerHTML = '';
}

// Analisar dados recebidos para identificar protocolos conhecidos
function analyzeReceivedData(text) {
  // Detectar formato ASTM (normalmente começa com H|\)
  if (text.includes('H|\\') || text.match(/[HPORLQ]\|[0-9]/)) {
    document.getElementById('astminput').value += text;
    // Verificar se a mensagem está completa (termina com L|1|N)
    if (text.includes('L|1|N')) {
      switchTab('astm-tab');
      showNotification('Dados ASTM detectados! Alternando para guia ASTM.', 'info');
    }
    return;
  }
  
  // Detectar formato HL7 (normalmente começa com MSH|^~\\&)
  if (text.includes('MSH|^~\\&')) {
    document.getElementById('hl7input').value += text;
    // Verificar se a mensagem está completa
    if (text.includes('\r\n\r\n') || text.includes('\r\r')) {
      switchTab('hl7-tab');
      showNotification('Dados HL7 detectados! Alternando para guia HL7.', 'info');
    }
    return;
  }
  
  // Detectar formato CSV (valores separados por vírgula)
  if (text.match(/[^,]+,[^,]+,[^,]+/)) {
    document.getElementById('csvinput').value += text;
    return;
  }
}

// Escapar HTML para evitar XSS
function escapeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Inicializar evento após carregamento da página
document.addEventListener('DOMContentLoaded', function() {
  // Verificar suporte para Web Serial API
  if (!isSerialSupported()) {
    const notSupportedElement = document.getElementById('serialNotSupported');
    const controlsElement = document.getElementById('serialControls');
    
    if (notSupportedElement) {
      notSupportedElement.style.display = 'block';
    }
    
    if (controlsElement) {
      controlsElement.style.display = 'none';
    }
  } else {
    // Adicionar event listeners apenas se os elementos existirem
    const connectButton = document.getElementById('connectButton');
    const sendButton = document.getElementById('sendButton');
    const clearButton = document.getElementById('clearButton');
    const serialDataToSend = document.getElementById('serialDataToSend');
    
    if (connectButton) {
      connectButton.addEventListener('click', function() {
        if (port) {
          disconnectFromSerialPort();
        } else {
          connectToSerialPort();
        }
      });
    }
    
    if (sendButton) {
      sendButton.addEventListener('click', sendSerialData);
    }
    
    if (clearButton) {
      clearButton.addEventListener('click', clearSerialConsole);
    }
    
    // Permitir envio ao pressionar Enter no campo de texto
    if (serialDataToSend) {
      serialDataToSend.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          sendSerialData();
        }
      });
    }
  }
});