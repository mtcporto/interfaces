/**
 * MVP de Interfaceamento Laboratorial - Processamento de TXT
 */

// Função para processar dados TXT
function parseTXT() {
  const input = document.getElementById('txtinput').value;
  const delimiter = document.getElementById('txtDelimiter').value || '';
  const outputElement = document.getElementById('txtoutput');
  
  if (!input || !input.trim()) {
    outputElement.textContent = "Por favor, insira dados TXT para processar.";
    outputElement.className = 'error';
    return;
  }
  
  try {
    // Dividir linhas e remover linhas vazias
    const lines = input.split('\n').filter(line => line.trim().length > 0);
    
    if (lines.length === 0) {
      throw new Error('Não há dados para processar');
    }
    
    let result = [];
    
    if (delimiter) {
      // Processar como tabela delimitada
      const headers = lines[0].split(delimiter).map(header => header.trim());
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(delimiter).map(value => value.trim());
        
        if (values.length === headers.length) {
          const row = {};
          headers.forEach((header, index) => {
            row[header] = values[index];
          });
          result.push(row);
        }
      }
      
      // Atualizar a visão para usuário final (modo tabular)
      updateTXTUserViewTabular(result, headers);
    } else {
      // Sem delimitador, tratar como linhas de texto simples
      result = lines.map(line => line.trim());
      
      // Atualizar a visão para usuário final (modo texto)
      updateTXTUserViewText(result);
    }
    
    // Mostrar a saída técnica
    outputElement.textContent = JSON.stringify(result, null, 2);
    outputElement.className = 'success';
    
    // Atualizar data atual
    setCurrentDates();
    
    return result;
  } catch (error) {
    console.error('Erro ao processar dados TXT:', error);
    outputElement.textContent = 'Erro ao analisar TXT: ' + error.message;
    outputElement.className = 'error';
  }
}

// Função para atualizar a visão de usuário do TXT (modo tabular)
function updateTXTUserViewTabular(data, headers) {
  const tableHeader = document.getElementById('txt-table-header');
  const tableBody = document.getElementById('txt-results');
  
  tableHeader.innerHTML = '';
  tableBody.innerHTML = '';
  
  // Adicionar cabeçalhos da tabela
  const headerRow = document.createElement('tr');
  headers.forEach(header => {
    const th = document.createElement('th');
    th.textContent = header;
    headerRow.appendChild(th);
  });
  tableHeader.appendChild(headerRow);
  
  // Adicionar linhas de dados
  data.forEach(row => {
    const tableRow = document.createElement('tr');
    
    headers.forEach(header => {
      const cell = document.createElement('td');
      
      // Se tivermos uma coluna de Resultado e Referência, verificar anormalidades
      if (header === 'Resultado' && row['Referencia']) {
        const isAbnormal = isAbnormalValue(row[header], row['Referencia']);
        
        if (isAbnormal) {
          cell.className = 'abnormal';
        } else {
          cell.className = 'normal';
        }
      }
      
      cell.textContent = row[header] || '';
      tableRow.appendChild(cell);
    });
    
    tableBody.appendChild(tableRow);
  });
}

// Função para atualizar a visão de usuário do TXT (modo texto simples)
function updateTXTUserViewText(lines) {
  const tableHeader = document.getElementById('txt-table-header');
  const tableBody = document.getElementById('txt-results');
  
  tableHeader.innerHTML = '';
  tableBody.innerHTML = '';
  
  // Adicionar cabeçalho único
  const headerRow = document.createElement('tr');
  const th = document.createElement('th');
  th.textContent = 'Conteúdo';
  headerRow.appendChild(th);
  tableHeader.appendChild(headerRow);
  
  // Adicionar cada linha como uma linha da tabela
  lines.forEach(line => {
    const tableRow = document.createElement('tr');
    const cell = document.createElement('td');
    
    cell.textContent = line;
    tableRow.appendChild(cell);
    tableBody.appendChild(tableRow);
  });
}
