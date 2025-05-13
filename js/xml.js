/**
 * MVP de Interfaceamento Laboratorial - Processamento de XML
 */

// Função para processar dados XML
function parseXML() {
  const input = document.getElementById('xmlinput').value;
  const outputElement = document.getElementById('xmloutput');
  
  if (!input || !input.trim()) {
    outputElement.textContent = "Por favor, insira dados XML para processar.";
    outputElement.className = 'error';
    return;
  }
  
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(input, "application/xml");

    const parserError = xmlDoc.getElementsByTagName("parsererror");
    if (parserError.length > 0) {
      throw new Error("Erro de parsing XML: " + parserError[0].textContent.trim());
    }
    
    // Converter XML para JSON para facilitar o processamento
    const jsonResult = xmlToJson(xmlDoc.documentElement);
    
    // Mostrar a saída técnica
    outputElement.textContent = JSON.stringify(jsonResult, null, 2);
    outputElement.className = 'success';
    
    // Atualizar a visão para usuário final
    updateXMLUserView(jsonResult, xmlDoc);
    
    // Atualizar data atual
    setCurrentDates();
    
    return jsonResult;
  } catch (error) {
    console.error('Erro ao processar dados XML:', error);
    outputElement.textContent = 'Erro ao analisar XML: ' + error.message;
    outputElement.className = 'error';
  }
}

// Converter XML para JSON
function xmlToJson(xml) {
  let obj = {};
  if (xml.nodeType == 1) {
    if (xml.attributes.length > 0) {
      obj["@attributes"] = {};
      for (let j = 0; j < xml.attributes.length; j++) {
        const attribute = xml.attributes.item(j);
        obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
      }
    }
  } else if (xml.nodeType == 3) {
    obj = xml.nodeValue.trim();
  }

  if (xml.hasChildNodes()) {
    for(let i = 0; i < xml.childNodes.length; i++) {
      const item = xml.childNodes.item(i);
      const nodeName = item.nodeName;
      if (nodeName === "#text" && item.nodeValue.trim() === "") continue;

      if (typeof(obj[nodeName]) == "undefined") {
        if (item.nodeType === 3) {
            return xmlToJson(item);
        }
        obj[nodeName] = xmlToJson(item);
      } else {
        if (typeof(obj[nodeName].push) == "undefined") {
          const old = obj[nodeName];
          obj[nodeName] = [];
          obj[nodeName].push(old);
        }
        obj[nodeName].push(xmlToJson(item));
      }
    }
  }
  if (typeof obj === 'object' && Object.keys(obj).length === 1 && obj['#text']) {
      return obj['#text'];
  }
  return obj;
}

// Função para atualizar a visão de usuário do XML
function updateXMLUserView(jsonData, xmlDoc) {
  const patientsContainer = document.getElementById('xml-patients');
  patientsContainer.innerHTML = '';
  
  // Verificar se estamos lidando com o formato esperado (resultados de exames)
  if (jsonData.paciente) {
    const pacientes = Array.isArray(jsonData.paciente) ? jsonData.paciente : [jsonData.paciente];
    
    pacientes.forEach(paciente => {
      const patientCard = document.createElement('div');
      patientCard.className = 'patient-card';
      
      // Dados do paciente
      const patientId = paciente['@attributes']?.id || '';
      const patientName = paciente.nome || 'Paciente Não Identificado';
      
      // Cabeçalho do paciente
      patientCard.innerHTML = `
        <div class="patient-header">
          <div class="patient-name">${patientName}</div>
          <div class="patient-id">${patientId ? 'ID: ' + patientId : ''}</div>
        </div>
      `;
      
      // Lidar com exames
      if (paciente.exame) {
        const exames = Array.isArray(paciente.exame) ? paciente.exame : [paciente.exame];
        
        exames.forEach(exame => {
          const examSection = document.createElement('div');
          examSection.className = 'exam-section';
          
          // Título do exame
          const examTitle = document.createElement('h3');
          examTitle.textContent = exame['@attributes']?.tipo || 'Exame';
          examSection.appendChild(examTitle);
          
          // Tabela de resultados
          const table = document.createElement('table');
          table.className = 'result-table';
          table.innerHTML = `
            <thead>
              <tr>
                <th>Teste</th>
                <th>Resultado</th>
                <th>Unidade</th>
                <th>Referência</th>
              </tr>
            </thead>
            <tbody>
            </tbody>
          `;
          
          // Adicionar itens de resultado
          const tableBody = table.querySelector('tbody');
          
          // Processar itens (podem ser um ou vários)
          const items = exame.item ? (Array.isArray(exame.item) ? exame.item : [exame.item]) : [];
          
          items.forEach(item => {
            const row = document.createElement('tr');
            
            // Obter dados do item
            const name = item['@attributes']?.nome || '';
            const value = item['@attributes']?.valor || '';
            const unit = item['@attributes']?.unidade || '';
            const reference = item['@attributes']?.referencia || '';
            
            // Verificar se o valor está fora dos limites de referência
            const isAbnormal = isAbnormalValue(value, reference);
            const valueClass = isAbnormal ? 'abnormal' : 'normal';
            
            row.innerHTML = `
              <td>${name}</td>
              <td class="${valueClass}">${value}</td>
              <td>${unit}</td>
              <td>${reference}</td>
            `;
            
            tableBody.appendChild(row);
          });
          
          examSection.appendChild(table);
          patientCard.appendChild(examSection);
        });
      }
      
      patientsContainer.appendChild(patientCard);
    });
  } else {
    // Formato não reconhecido, mostrar uma visão genérica
    const genericView = document.createElement('div');
    genericView.className = 'generic-xml-view';
    
    const rootElement = xmlDoc.documentElement;
    genericView.innerHTML = `<p>Documento XML: <strong>${rootElement.nodeName}</strong></p>`;
    
    const list = document.createElement('ul');
    list.style.listStyleType = 'disc';
    list.style.paddingLeft = '20px';
    
    for (let i = 0; i < rootElement.childNodes.length; i++) {
      const child = rootElement.childNodes[i];
      if (child.nodeType === 1) { // Element node
        const item = document.createElement('li');
        item.innerHTML = `<strong>${child.nodeName}</strong>: ${child.textContent.substring(0, 50)}${child.textContent.length > 50 ? '...' : ''}`;
        list.appendChild(item);
      }
    }
    
    genericView.appendChild(list);
    patientsContainer.appendChild(genericView);
  }
}
