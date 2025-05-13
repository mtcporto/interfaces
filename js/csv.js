/**
 * MVP de Interfaceamento Laboratorial - Processamento de CSV
 */

// Função para processar dados CSV
function parseCSV() {
  const input = document.getElementById('csvinput').value;
  const delimiter = document.getElementById('csvDelimiter').value || ',';
  const outputElement = document.getElementById('csvoutput');
  
  if (!input || !input.trim()) {
    outputElement.textContent = "Por favor, insira dados CSV para processar.";
    outputElement.className = 'error';
    return;
  }
  
  try {
    // Dividir linhas e remover linhas vazias
    const lines = input.split('\n').filter(line => line.trim().length > 0);
    
    if (lines.length === 0) {
      throw new Error('Não há dados para processar');
    }
    
    // Processar cabeçalho e dados
    const headers = lines[0].split(delimiter).map(header => header.trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(delimiter).map(value => value.trim());
      
      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        data.push(row);
      }
    }
    
    // Mostrar a saída técnica
    outputElement.textContent = JSON.stringify(data, null, 2);
    outputElement.className = 'success';
    
    // Atualizar a visão de usuário final
    updateCSVUserView(data, headers);
    
    // Atualizar data atual
    setCurrentDates();
    
    return { headers, data };
  } catch (error) {
    console.error('Erro ao processar dados CSV:', error);
    outputElement.textContent = 'Erro ao analisar CSV: ' + error.message;
    outputElement.className = 'error';
  }
}

// Função para atualizar a visão de usuário final
function updateCSVUserView(data, headers) {
  const container = document.getElementById('csv-patients');
  container.innerHTML = '';
  
  // Agrupar por paciente (assumindo que o ID está na primeira coluna e Nome na segunda)
  const groupedByPatient = {};
  
  data.forEach(row => {
    const id = row[headers[0]] || 'Desconhecido';
    const name = row[headers[1]] || 'Paciente Não Identificado';
    
    if (!groupedByPatient[id]) {
      groupedByPatient[id] = {
        name: name,
        tests: []
      };
    }
    
    // Adicionar exame ao paciente
    if (headers.length >= 4) {
      const test = {
        name: row[headers[2]] || '',
        value: row[headers[3]] || '',
        unit: headers.length > 4 ? row[headers[4]] || '' : '',
        reference: headers.length > 5 ? row[headers[5]] || '' : ''
      };
      
      groupedByPatient[id].tests.push(test);
    }
  });
  
  // Criar cartões para cada paciente
  Object.keys(groupedByPatient).forEach(patientId => {
    const patient = groupedByPatient[patientId];
    
    const patientCard = document.createElement('div');
    patientCard.className = 'patient-card';
    
    // Cabeçalho do paciente
    patientCard.innerHTML = `
      <div class="patient-header">
        <div class="patient-name">${patient.name}</div>
        <div class="patient-id">ID: ${patientId}</div>
      </div>
    `;
    
    // Tabela de resultados
    if (patient.tests.length > 0) {
      const table = document.createElement('table');
      table.className = 'result-table';
      table.innerHTML = `
        <thead>
          <tr>
            <th>Exame</th>
            <th>Resultado</th>
            <th>Unidade</th>
            <th>Referência</th>
          </tr>
        </thead>
        <tbody>
        </tbody>
      `;
      
      const tableBody = table.querySelector('tbody');
      
      patient.tests.forEach(test => {
        const row = document.createElement('tr');
        
        // Verificar se o resultado está fora dos limites de referência
        const isAbnormal = isAbnormalValue(test.value, test.reference);
        const valueClass = isAbnormal ? 'abnormal' : 'normal';
        
        row.innerHTML = `
          <td>${test.name}</td>
          <td class="${valueClass}">${test.value}</td>
          <td>${test.unit}</td>
          <td>${test.reference}</td>
        `;
        
        tableBody.appendChild(row);
      });
      
      patientCard.appendChild(table);
    }
    
    container.appendChild(patientCard);
  });
}
