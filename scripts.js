document.addEventListener('DOMContentLoaded', function() {
    showSection('intro'); // Show intro section by default
    const firstNavButton = document.querySelector('nav button');
    if (firstNavButton) {
      firstNavButton.classList.add('active');
    }
    
    // Set current dates for reports
    setCurrentDates();
    
    // Setup DICOM dropzone
    setupDicomDropzone();
    
    // Lista os arquivos DICOM locais disponíveis
    loadLocalDicomFiles();
    
    // Check for dark mode preference
    if (localStorage.getItem('darkMode') === 'enabled') {
      document.body.classList.add('dark-mode');
      document.querySelector('.theme-toggle i').classList.replace('fa-moon', 'fa-sun');
    }

    // Adicionar listener para o seletor de DICOM online
    const onlineDicomSelect = document.getElementById('onlineDicomSelect');
    if (onlineDicomSelect) {
      onlineDicomSelect.addEventListener('change', function() {
        if (this.value) {
          downloadOnlineDicom(this.value);
        }
      });
    }
  });

  // Função para listar arquivos DICOM locais disponíveis
  function loadLocalDicomFiles() {
    const localDicomSelect = document.getElementById('localDicomSelect');
    if (!localDicomSelect) return;
    
    // Lista de arquivos DICOM disponíveis na pasta dicom/
    const dicomFiles = [];
    
    // Adicionando dinamicamente arquivos da pasta dicom/
    for (let i = 0; i <= 114; i++) {
      const fileNum = i.toString().padStart(5, '0');
      dicomFiles.push(`image-${fileNum}.dcm`);
    }
    
    // Ordenar por nome de arquivo
    dicomFiles.sort();
    
    // Limpar as opções atuais
    while (localDicomSelect.options.length > 1) {
      localDicomSelect.remove(1);
    }
    
    // Adicionar as opções de arquivos DICOM
    dicomFiles.forEach((file, index) => {
      const option = document.createElement('option');
      option.value = file;
      option.textContent = `${file} (Arquivo ${index + 1} de ${dicomFiles.length})`;
      localDicomSelect.appendChild(option);
    });
    
    // Adicionar listener de mudança
    localDicomSelect.addEventListener('change', function() {
      if (this.value) {
        loadLocalDicomFile(this.value);
      }
    });
  }

  // Função para carregar um arquivo DICOM local específico
  function loadLocalDicomFile(filename) {
    const filepath = `dicom/${filename}`;
    const outputElement = document.getElementById('dicomOutput');
    
    if (outputElement) {
      outputElement.textContent = `Carregando ${filepath}...`;
      outputElement.className = '';
    }
    
    // Buscar o arquivo DICOM
    fetch(filepath)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Erro ao carregar arquivo: ${response.status} ${response.statusText}`);
        }
        return response.arrayBuffer();
      })
      .then(buffer => {
        processDicomBuffer(buffer, outputElement, filename);
      })
      .catch(error => {
        if (outputElement) {
          outputElement.textContent = `Erro: ${error.message}`;
          outputElement.className = 'error';
        }
        console.error('Erro ao carregar arquivo DICOM:', error);
      });
  }

  // Função para alternar entre as fontes DICOM
  function switchDicomSource(showTabId, hideTab1Id, hideTab2Id, clickedTab) {
    document.getElementById(showTabId).classList.add('active');
    document.getElementById(hideTab1Id).classList.remove('active');
    document.getElementById(hideTab2Id).classList.remove('active');
    
    // Atualizar aba ativa
    clickedTab.classList.add('active');
    const tabs = clickedTab.parentElement.querySelectorAll('.tab');
    tabs.forEach(tab => {
      if (tab !== clickedTab) tab.classList.remove('active');
    });
  }

  // Função para baixar DICOM de biblioteca online
  function downloadOnlineDicom(modalityType) {
    const statusElement = document.getElementById('onlineDicomStatus');
    const outputElement = document.getElementById('dicomOutput');
    
    if (!statusElement || !outputElement) return;
    
    // URLs de exemplos públicos de DICOM (suponha uma API pública)
    const dicomLibraryURLs = {
      'CT': 'https://raw.githubusercontent.com/cornerstonejs/cornerstoneWADOImageLoader/master/testImages/CT2_J2KR.dcm',
      'MR': 'https://raw.githubusercontent.com/cornerstonejs/cornerstoneWADOImageLoader/master/testImages/MR2_JPLY.dcm',
      'XR': 'https://raw.githubusercontent.com/cornerstonejs/cornerstoneWADOImageLoader/master/testImages/XA1_JPLL.dcm',
      'US': 'https://raw.githubusercontent.com/cornerstonejs/cornerstoneWADOImageLoader/master/testImages/US1_JPLL.dcm',
      'MG': 'https://raw.githubusercontent.com/cornerstonejs/cornerstoneWADOImageLoader/master/testImages/MG1_JPLL.dcm'
    };
    
    const url = dicomLibraryURLs[modalityType];
    if (!url) {
      statusElement.innerHTML = `<div class="error">Tipo de modalidade não suportado: ${modalityType}</div>`;
      return;
    }
    
    // Mostrar indicador de carregamento
    statusElement.innerHTML = `
      <div class="loading-indicator">
        <span class="spinner"></span>
        Baixando arquivo DICOM ${modalityType}...
      </div>
    `;
    
    outputElement.textContent = 'Baixando arquivo DICOM da biblioteca online...';
    
    // Buscar o arquivo DICOM online
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Erro ao baixar arquivo: ${response.status} ${response.statusText}`);
        }
        return response.arrayBuffer();
      })
      .then(buffer => {
        statusElement.innerHTML = `<div class="success">Arquivo DICOM ${modalityType} baixado com sucesso</div>`;
        processDicomBuffer(buffer, outputElement, `online_${modalityType}.dcm`);
      })
      .catch(error => {
        statusElement.innerHTML = `<div class="error">Erro: ${error.message}</div>`;
        outputElement.textContent = `Erro: ${error.message}`;
        outputElement.className = 'error';
        console.error('Erro ao baixar arquivo DICOM:', error);
      });
  }

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
  
  function setCurrentDates() {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    document.getElementById('csv-current-date').textContent = formattedDate;
    document.getElementById('txt-current-date').textContent = formattedDate;
    document.getElementById('xml-current-date').textContent = formattedDate;
  }
  
  function setupDicomDropzone() {
    const dropZone = document.getElementById('dicomDropZone');
    const fileInput = document.getElementById('dicomFile');
    
    if (dropZone && fileInput) {
      dropZone.addEventListener('click', () => {
        fileInput.click();
      });
      
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
      });
      
      dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
      });
      
      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        
        if (e.dataTransfer.files.length) {
          fileInput.files = e.dataTransfer.files;
          const filename = e.dataTransfer.files[0].name;
          dropZone.innerHTML = `<i class="fas fa-file-medical" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                               <p>${filename}</p>`;
        }
      });
      
      fileInput.addEventListener('change', () => {
        if (fileInput.files.length) {
          const filename = fileInput.files[0].name;
          dropZone.innerHTML = `<i class="fas fa-file-medical" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                               <p>${filename}</p>`;
        }
      });
    }
  }

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
  
  function switchTab(showTabId, hideTabId, clickedTab) {
    document.getElementById(showTabId).classList.add('active');
    document.getElementById(hideTabId).classList.remove('active');
    
    // Update active tab highlight
    clickedTab.classList.add('active');
    const tabs = clickedTab.parentElement.querySelectorAll('.tab');
    tabs.forEach(tab => {
      if (tab !== clickedTab) tab.classList.remove('active');
    });
  }

  // Função auxiliar para determinar se um valor está fora dos limites de referência
  function isAbnormalValue(value, reference) {
    if (!reference || reference === 'N/A') return false;
    
    // Remover caracteres não-numéricos que não sejam operadores
    value = value.toString().replace(/[^\d.-]/g, '');
    
    // Processando diferentes formatos de referência
    if (reference.includes('-')) {
      // Intervalo: "10-20"
      const [min, max] = reference.split('-').map(v => parseFloat(v));
      const numValue = parseFloat(value);
      return numValue < min || numValue > max;
    } else if (reference.startsWith('<')) {
      // Limite superior: "<200"
      const max = parseFloat(reference.substring(1));
      const numValue = parseFloat(value);
      return numValue >= max;
    } else if (reference.startsWith('>')) {
      // Limite inferior: ">40"
      const min = parseFloat(reference.substring(1));
      const numValue = parseFloat(value);
      return numValue <= min;
    }
    
    return false;
  }

  async function connectSerial() {
    const output = document.getElementById('serialOutput');
    try {
      if (!navigator.serial) {
        throw new Error("Web Serial API não suportada neste navegador. Tente Chrome ou Edge.");
      }
      
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });

      const decoder = new TextDecoderStream();
      const inputDone = port.readable.pipeTo(decoder.writable);
      const inputStream = decoder.readable;

      output.textContent = "Conectado com sucesso à porta serial.\n";
      
      const reader = inputStream.getReader();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        output.textContent += value;
      }
    } catch (e) {
      output.textContent = 'Erro: ' + e.message;
    }
  }

  function parseHL7() {
    const outputElement = document.getElementById('hl7output');
    const userFriendlyView = document.getElementById('hl7-user-tab');
    
    try {
      const input = document.getElementById('hl7input').value;
      if (!input.trim()) {
        outputElement.textContent = 'Entrada HL7 está vazia.';
        outputElement.className = 'error';
        return;
      }

      // Parser HL7 personalizado
      function parseHL7Message(text) {
        const result = {};
        const segments = text.split('\n').filter(line => line.trim().length > 0);
        
        segments.forEach(segment => {
          const segmentType = segment.substring(0, 3);
          const fields = segment.split('|');
          
          if (!result[segmentType]) {
            result[segmentType] = [];
          }
          
          const processedSegment = {
            raw: segment,
            fields: {}
          };
          
          fields.forEach((field, index) => {
            const components = field.split('^');
            if (components.length > 1) {
              processedSegment.fields[index] = {
                raw: field,
                components: components
              };
            } else {
              processedSegment.fields[index] = field;
            }
          });
          
          result[segmentType].push(processedSegment);
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
  
  // Função para atualizar a visão de usuário do HL7
  function updateHL7UserView(parsedMessage) {
    // Extrair data do exame (do segmento MSH campo 7)
    let examDate = '';
    if (parsedMessage.MSH && parsedMessage.MSH[0] && parsedMessage.MSH[0].fields[7]) {
      const rawDate = parsedMessage.MSH[0].fields[7];
      if (rawDate.length >= 8) {
        // Formatar data AAAAMMDD para DD/MM/AAAA
        examDate = rawDate.substring(6, 8) + '/' + 
                   rawDate.substring(4, 6) + '/' + 
                   rawDate.substring(0, 4);
      }
    }
    document.getElementById('hl7-report-date').textContent = 'Data do Exame: ' + examDate;
    
    // Extrair dados do paciente (do segmento PID)
    let patientName = 'Não identificado';
    let patientId = '';
    
    if (parsedMessage.PID && parsedMessage.PID[0]) {
      // Nome do paciente geralmente está no campo 5
      if (parsedMessage.PID[0].fields[5] && parsedMessage.PID[0].fields[5].components) {
        const nameComponents = parsedMessage.PID[0].fields[5].components;
        patientName = nameComponents[1] + ' ' + nameComponents[0]; // Nome Sobrenome
      }
      
      // ID do paciente geralmente está no campo 3
      if (parsedMessage.PID[0].fields[3]) {
        if (typeof parsedMessage.PID[0].fields[3] === 'string') {
          patientId = parsedMessage.PID[0].fields[3];
        } else if (parsedMessage.PID[0].fields[3].components) {
          patientId = parsedMessage.PID[0].fields[3].components[0];
        }
      }
    }
    
    document.getElementById('hl7-patient-name').textContent = patientName;
    document.getElementById('hl7-patient-id').textContent = 'ID: ' + patientId;
    
    // Extrair dados do exame (dos segmentos OBR e OBX)
    let examName = 'Exame Laboratorial';
    const resultsList = document.getElementById('hl7-results');
    resultsList.innerHTML = ''; // Limpar resultados anteriores
    
    // Obter nome do exame do segmento OBR
    if (parsedMessage.OBR && parsedMessage.OBR[0] && parsedMessage.OBR[0].fields[4]) {
      if (parsedMessage.OBR[0].fields[4].components) {
        examName = parsedMessage.OBR[0].fields[4].components[1];
      }
    }
    document.getElementById('hl7-exam-name').textContent = examName;
    
    // Processar resultados dos segmentos OBX
    if (parsedMessage.OBX) {
      parsedMessage.OBX.forEach(obx => {
        // Criar elemento para cada resultado
        const resultItem = document.createElement('div');
        resultItem.className = 'exam-item';
        
        // Obter nome do teste
        let testName = 'Teste';
        if (obx.fields[3] && obx.fields[3].components) {
          testName = obx.fields[3].components[1];
        }
        
        // Obter valor e unidade
        const value = obx.fields[5] || '';
        const unit = obx.fields[6] || '';
        
        // Obter valores de referência
        const refRange = obx.fields[7] || '';
        
        // Verificar se o valor está fora do intervalo de referência
        const abnormalFlag = obx.fields[8] || '';
        const isAbnormal = abnormalFlag === 'A' || abnormalFlag === 'H' || abnormalFlag === 'L';
        
        // Criar o HTML do resultado
        resultItem.innerHTML = `
          <div><strong>${testName}:</strong> 
            <span class="${isAbnormal ? 'abnormal' : 'normal'}">${value} ${unit}</span>
          </div>
          <div class="reference-range">Referência: ${refRange}</div>
        `;
        
        resultsList.appendChild(resultItem);
      });
    }
    
    // Se não houver resultados, mostrar mensagem
    if (!parsedMessage.OBX || parsedMessage.OBX.length === 0) {
      resultsList.innerHTML = '<div class="exam-item">Não há resultados disponíveis</div>';
    }
  }
  
  function parseASTM() {
    const outputElement = document.getElementById('astmoutput');
    try {
      const input = document.getElementById('astminput').value;
      if (!input.trim()) {
        outputElement.textContent = 'Entrada ASTM está vazia.';
        outputElement.className = 'error';
        return;
      }
      
      const lines = input.split('\n');
      const parsed = {};
      
      lines.forEach(line => {
        if (!line.trim()) return;
        const parts = line.split('|');
        const recordType = parts[0];
        if (!parsed[recordType]) {
          parsed[recordType] = [];
        }
        parsed[recordType].push(parts);
      });
      
      // Exibir visão técnica
      outputElement.textContent = JSON.stringify(parsed, null, 2);
      outputElement.className = 'success';
      
      // Atualizar a visão para usuário final
      updateASTMUserView(parsed);
      
    } catch (error) {
      console.error("Erro no parseASTM:", error);
      outputElement.textContent = 'Erro ao analisar ASTM: ' + error.message;
      outputElement.className = 'error';
    }
  }
  
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
    resultsBody.innerHTML = ''; // Limpar resultados anteriores
    
    if (parsedAST.R) {
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

  function parseDicomFile() {
    const fileInput = document.getElementById('dicomFile');
    const outputElement = document.getElementById('dicomOutput');
    
    // Verificar se há arquivos selecionados, se não, usar dados de exemplo
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      // Mostrar dados de exemplo ao invés de lançar erro
      useDicomExampleData(outputElement);
      return;
    }
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
      try {
        if (typeof dicomParser === 'undefined') {
          outputElement.textContent = 'Biblioteca dicomParser não carregada. Verifique o console.';
          outputElement.className = 'error';
          return;
        }
        
        const byteArray = new Uint8Array(e.target.result);
        const dataSet = dicomParser.parseDicom(byteArray);
        
        const extractedData = {
          patientName: dataSet.string('x00100010'),
          patientID: dataSet.string('x00100020'),
          studyInstanceUID: dataSet.string('x0020000d'),
          studyDate: dataSet.string('x00080020'),
          studyTime: dataSet.string('x00080030'),
          modality: dataSet.string('x00080060'),
          seriesDescription: dataSet.string('x0008103e'),
          imageType: dataSet.string('x00080008'),
          rows: dataSet.uint16('x00280010'),
          columns: dataSet.uint16('x00280011'),
          pixelSpacing: dataSet.string('x00280030'),
          sliceThickness: dataSet.string('x00180050'),
          manufacturer: dataSet.string('x00080070'),
          SOPInstanceUID: dataSet.string('x00080018'),
          institutionName: dataSet.string('x00080080')
        };
        
        for (const key in extractedData) {
          if (extractedData[key] === undefined || extractedData[key] === null) {
            extractedData[key] = 'N/A';
          }
        }

        // Exibir visão técnica
        outputElement.textContent = JSON.stringify(extractedData, null, 2);
        outputElement.className = 'success';
        
        // Atualizar visão para usuário final
        updateDicomUserView(extractedData);
        
      } catch (error) {
        console.error("Erro no parseDicomFile:", error);
        outputElement.textContent = 'Erro ao analisar DICOM: ' + error.message;
        outputElement.className = 'error';
      }
    };
    
    reader.onerror = function() {
      outputElement.textContent = 'Erro ao ler o arquivo.';
      outputElement.className = 'error';
    };
    
    reader.readAsArrayBuffer(file);
  }
  
  // Nova função para usar dados de exemplo DICOM
  function useDicomExampleData(outputElement) {
    // Dados de exemplo simulando resultado de um arquivo DICOM
    const exampleDicomData = {
      patientName: "SILVA^JOSE",
      patientID: "PAT12345",
      studyInstanceUID: "1.2.840.113619.2.30.1.1762295590.1623.978669.200",
      studyDate: "20250510",
      studyTime: "142211",
      modality: "CT",
      seriesDescription: "TÓRAX SEM CONTRASTE",
      imageType: "ORIGINAL\\PRIMARY\\AXIAL",
      rows: 512,
      columns: 512,
      pixelSpacing: "0.7\\0.7",
      sliceThickness: "3.0",
      manufacturer: "GE MEDICAL SYSTEMS",
      SOPInstanceUID: "1.2.840.113619.2.30.1.1762295590.1623.978669.201",
      institutionName: "HOSPITAL REGIONAL DE SÃO PAULO"
    };

    // Exibir visão técnica
    outputElement.textContent = JSON.stringify(exampleDicomData, null, 2);
    outputElement.className = 'success';
    
    // Atualizar visão para usuário final
    updateDicomUserView(exampleDicomData);
    
    // Atualizar visual da zona de drop para indicar dados de exemplo
    const dropZone = document.getElementById('dicomDropZone');
    if (dropZone) {
      dropZone.innerHTML = `
        <i class="fas fa-file-medical" style="font-size: 2rem; margin-bottom: 1rem;"></i>
        <p>Dados de exemplo carregados</p>
        <p style="font-size: 0.85rem; color: #64748b;">Você pode carregar seu próprio arquivo DICOM ou continuar com o exemplo</p>
      `;
    }
  }

  // Função para atualizar a visão de usuário do DICOM
  function updateDicomUserView(dicomData) {
    // Nome da instituição
    document.getElementById('dicom-facility-name').textContent = 
      dicomData.institutionName !== 'N/A' ? dicomData.institutionName : 'Centro de Imagem';
    
    // Formatar data do estudo
    let studyDate = 'Data não disponível';
    if (dicomData.studyDate !== 'N/A') {
      const year = dicomData.studyDate.substring(0, 4);
      const month = dicomData.studyDate.substring(4, 6);
      const day = dicomData.studyDate.substring(6, 8);
      studyDate = day + '/' + month + '/' + year;
    }
    document.getElementById('dicom-study-date').textContent = 'Data do Exame: ' + studyDate;
    
    // Nome do paciente
    let patientName = 'Paciente não identificado';
    if (dicomData.patientName !== 'N/A') {
      const nameParts = dicomData.patientName.split('^');
      if (nameParts.length > 1) {
        patientName = nameParts[1] + ' ' + nameParts[0]; // Nome Sobrenome
      } else {
        patientName = dicomData.patientName;
      }
    }
    document.getElementById('dicom-patient-name').textContent = patientName;
    
    // ID do paciente
    document.getElementById('dicom-patient-id').textContent = 'ID: ' + dicomData.patientID;
    
    // Modalidade
    document.getElementById('dicom-modality').textContent = dicomData.modality;
    
    // Adicionar metadados
    const metadataContainer = document.getElementById('dicom-metadata');
    metadataContainer.innerHTML = '';
    
    const metadataToShow = {
      'Descrição da Série': dicomData.seriesDescription,
      'Dimensões': `${dicomData.rows} × ${dicomData.columns} pixels`,
      'Espaçamento de Pixel': dicomData.pixelSpacing,
      'Espessura do Corte': dicomData.sliceThickness + ' mm',
      'Fabricante': dicomData.manufacturer,
      'Tipo de Imagem': dicomData.imageType
    };
    
    for (const [label, value] of Object.entries(metadataToShow)) {
      if (value !== 'N/A' && value !== 'N/A mm') {
        const metadataItem = document.createElement('div');
        metadataItem.className = 'dicom-info-item';
        metadataItem.innerHTML = `
          <div class="dicom-info-label">${label}</div>
          <div>${value}</div>
        `;
        metadataContainer.appendChild(metadataItem);
      }
    }
  }

  // Função para processar um buffer DICOM (usado para ambos upload e arquivos locais)
  function processDicomBuffer(buffer, outputElement, filename) {
    try {
      if (typeof dicomParser === 'undefined') {
        outputElement.textContent = 'Biblioteca dicomParser não carregada. Verifique o console.';
        outputElement.className = 'error';
        return;
      }
      
      const byteArray = new Uint8Array(buffer);
      const dataSet = dicomParser.parseDicom(byteArray);
      
      const extractedData = {
        patientName: dataSet.string('x00100010'),
        patientID: dataSet.string('x00100020'),
        studyInstanceUID: dataSet.string('x0020000d'),
        studyDate: dataSet.string('x00080020'),
        studyTime: dataSet.string('x00080030'),
        modality: dataSet.string('x00080060'),
        seriesDescription: dataSet.string('x0008103e'),
        imageType: dataSet.string('x00080008'),
        rows: dataSet.uint16('x00280010'),
        columns: dataSet.uint16('x00280011'),
        pixelSpacing: dataSet.string('x00280030'),
        sliceThickness: dataSet.string('x00180050'),
        manufacturer: dataSet.string('x00080070'),
        SOPInstanceUID: dataSet.string('x00080018'),
        institutionName: dataSet.string('x00080080'),
        fileName: filename || 'arquivo.dcm'
      };
      
      // Normalizar os dados para evitar valores undefined/null
      for (const key in extractedData) {
        if (extractedData[key] === undefined || extractedData[key] === null) {
          extractedData[key] = 'N/A';
        }
      }

      // Exibir visão técnica
      outputElement.textContent = JSON.stringify(extractedData, null, 2);
      outputElement.className = 'success';
      
      // Atualizar visão para usuário final
      updateDicomUserView(extractedData);

      // Atualizar o contêiner de imagem, removendo mensagem de placeholder
      updateDicomImageContainer(extractedData);
      
      return extractedData;
    } catch (error) {
      console.error("Erro ao processar DICOM:", error);
      outputElement.textContent = 'Erro ao analisar DICOM: ' + error.message;
      outputElement.className = 'error';
      return null;
    }
  }
  
  // Função para atualizar o contêiner de imagem DICOM
  function updateDicomImageContainer(dicomData) {
    const imageContainer = document.getElementById('dicom-image-container');
    if (!imageContainer) return;
    
    // Remover o ícone placeholder e adicionar uma representação melhor
    imageContainer.innerHTML = `
      <div class="dicom-canvas-container">
        <div style="background-color: #0a0a0a; color: #ffffff; padding: 1rem; text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: center;">
          <div style="font-size: 1.2rem; margin-bottom: 1rem;">
            ${dicomData.modality} - ${dicomData.rows}×${dicomData.columns}
          </div>
          <div style="font-size: 0.9rem; color: #aaa;">
            ${dicomData.fileName}
          </div>
          <div style="margin-top: 2rem;">
            <i class="fas fa-x-ray" style="font-size: 5rem; color: #4b5563;"></i>
          </div>
          <div style="margin-top: 1rem; font-size: 0.85rem; color: #aaa;">
            Visualização de pixel não disponível - necessário biblioteca adicional
          </div>
        </div>
      </div>
      <div class="dicom-controls">
        <button class="dicom-btn" title="Ajustar brilho e contraste" disabled>
          <i class="fas fa-adjust"></i> Ajustar
        </button>
        <button class="dicom-btn" title="Ampliar imagem" disabled>
          <i class="fas fa-search-plus"></i> Zoom
        </button>
        <button class="dicom-btn" title="Medir distância" disabled>
          <i class="fas fa-ruler"></i> Medir
        </button>
      </div>
    `;
  }

  function parseCSV() {
    const outputElement = document.getElementById('csvoutput');
    try {
      const input = document.getElementById('csvinput').value;
      const delimiter = document.getElementById('csvDelimiter').value || ',';
      
      if (!input.trim()) {
        outputElement.textContent = 'Entrada CSV está vazia.';
        outputElement.className = 'error';
        return;
      }

      const lines = input.trim().split('\n');
      const headers = lines[0].split(delimiter).map(h => h.trim());
      const result = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(delimiter);
        if (values.length === headers.length) {
          const entry = {};
          headers.forEach((header, index) => {
            entry[header] = values[index].trim();
          });
          result.push(entry);
        }
      }
      
      // Exibir visão técnica
      outputElement.textContent = JSON.stringify(result, null, 2);
      outputElement.className = 'success';
      
      // Atualizar a visão para usuário final
      updateCSVUserView(result, headers);
      
      // Atualizar data atual
      const now = new Date();
      const formattedDate = now.toLocaleDateString('pt-BR');
      document.getElementById('csv-current-date').textContent = formattedDate;
      
    } catch (error) {
      console.error("Erro no parseCSV:", error);
      outputElement.textContent = 'Erro ao analisar CSV: ' + error.message;
      outputElement.className = 'error';
    }
  }
  
  // Função para atualizar a visão de usuário do CSV
  function updateCSVUserView(data, headers) {
    const patientsContainer = document.getElementById('csv-patients');
    patientsContainer.innerHTML = '';
    
    // Verificar se temos colunas necessárias para resultados de exames
    const hasPatientColumn = headers.includes('Nome') || headers.includes('Paciente');
    const hasExamColumn = headers.includes('Exame');
    const hasResultColumn = headers.includes('Resultado');
    
    if (hasPatientColumn && hasExamColumn && hasResultColumn) {
      // Agrupar por paciente
      const patientMap = {};
      
      data.forEach(row => {
        const patientName = row['Nome'] || row['Paciente'] || 'Paciente Não Identificado';
        if (!patientMap[patientName]) {
          patientMap[patientName] = [];
        }
        patientMap[patientName].push(row);
      });
      
      // Criar cartão para cada paciente
      for (const [patientName, exams] of Object.entries(patientMap)) {
        const patientCard = document.createElement('div');
        patientCard.className = 'patient-card';
        
        // Cabeçalho do paciente
        const patientHeader = document.createElement('div');
        patientHeader.className = 'patient-header';
        
        let patientId = '';
        if (exams[0]['ID']) {
          patientId = exams[0]['ID'];
        }
        
        patientHeader.innerHTML = `
          <div class="patient-name">${patientName}</div>
          <div class="patient-id">${patientId ? 'ID: ' + patientId : ''}</div>
        `;
        
        patientCard.appendChild(patientHeader);
        
        // Tabela de resultados
        const examTable = document.createElement('table');
        examTable.className = 'result-table';
        examTable.innerHTML = `
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
        
        const tableBody = examTable.querySelector('tbody');
        
        // Adicionar cada exame à tabela
        exams.forEach(exam => {
          const examName = exam['Exame'];
          const result = exam['Resultado'];
          const unit = exam['Unidade'] || '';
          const reference = exam['Referencia'] || exam['Referência'] || '';
          
          // Verificar se o resultado está fora do intervalo de referência
          const isAbnormal = isAbnormalValue(result, reference);
          
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${examName}</td>
            <td class="${isAbnormal ? 'abnormal' : 'normal'}">${result}</td>
            <td>${unit}</td>
            <td>${reference}</td>
          `;
          
          tableBody.appendChild(row);
        });
        
        patientCard.appendChild(examTable);
        patientsContainer.appendChild(patientCard);
      }
    } else {
      // Se não for um CSV de resultados de exames, mostrar como tabela genérica
      const tableContainer = document.createElement('div');
      tableContainer.innerHTML = `
        <div class="info-box">
          <i class="fas fa-info-circle info-icon"></i>
          <div>Visualização genérica de dados tabulares</div>
        </div>
      `;
      
      const table = document.createElement('table');
      table.className = 'result-table';
      
      // Cabeçalho
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      
      headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
      });
      
      thead.appendChild(headerRow);
      table.appendChild(thead);
      
      // Corpo
      const tbody = document.createElement('tbody');
      
      data.forEach(row => {
        const tr = document.createElement('tr');
        
        headers.forEach(header => {
          const td = document.createElement('td');
          td.textContent = row[header] || '';
          tr.appendChild(td);
        });
        
        tbody.appendChild(tr);
      });
      
      table.appendChild(tbody);
      tableContainer.appendChild(table);
      patientsContainer.appendChild(tableContainer);
    }
  }

  function parseTXT() {
    const outputElement = document.getElementById('txtoutput');
    try {
      const input = document.getElementById('txtinput').value;
      const delimiter = document.getElementById('txtDelimiter').value;

      if (!input.trim()) {
        outputElement.textContent = 'Entrada TXT está vazia.';
        outputElement.className = 'error';
        return;
      }

      const lines = input.trim().split('\n');
      let result;

      if (delimiter) {
        const headers = lines[0].split(delimiter).map(h => h.trim());
        const parsedData = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(delimiter);
          if (values.length === headers.length) {
            const entry = {};
            headers.forEach((header, index) => {
              entry[header] = values[index].trim();
            });
            parsedData.push(entry);
          }
        }
        result = parsedData;
        
        // Atualizar a visão para usuário final (modo tabular)
        updateTXTUserViewTabular(result, headers);
      } else {
        // Sem delimitador, tratar como linhas de texto simples
        result = lines.map(line => line.trim());
        
        // Atualizar a visão para usuário final (modo texto)
        updateTXTUserViewText(result);
      }
      
      // Exibir visão técnica
      outputElement.textContent = JSON.stringify(result, null, 2);
      outputElement.className = 'success';
      
      // Atualizar data atual
      const now = new Date();
      const formattedDate = now.toLocaleDateString('pt-BR');
      document.getElementById('txt-current-date').textContent = formattedDate;
      
    } catch (error) {
      console.error("Erro no parseTXT:", error);
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

  function parseXML() {
    const outputElement = document.getElementById('xmloutput');
    try {
      const input = document.getElementById('xmlinput').value;
      if (!input.trim()) {
        outputElement.textContent = 'Entrada XML está vazia.';
        outputElement.className = 'error';
        return;
      }

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(input, "application/xml");

      const parserError = xmlDoc.getElementsByTagName("parsererror");
      if (parserError.length > 0) {
        throw new Error("Erro de parsing XML: " + parserError[0].textContent.trim());
      }
      
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

      const jsonResult = xmlToJson(xmlDoc.documentElement);
      
      // Exibir visão técnica
      outputElement.textContent = JSON.stringify(jsonResult, null, 2);
      outputElement.className = 'success';
      
      // Atualizar a visão para usuário final
      updateXMLUserView(jsonResult, xmlDoc);
      
      // Atualizar data atual
      const now = new Date();
      const formattedDate = now.toLocaleDateString('pt-BR');
      document.getElementById('xml-current-date').textContent = formattedDate;
      
    } catch (error) {
      console.error("Erro no parseXML:", error);
      outputElement.textContent = 'Erro ao analisar XML: ' + error.message;
      outputElement.className = 'error';
    }
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
            
            if (exame.item) {
              const itens = Array.isArray(exame.item) ? exame.item : [exame.item];
              
              itens.forEach(item => {
                if (item['@attributes']) {
                  const nome = item['@attributes'].nome || '';
                  const valor = item['@attributes'].valor || '';
                  const unidade = item['@attributes'].unidade || '';
                  const referencia = item['@attributes'].referencia || '';
                  
                  // Verificar se o resultado está fora do intervalo de referência
                  const isAbnormal = isAbnormalValue(valor, referencia);
                  
                  const row = document.createElement('tr');
                  row.innerHTML = `
                    <td>${nome}</td>
                    <td class="${isAbnormal ? 'abnormal' : 'normal'}">${valor}</td>
                    <td>${unidade}</td>
                    <td>${referencia}</td>
                  `;
                  
                  tableBody.appendChild(row);
                }
              });
            }
            
            examSection.appendChild(table);
            patientCard.appendChild(examSection);
          });
        }
        
        patientsContainer.appendChild(patientCard);
      });
    } else {
      // Para XML genérico, tentar exibir uma árvore de dados
      const infoBox = document.createElement('div');
      infoBox.className = 'info-box';
      infoBox.innerHTML = `
        <i class="fas fa-info-circle info-icon"></i>
        <div>Os dados XML não seguem o formato esperado de resultados de exames.</div>
      `;
      patientsContainer.appendChild(infoBox);
      
      // Tentar construir uma representação amigável
      const genericView = document.createElement('div');
      genericView.className = 'generic-xml-view';
      
      // Extrair e mostrar nós de primeiro nível
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