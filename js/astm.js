/**
 * MVP de Interfaceamento Laboratorial - Funcionalidades ASTM
 */

// Função para processar dados ASTM
function parseASTM() {
  const input = document.getElementById('astminput').value;
  const outputElement = document.getElementById('astmoutput');
  
  if (!input || !input.trim()) {
    outputElement.textContent = "Por favor, insira dados ASTM para processar.";
    outputElement.className = 'error';
    return;
  }
  
  try {
    // Processar dados ASTM
    const parseResult = parseASTMRawData(input);
    
    // Mostrar a saída técnica
    outputElement.textContent = JSON.stringify(parseResult, null, 2);
    outputElement.className = 'success';
    
    // Atualizar a visão de usuário final
    updateASTMUserView(parseResult);
    
    return parseResult;
  } catch (error) {
    console.error('Erro ao processar dados ASTM:', error);
    outputElement.textContent = 'Erro ao analisar dados ASTM: ' + error.message;
    outputElement.className = 'error';
    return null;
  }
}

// Função para analisar dados brutos ASTM
function parseASTMRawData(rawData) {
  // Remover espaços extras e dividir por delimitador de registro (CR ou CRLF)
  const records = rawData.trim().split(/\r\n|\r|\n/);
  
  // Criar estrutura compatível com updateASTMUserView
  let result = {
    H: null,
    P: null,
    O: null,
    R: []
  };
  
  records.forEach(record => {
    // Verificar se o registro está vazio
    if (!record || !record.trim()) return;
    
    // Identificar o tipo de registro pela primeira letra
    const recordType = record.charAt(0);
    
    // Dividir o registro em campos usando a barra vertical como delimitador
    const fields = record.split('|');
    
    switch (recordType) {
      case 'H': // Header Record
        result.H = [fields]; // Armazenar como array para compatibilidade
        break;
      case 'P': // Patient Record
        result.P = [fields]; // Armazenar como array para compatibilidade
        break;
      case 'O': // Order Record
        result.O = [fields]; // Armazenar como array para compatibilidade
        break;
      case 'R': // Result Record
        result.R = result.R || []; 
        result.R.push(fields); // Adicionar ao array de resultados
        break;
      case 'L': // Terminator Record
        // Não precisa de processamento adicional
        break;
      default:
        console.warn(`Tipo de registro ASTM desconhecido: ${recordType}`);
    }
  });
  
  return result;
}

// Função auxiliar para formatar data ASTM
function parseASTMDate(dateStr) {
  if (!dateStr || dateStr.length < 8) return '';
  
  // Formatar data AAAAMMDD para DD/MM/AAAA
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  
  return `${day}/${month}/${year}`;
}

// Função para traduzir código de status ASTM
function translateASTMStatus(statusCode) {
  switch (statusCode.toUpperCase()) {
    case 'F': return 'Final';
    case 'P': return 'Pendente';
    case 'R': return 'Revisado';
    case 'C': return 'Corrigido';
    case 'X': return 'Cancelado';
    default: return statusCode || 'Não especificado';
  }
}

// Função auxiliar para analisar datas ASTM
function parseASTMDate(dateStr) {
  if (!dateStr || dateStr === '') return null;
  
  // Formato típico: AAAAMMDDHHMMSS
  if (dateStr.length >= 8) {
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    
    // Formatar como DD/MM/AAAA para exibição
    return `${day}/${month}/${year}`;
  }
  
  return dateStr; // Retornar como está se não for reconhecido
}

// Função para traduzir código de status ASTM
function translateASTMStatus(statusCode) {
  switch(statusCode.toUpperCase()) {
    case 'F': return 'Final';
    case 'P': return 'Pendente';
    case 'R': return 'Rejeição';
    case 'C': return 'Corrigido';
    case 'I': return 'Instrumento';
    case 'X': return 'Cancelado';
    default: return statusCode || 'Desconhecido';
  }
}

// Função para atualizar a visão do usuário final dos dados ASTM
  // Função para atualizar a visão de usuário do ASTM
  function updateASTMUserView(parsedAST) {
    // Extrair informações do cabeçalho (H)
    let deviceName = 'Analisador';
    let examDate = '';
    
    if (parsedAST.H && parsedAST.H[0]) {
      deviceName = parsedAST.H[0][4] || 'Analisador';
      
      // Data geralmente está no campo 12 (formato AAAAMMDD)
      if (parsedAST.H[0][12]) {
        const rawDate = parsedAST.H[0][12];
        if (rawDate.length >= 8) {
          examDate = rawDate.substring(6, 8) + '/' + 
                     rawDate.substring(4, 6) + '/' + 
                     rawDate.substring(0, 4);
        }
      }
    }
    
    document.getElementById('astm-device-name').textContent = deviceName;
    document.getElementById('astm-report-date').textContent = 'Data do Exame: ' + examDate;
    
    // Extrair dados do paciente (P)
    let patientName = 'Não identificado';
    let patientId = '';
    
    if (parsedAST.P && parsedAST.P[0]) {
      // ID do paciente geralmente está no campo 3
      patientId = parsedAST.P[0][3] || '';
      
      // Nome do paciente geralmente está no campo 5
      if (parsedAST.P[0][5]) {
        const nameParts = parsedAST.P[0][5].split('^');
        if (nameParts.length > 1) {
          patientName = nameParts[1] + ' ' + nameParts[0]; // Nome Sobrenome
        } else {
          patientName = parsedAST.P[0][5];
        }
      }
    }
    
    document.getElementById('astm-patient-name').textContent = patientName;
    document.getElementById('astm-patient-id').textContent = 'ID: ' + patientId;
    
    // Extrair tipo de amostra
    let sampleType = 'Não especificado';
    if (parsedAST.O && parsedAST.O[0] && parsedAST.O[0][13]) {
      sampleType = parsedAST.O[0][13];
    }
    document.getElementById('astm-sample-type').textContent = sampleType;
    
    // Processar resultados (R)
    const resultsBody = document.getElementById('astm-results');
    if (!resultsBody) return;
    
    resultsBody.innerHTML = ''; // Limpar resultados anteriores
    
    if (parsedAST.R && parsedAST.R.length > 0) {
      parsedAST.R.forEach(result => {
        // Pegar detalhes do teste
        let testCode = '';
        if (result[2]) {
          const testParts = result[2].split('^');
          testCode = testParts[testParts.length - 1] || result[2];
        }
        
        const value = result[3] || '';
        const unit = result[4] || '';
        
        // Processando intervalo de referência
        let refRange = '';
        if (result[5]) {
          const rangeParts = result[5].split('^');
          refRange = rangeParts.join('-');
        }
        
        // Avaliar status de anormalidade
        const abnormalFlag = result[6] || '';
        let status = 'Normal';
        let statusClass = 'normal';
        
        if (abnormalFlag === 'A' || abnormalFlag === 'H') {
          status = 'Alto';
          statusClass = 'abnormal';
        } else if (abnormalFlag === 'L') {
          status = 'Baixo';
          statusClass = 'abnormal';
        }
        
        // Adicionar linha à tabela
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${testCode}</td>
          <td class="${statusClass}">${value}</td>
          <td>${unit}</td>
          <td>${refRange}</td>
          <td class="${statusClass}">${status}</td>
        `;
        
        resultsBody.appendChild(row);
      });
    }
    
    // Se não houver resultados, mostrar mensagem
    if (!parsedAST.R || parsedAST.R.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="5">Não há resultados disponíveis</td>';
      resultsBody.appendChild(row);
    }
  }