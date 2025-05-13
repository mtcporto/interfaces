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
  
  let result = {
    header: null,
    patient: null,
    order: null,
    results: []
  };
  
  records.forEach(record => {
    // Verificar se o registro está vazio
    if (!record || !record.trim()) return;
    
    // Identificar o tipo de registro pela primeira letra
    const recordType = record.charAt(0);
    
    switch (recordType) {
      case 'H': // Header Record
        result.header = parseASTMHeaderRecord(record);
        break;
      case 'P': // Patient Record
        result.patient = parseASTMPatientRecord(record);
        break;
      case 'O': // Order Record
        result.order = parseASTMOrderRecord(record);
        break;
      case 'R': // Result Record
        result.results.push(parseASTMResultRecord(record));
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

// Parser para Header Record
function parseASTMHeaderRecord(record) {
  // Formato: H|\\^&|||NOME_EQUIPAMENTO|||||||||AAAAMMDDHHMMSS
  const parts = record.split('|');
  
  return {
    type: 'header',
    delimiters: parts[1] || '',
    senderId: parts[2] || '',
    receiverId: parts[3] || '',
    equipmentName: parts[4] || '',
    timestamp: parseASTMDate(parts[13] || '')
  };
}

// Parser para Patient Record
function parseASTMPatientRecord(record) {
  // Formato: P|1||PATIENT_ID||NAME^SURNAME||BIRTH_DATE|SEX||||||||||||||||||
  const parts = record.split('|');
  
  // Formatar nome e sobrenome do paciente (se disponível)
  let name = parts[5] || '';
  let formattedName = name;
  
  if (name.includes('^')) {
    const nameParts = name.split('^');
    formattedName = nameParts[1] + ' ' + nameParts[0]; // Nome Sobrenome
  }
  
  return {
    type: 'patient',
    sequenceNum: parts[1] || '',
    patientId: parts[3] || '',
    patientName: formattedName,
    rawName: name,
    dateOfBirth: parseASTMDate(parts[7] || ''),
    sex: parts[8] || ''
  };
}

// Parser para Order Record
function parseASTMOrderRecord(record) {
  // Formato: O|1||SAMPLE_ID||TEST_CODES|||COLLECTION_DATE|||||||||||||||||
  const parts = record.split('|');
  
  return {
    type: 'order',
    sequenceNum: parts[1] || '',
    specimenId: parts[3] || '',
    testCodes: parts[4] || '',
    priority: parts[5] || '',
    collectionDate: parseASTMDate(parts[8] || '')
  };
}

// Parser para Result Record
function parseASTMResultRecord(record) {
  // Formato: R|1|^^^TEST_CODE|RESULT|UNITS|REFERENCE_RANGE|STATUS||TIMESTAMP|||||
  const parts = record.split('|');
  
  let testCode = parts[2] || '';
  if (testCode.startsWith('^^^')) {
    testCode = testCode.substring(3);
  }
  
  return {
    type: 'result',
    sequenceNum: parts[1] || '',
    testCode: testCode,
    result: parts[3] || '',
    units: parts[4] || '',
    referenceRange: parts[5] || '',
    status: translateASTMStatus(parts[6] || ''),
    timestamp: parseASTMDate(parts[8] || '')
  };
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
function updateASTMUserView(astmData) {
  // Obter elementos do DOM
  const patientNameEl = document.getElementById('astm-patient-name');
  const patientIdEl = document.getElementById('astm-patient-id');
  const examNameEl = document.getElementById('astm-exam-name');
  const reportDateEl = document.getElementById('astm-report-date');
  const resultsContainerEl = document.getElementById('astm-results');
  
  if (!patientNameEl || !resultsContainerEl) return;
  
  // Limpar resultados anteriores
  resultsContainerEl.innerHTML = '';
  
  // Dados do paciente
  if (astmData.patient) {
    patientNameEl.textContent = astmData.patient.patientName || 'Nome não informado';
    patientIdEl.textContent = 'ID: ' + (astmData.patient.patientId || 'Não informado');
  }
  
  // Nome do exame (baseado no cabeçalho ou no pedido)
  let examName = '';
  if (astmData.header && astmData.header.equipmentName) {
    examName = astmData.header.equipmentName;
  } else if (astmData.order && astmData.order.testCodes) {
    examName = 'Análise ' + astmData.order.testCodes;
  }
  examNameEl.textContent = examName || 'Resultado ASTM';
  
  // Data do exame
  let examDate = '';
  if (astmData.order && astmData.order.collectionDate) {
    examDate = astmData.order.collectionDate;
  } else if (astmData.header && astmData.header.timestamp) {
    examDate = astmData.header.timestamp;
  }
  reportDateEl.textContent = 'Data do Exame: ' + (examDate || 'Não informada');
  
  // Resultados
  if (astmData.results && astmData.results.length > 0) {
    astmData.results.forEach(result => {
      const isAbnormal = isAbnormalValue(result.result, result.referenceRange);
      
      const resultItem = document.createElement('div');
      resultItem.className = 'exam-result-item' + (isAbnormal ? ' abnormal' : '');
      
      resultItem.innerHTML = `
        <div class="result-name">${result.testCode}</div>
        <div class="result-value">${result.result} ${result.units}</div>
        <div class="result-reference">Referência: ${result.referenceRange || 'N/A'}</div>
        <div class="result-status">Status: ${result.status || 'N/A'}</div>
      `;
      
      resultsContainerEl.appendChild(resultItem);
    });
  } else {
    resultsContainerEl.innerHTML = '<div class="info-message">Nenhum resultado encontrado no arquivo ASTM.</div>';
  }
}