/**
 * MVP de Interfaceamento Laboratorial - Funcionalidades HL7
 */

// Função para processar dados HL7
function parseHL7() {
  const input = document.getElementById('hl7input').value;
  const outputElement = document.getElementById('hl7output');
  
  if (!input || !input.trim()) {
    outputElement.textContent = "Por favor, insira dados HL7 para processar.";
    outputElement.className = 'error';
    return;
  }
  
  try {
    // Utilizar a biblioteca HL7 Parser
    const parseResult = hl7parser.parseHL7v2(input);
    
    // Mostrar a saída técnica
    outputElement.textContent = JSON.stringify(parseResult, null, 2);
    outputElement.className = 'success';
    
    // Atualizar a visão para usuário final
    updateHL7UserView(parseResult);
    
    return parseResult;
  } catch (error) {
    console.error('Erro ao processar dados HL7:', error);
    outputElement.textContent = 'Erro ao analisar dados HL7: ' + error.message;
    outputElement.className = 'error';
    return null;
  }
}

// Função para atualizar a visualização amigável para o usuário final
function updateHL7UserView(hl7Data) {
  // Extrair dados do paciente
  let patientName = '';
  let patientId = '';
  let examName = '';
  let reportDate = '';
  const resultsList = [];
  
  try {
    // Obter dados do cabeçalho MSH
    if (hl7Data.MSH) {
      const msh = hl7Data.MSH;
      if (msh[7]) {
        const date = msh[7].value || '';
        if (date && date.length >= 8) {
          const year = date.substring(0, 4);
          const month = date.substring(4, 6);
          const day = date.substring(6, 8);
          reportDate = `${day}/${month}/${year}`;
        }
      }
    }
    
    // Obter dados do paciente PID
    if (hl7Data.PID) {
      const pid = hl7Data.PID;
      
      // Nome do paciente
      if (pid[5] && pid[5].value) {
        const nameParts = pid[5].value.split('^');
        if (nameParts.length > 1) {
          patientName = nameParts[1] + ' ' + nameParts[0]; // Nome Sobrenome
        } else {
          patientName = pid[5].value;
        }
      }
      
      // ID do paciente
      if (pid[3] && pid[3].value) {
        patientId = pid[3].value.split('^')[0];
      }
    }
    
    // Obter dados do pedido OBR
    if (hl7Data.OBR) {
      const obr = hl7Data.OBR;
      if (obr[4] && obr[4].value) {
        const examParts = obr[4].value.split('^');
        if (examParts.length > 1) {
          examName = examParts[1];
        }
      }
    }
    
    // Obter resultados OBX
    if (hl7Data.OBX) {
      const obxSegments = Array.isArray(hl7Data.OBX) ? hl7Data.OBX : [hl7Data.OBX];
      
      obxSegments.forEach(obx => {
        if (!obx) return;
        
        let testName = '';
        let result = '';
        let unit = '';
        let reference = '';
        let status = '';
        
        // Nome do teste
        if (obx[3] && obx[3].value) {
          const testParts = obx[3].value.split('^');
          if (testParts.length > 1) {
            testName = testParts[1];
          } else {
            testName = obx[3].value;
          }
        }
        
        // Resultado
        if (obx[5]) {
          result = obx[5].value || '';
        }
        
        // Unidade
        if (obx[6]) {
          unit = obx[6].value || '';
        }
        
        // Referência
        if (obx[7]) {
          reference = obx[7].value || '';
        }
        
        // Status
        if (obx[11]) {
          status = obx[11].value || '';
          // Traduzir códigos comuns
          if (status === 'F') status = 'Final';
          else if (status === 'P') status = 'Pendente';
          else if (status === 'C') status = 'Corrigido';
          else if (status === 'X') status = 'Cancelado';
        }
        
        resultsList.push({
          name: testName,
          value: result,
          unit: unit,
          reference: reference,
          status: status
        });
      });
    }
    
    // Atualizar campos na visão do usuário
    document.getElementById('hl7-report-date').textContent = 'Data do Exame: ' + (reportDate || 'Não informada');
    document.getElementById('hl7-patient-name').textContent = patientName || 'Nome não informado';
    document.getElementById('hl7-patient-id').textContent = 'ID: ' + (patientId || 'Não informado');
    document.getElementById('hl7-exam-name').textContent = examName || 'Exame laboratorial';
    
    // Limpar resultados anteriores
    const resultsContainer = document.getElementById('hl7-results');
    resultsContainer.innerHTML = '';
    
    // Adicionar novos resultados
    resultsList.forEach(result => {
      const isAbnormal = isAbnormalValue(result.value, result.reference);
      
      const resultItem = document.createElement('div');
      resultItem.className = 'exam-result-item' + (isAbnormal ? ' abnormal' : '');
      
      resultItem.innerHTML = `
        <div class="result-name">${result.name}</div>
        <div class="result-value">${result.value} ${result.unit}</div>
        <div class="result-reference">Referência: ${result.reference || 'N/A'}</div>
        <div class="result-status">Status: ${result.status || 'N/A'}</div>
      `;
      
      resultsContainer.appendChild(resultItem);
    });
  } catch (error) {
    console.error('Erro ao atualizar visão HL7:', error);
  }
}