/**
 * MVP de Interfaceamento Laboratorial - Funcionalidades HL7
 */

// Função para processar dados HL7
function parseHL7() {
  const outputElement = document.getElementById('hl7output');
  const userFriendlyView = document.getElementById('hl7-user-tab');
  
  try {
    const input = document.getElementById('hl7input').value;
    
    if (!input || !input.trim()) {
      outputElement.textContent = 'Entrada HL7 está vazia.';
      outputElement.className = 'error';
      return;
    }
    
    // Parser HL7 personalizado - melhorado e robusto com tratamento de erros
    function parseHL7Message(text) {
      // Garantir que quebramos as linhas corretamente - HL7 pode usar CR, LF ou CRLF
      const segments = text.split(/\r\n|\r|\n/).filter(line => line.trim().length > 0);
      
      // Resultado da análise
      const result = {};
      
      segments.forEach((segment) => {
        try {
          // Verificar se o segmento tem conteúdo
          if (!segment || segment.trim().length === 0) {
            return;
          }
          
          // Obter o tipo de segmento (primeiros 3 caracteres)
          const segmentType = segment.substring(0, 3);
          
          // Dividir o segmento em campos usando o separador de campo '|'
          // O primeiro campo é o próprio tipo de segmento
          const fields = segment.split('|');
          
          // Inicializar o array para este tipo de segmento se ainda não existir
          if (!result[segmentType]) {
            result[segmentType] = [];
          }
          
          // Criar um array para armazenar os campos
          const fieldsArray = [];
          
          // Processar cada campo do segmento
          fields.forEach((field, index) => {
            // Verificar se o campo tem componentes (separados por ^)
            if (field && field.includes('^')) {
              // Campo com componentes - criar objeto com valor e array de componentes
              const components = field.split('^');
              fieldsArray[index] = {
                value: field,
                components: components
              };
            } else {
              // Campo simples - armazenar como string
              fieldsArray[index] = field || '';
            }
          });
          
          // Adicionar o array de campos ao tipo de segmento
          result[segmentType].push(fieldsArray);
        } catch (error) {
          console.error(`Error processing segment:`, error);
        }
      });
      
      // Converter arrays de segmentos únicos para melhor acesso
      Object.keys(result).forEach(segmentType => {
        // Não desestruturar segmentos OBX para manter como array
        if (segmentType !== 'OBX' && result[segmentType].length === 1) {
          result[segmentType] = result[segmentType][0];
        }
      });
      
      return result;
    }
    
    // Processar a mensagem HL7
    const parsedMessage = parseHL7Message(input);
    
    // Exibir visão técnica
    outputElement.textContent = JSON.stringify(parsedMessage, null, 2);
    outputElement.className = 'success';
    
    // Preencher a visão para usuário final
    updateHL7UserView(parsedMessage);
    
  } catch (error) {
    console.error("Erro no parseHL7:", error);
    outputElement.textContent = 'Erro ao analisar HL7: ' + error.message;
    outputElement.className = 'error';
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
      // Obter a data do MSH (campo 7)
      if (msh[7]) {
        let date = '';
        if (typeof msh[7] === 'object' && msh[7].value) {
          date = msh[7].value;
        } else if (typeof msh[7] === 'string') {
          date = msh[7];
        }
        
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
      
      // Nome do paciente (campo 5)
      if (pid[5]) {
        let nameValue = '';
        if (typeof pid[5] === 'object' && pid[5].value) {
          nameValue = pid[5].value;
        } else if (typeof pid[5] === 'string') {
          nameValue = pid[5];
        }
        
        if (nameValue) {
          const nameParts = nameValue.split('^');
          if (nameParts.length > 1) {
            patientName = nameParts[1] + ' ' + nameParts[0]; // Nome Sobrenome
          } else {
            patientName = nameValue;
          }
        }
      }
      
      // ID do paciente (campo 3)
      if (pid[3]) {
        let idValue = '';
        if (typeof pid[3] === 'object' && pid[3].value) {
          idValue = pid[3].value;
        } else if (typeof pid[3] === 'string') {
          idValue = pid[3];
        }
        
        if (idValue) {
          patientId = idValue.split('^')[0];
        }
      }
    }
    
    // Obter dados do pedido OBR
    if (hl7Data.OBR) {
      const obr = hl7Data.OBR;
      // Obter o nome do exame do campo 4 (Universal Service ID)
      if (obr[4]) {
        let fieldValue = '';
        if (typeof obr[4] === 'object' && obr[4].value) {
          fieldValue = obr[4].value;
        } else if (typeof obr[4] === 'string') {
          fieldValue = obr[4];
        }
        
        if (fieldValue) {
          const examParts = fieldValue.split('^');
          if (examParts.length > 1) {
            examName = examParts[1];
          } else {
            examName = fieldValue;
          }
        }
      }
    }
    
    // Obter resultados OBX
    if (hl7Data.OBX) {
      // Garantir que sempre temos um array de OBX para processar
      const obxSegments = Array.isArray(hl7Data.OBX) ? hl7Data.OBX : [hl7Data.OBX];
      
      obxSegments.forEach(obx => {
        // Verificar se temos um segmento OBX válido
        if (!obx || obx.length < 5) return;
        
        let testName = '';
        let result = '';
        let unit = '';
        let reference = '';
        let status = 'N/A';
        
        // Campo 3: Identificador do teste (ex: "718-7^Hemoglobina^LN")
        if (obx[3]) {
          if (typeof obx[3] === 'object' && obx[3].components) {
            // Se tiver componentes separados, pegar o nome amigável (segundo componente)
            testName = obx[3].components[1] || '';
          } else {
            // Caso contrário, usar o valor como está
            testName = obx[3];
          }
        }
        
        // Campo 5: Valor do resultado
        if (obx[5]) {
          result = typeof obx[5] === 'object' ? obx[5].value || '' : obx[5];
        }
        
        // Campo 6: Unidade
        if (obx[6]) {
          unit = typeof obx[6] === 'object' ? obx[6].value || '' : obx[6];
        }
        
        // Campo 7: Intervalo de referência
        if (obx[7]) {
          reference = typeof obx[7] === 'object' ? obx[7].value || '' : obx[7];
        }
        
        // Campo 11: Status do resultado (F=Final, P=Pendente, etc.)
        if (obx[11]) {
          const rawStatus = typeof obx[11] === 'object' ? obx[11].value || '' : obx[11];
          
          // Converter códigos de status para texto legível
          switch (rawStatus) {
            case 'F': status = 'Final'; break;
            case 'P': status = 'Pendente'; break;
            case 'C': status = 'Corrigido'; break;
            case 'X': status = 'Cancelado'; break;
            default: status = rawStatus || 'N/A';
          }
        }
        
        // Só incluir resultados que tenham um nome de teste válido
        if (testName && testName.length > 0) {
          resultsList.push({
            name: testName,
            value: result,
            unit: unit,
            reference: reference,
            status: status
          });
        }
      });
    }
    
    // Atualizar campos na visão do usuário
    // Definir informações do hospital e data do exame
    const hospitalElement = document.querySelector('.report-header .report-logo');
    if (hospitalElement) {
      hospitalElement.textContent = 'Hospital Exemplo';
    }
    
    document.getElementById('hl7-report-date').textContent = 'Data do Exame: ' + (reportDate || 'Não informada');
    document.getElementById('hl7-patient-name').textContent = patientName || 'Nome não informado';
    document.getElementById('hl7-patient-id').textContent = 'ID: ' + (patientId || 'Não informado');
    document.getElementById('hl7-exam-name').textContent = examName || 'Hemograma completo'; 
    
    // Limpar resultados anteriores
    const resultsContainer = document.getElementById('hl7-results');
    resultsContainer.innerHTML = '';
    
    // Limpar resultados anteriores e adicionar novos resultados
    if (resultsList.length > 0) {
      resultsList.forEach(result => {
        // Skip empty results
        if (!result.name || (!result.value && result.value !== '0')) {
          return;
        }
        
        // Check if result value is abnormal compared to reference range
        const isAbnormal = window.isAbnormalValue ? 
                           window.isAbnormalValue(result.value, result.reference) : 
                           false;
        
        // Create container for this result with proper styling
        const resultItem = document.createElement('div');
        resultItem.className = 'exam-result-item';
        resultItem.style.padding = '10px';
        resultItem.style.margin = '0 0 8px 0';
        resultItem.style.borderLeft = '3px solid ' + (isAbnormal ? '#ef4444' : '#10b981');
        
        // Ajustar cores para tema escuro
        const isDarkMode = document.body.classList.contains('dark-mode');
        if (isDarkMode) {
          resultItem.style.backgroundColor = '#1e293b';
        } else {
          resultItem.style.backgroundColor = '#f8fafc';
        }
        resultItem.style.borderRadius = '4px';
        
        // Create result header with test name and value
        const headerDiv = document.createElement('div');
        headerDiv.style.display = 'flex';
        headerDiv.style.justifyContent = 'space-between';
        headerDiv.style.fontSize = '16px';
        headerDiv.style.fontWeight = '500';
        
        // Test name on left side
        const nameSpan = document.createElement('span');
        nameSpan.textContent = result.name + ':';
        nameSpan.style.color = isDarkMode ? '#e2e8f0' : '#334155';
        
        // Value on right side (with color indicating normal/abnormal)
        const valueSpan = document.createElement('span');
        valueSpan.textContent = result.value + ' ' + (result.unit || '');
        valueSpan.style.color = isAbnormal ? '#ef4444' : '#10b981';
        
        // Add name and value to header
        headerDiv.appendChild(nameSpan);
        headerDiv.appendChild(valueSpan);
        
        // Create reference range text
        const referenceDiv = document.createElement('div');
        referenceDiv.style.fontSize = '13px';
        referenceDiv.style.color = isDarkMode ? '#94a3b8' : '#64748b';
        referenceDiv.style.marginTop = '4px';
        referenceDiv.textContent = 'Referência: ' + (result.reference || 'N/A');
        
        // Add everything to the result item
        resultItem.appendChild(headerDiv);
        resultItem.appendChild(referenceDiv);
        
        // Add this result to the container
        resultsContainer.appendChild(resultItem);
      });
    } else {
      // If no results found
      const noResultsMsg = document.createElement('div');
      noResultsMsg.className = 'no-results-message';
      noResultsMsg.textContent = 'Nenhum resultado disponível';
      noResultsMsg.style.padding = '10px';
      noResultsMsg.style.color = document.body.classList.contains('dark-mode') ? '#94a3b8' : '#64748b';
      resultsContainer.appendChild(noResultsMsg);
    }
  } catch (error) {
    console.error('Erro ao atualizar visão HL7:', error);
  }
}
