/**
 * MVP de Interfaceamento Laboratorial - Funcionalidades DICOM
 */

// Inicialização dos componentes DICOM
document.addEventListener('DOMContentLoaded', function() {
  // Setup DICOM dropzone
  setupDicomDropzone();
  
  // Lista os arquivos DICOM locais disponíveis
  loadLocalDicomFiles();
  
  // Inicializar cornerstone para visualização DICOM
  initializeCornerstone();
  
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

// Inicialização da biblioteca Cornerstone para visualização de imagens DICOM
function initializeCornerstone() {
  if (typeof cornerstone !== 'undefined') {
    // Ativar elementos de visualização
    const element = document.getElementById('dicom-image-container');
    if (element) {
      try {
        // Configurar cornerstone para usar o WebWorker
        cornerstone.registerImageLoader('dicomFile', loadDicomImage);
        
        // Ativar recursos DICOM e ferramentas
        if (typeof cornerstoneTools !== 'undefined') {
          cornerstoneTools.external.cornerstone = cornerstone;
          cornerstoneTools.init();
        }
        
        console.log('Cornerstone inicializado com sucesso.');
      } catch (error) {
        console.error('Erro ao inicializar Cornerstone:', error);
      }
    }
  } else {
    console.warn('Biblioteca Cornerstone não carregada.');
  }
}

// Função para carregar imagem DICOM com Cornerstone
function loadDicomImage(imageId) {
  const filePath = imageId.replace('dicomFile:', '');
  
  return new Promise((resolve, reject) => {
    // Buscar arquivo DICOM
    fetch(filePath)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Erro ao carregar arquivo: ${response.status} ${response.statusText}`);
        }
        return response.arrayBuffer();
      })
      .then(buffer => {
        try {
          // Parsear o DICOM
          const byteArray = new Uint8Array(buffer);
          const dataSet = dicomParser.parseDicom(byteArray);
          
          // Extrair dados de pixel
          const pixelDataElement = dataSet.elements.x7fe00010;
          if (!pixelDataElement) {
            throw new Error('Dados de pixel não encontrados no arquivo DICOM');
          }
          
          const rows = dataSet.uint16('x00280010');
          const columns = dataSet.uint16('x00280011');
          const pixelData = new Uint16Array(dataSet.byteArray.buffer, pixelDataElement.dataOffset, pixelDataElement.length / 2);
          
          // Normalizar pixels (simples: usar min/max como janela)
          let min = Number.MAX_VALUE;
          let max = Number.MIN_VALUE;
          for (let i = 0; i < pixelData.length; i++) {
            min = Math.min(min, pixelData[i]);
            max = Math.max(max, pixelData[i]);
          }
          
          const windowWidth = max - min;
          const windowCenter = min + windowWidth / 2;
          
          // Criar objeto de imagem para cornerstone
          const image = {
            imageId: imageId,
            minPixelValue: min,
            maxPixelValue: max,
            slope: dataSet.floatString('x00281053', 1.0),
            intercept: dataSet.floatString('x00281052', 0.0),
            windowCenter: windowCenter,
            windowWidth: windowWidth,
            getPixelData: () => pixelData,
            rows: rows,
            columns: columns,
            height: rows,
            width: columns,
            color: false,
            sizeInBytes: pixelData.length * 2,
            columnPixelSpacing: dataSet.floatString('x00280030', 1.0),
            rowPixelSpacing: dataSet.floatString('x00280030', 1.0),
          };
          
          resolve(image);
        } catch (error) {
          console.error('Erro ao processar DICOM:', error);
          reject(error);
        }
      })
      .catch(error => {
        reject(error);
      });
  });
}

// Função para configurar a zona de drop de arquivos DICOM
function setupDicomDropzone() {
  const dropZone = document.getElementById('dicomDropZone');
  const fileInput = document.getElementById('dicomFile');
  
  if (dropZone && fileInput) {
    // Ao clicar na drop zone, simular clique no input de arquivo
    dropZone.addEventListener('click', () => {
      fileInput.click();
    });
    
    // Estilizar a drop zone quando um arquivo é arrastado sobre ela
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });
    
    // Remover estilo quando o arquivo é arrastado para fora
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-over');
    });
    
    // Processar o arquivo quando é solto na drop zone
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      
      if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        const filename = e.dataTransfer.files[0].name;
        dropZone.innerHTML = `<i class="fas fa-file-medical" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                             <p>${filename}</p>`;
        
        // Processar o arquivo automaticamente
        parseDicomFile();
      }
    });
    
    // Atualizar interface quando um arquivo é selecionado
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length) {
        const filename = fileInput.files[0].name;
        dropZone.innerHTML = `<i class="fas fa-file-medical" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                             <p>${filename}</p>`;
                             
        // Processar o arquivo automaticamente
        parseDicomFile();
      }
    });
  }
}

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

// Função para baixar DICOM da The Cancer Imaging Archive ou OsiriX
function downloadOnlineDicom(modalityType) {
  const statusElement = document.getElementById('onlineDicomStatus');
  const outputElement = document.getElementById('dicomOutput');
  
  if (!statusElement || !outputElement) return;
  
  // URLs para exemplos de DICOM acessíveis (usando pasta local para evitar problemas de CORS)
  const dicomLibraryBaseURL = 'dicom'; // Usar exemplos locais
  
  // Mapear as modalidades para arquivos específicos que temos no diretório dicom/
  const modalityFileMap = {
    'CT': 'image-00010.dcm',  // Supondo que este seja um CT
    'MR': 'image-00020.dcm',  // Supondo que este seja um MR
    'XR': 'image-00030.dcm',  // Supondo que este seja um XR
    'US': 'image-00040.dcm',  // Supondo que este seja um US
    'MG': 'image-00050.dcm'   // Supondo que este seja um MG
  };
  
  const filename = modalityFileMap[modalityType];
  if (!filename) {
    statusElement.innerHTML = `<div class="error">Tipo de modalidade não suportado: ${modalityType}</div>`;
    return;
  }
  
  const url = `${dicomLibraryBaseURL}/${filename}`;
  
  // Mostrar indicador de carregamento
  statusElement.innerHTML = `
    <div class="loading-indicator">
      <span class="spinner"></span>
      Carregando exemplo de DICOM ${modalityType}...
    </div>
  `;
  
  outputElement.textContent = `Carregando exemplo de DICOM ${modalityType}...`;
  
  // Buscar o arquivo DICOM
  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Erro ao carregar arquivo: ${response.status} ${response.statusText}`);
      }
      return response.arrayBuffer();
    })
    .then(buffer => {
      statusElement.innerHTML = `<div class="success">Arquivo DICOM ${modalityType} carregado com sucesso</div>`;
      processDicomBuffer(buffer, outputElement, `${modalityType}_example.dcm`);
    })
    .catch(error => {
      statusElement.innerHTML = `<div class="error">Erro: ${error.message}</div>`;
      outputElement.textContent = `Erro: ${error.message}`;
      outputElement.className = 'error';
      console.error('Erro ao baixar arquivo DICOM:', error);
    });
}

// Função para processar um arquivo DICOM
function parseDicomFile() {
  const fileInput = document.getElementById('dicomFile');
  const outputElement = document.getElementById('dicomOutput');
  
  // Verificar se há arquivos selecionados
  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    outputElement.textContent = 'Selecione um arquivo DICOM para processar.';
    outputElement.className = 'error';
    return;
  }
  
  const file = fileInput.files[0];
  const reader = new FileReader();
  
  reader.onload = function(e) {
    processDicomBuffer(e.target.result, outputElement, file.name);
  };
  
  reader.onerror = function() {
    outputElement.textContent = 'Erro ao ler o arquivo.';
    outputElement.className = 'error';
  };
  
  reader.readAsArrayBuffer(file);
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

    // Renderizar a imagem DICOM
    renderDicomImage(buffer, extractedData);
    
    return extractedData;
  } catch (error) {
    console.error("Erro ao processar DICOM:", error);
    outputElement.textContent = 'Erro ao analisar DICOM: ' + error.message;
    outputElement.className = 'error';
    return null;
  }
}

// Função para renderizar a imagem DICOM usando Cornerstone
function renderDicomImage(buffer, dicomData) {
  // Criar um objeto Blob a partir do buffer
  const blob = new Blob([buffer], {type: 'application/dicom'});
  
  // Criar uma URL para o blob
  const imageUrl = URL.createObjectURL(blob);
  
  // Verificar se a biblioteca Cornerstone está disponível
  if (typeof cornerstone === 'undefined') {
    updateDicomImageContainer(dicomData); // Fallback para visualização de placeholders
    return;
  }
  
  // Preparar o contêiner de visualização
  const imageContainer = document.getElementById('dicom-image-container');
  if (!imageContainer) return;
  
  // Limpar o contêiner e preparar para visualização com Cornerstone
  imageContainer.innerHTML = '<div id="dicomImage" class="dicom-canvas"></div>';
  const element = document.getElementById('dicomImage');
  
  // Habilitar o elemento com Cornerstone
  try {
    cornerstone.enable(element);
    
    // Carregar e exibir a imagem
    const imageId = `wadouri:${imageUrl}`;
    cornerstone.loadImage(imageId).then(image => {
      cornerstone.displayImage(element, image);
      
      // Ativar ferramentas como zoom e pan se disponíveis
      if (typeof cornerstoneTools !== 'undefined') {
        // Configurar ferramentas
        cornerstoneTools.addTool(cornerstoneTools.ZoomTool);
        cornerstoneTools.addTool(cornerstoneTools.PanTool);
        cornerstoneTools.addTool(cornerstoneTools.WwwcTool);
        cornerstoneTools.addTool(cornerstoneTools.LengthTool);
        
        cornerstoneTools.setToolActive('Zoom', { mouseButtonMask: 1 });
      }
      
      // Adicionar controles de manipulação de imagem
      const controlsDiv = document.createElement('div');
      controlsDiv.className = 'dicom-controls';
      controlsDiv.innerHTML = `
        <button class="dicom-btn" id="dicom-adjust" title="Ajustar brilho e contraste">
          <i class="fas fa-adjust"></i> Ajustar
        </button>
        <button class="dicom-btn" id="dicom-zoom" title="Ampliar imagem">
          <i class="fas fa-search-plus"></i> Zoom
        </button>
        <button class="dicom-btn" id="dicom-measure" title="Medir distância">
          <i class="fas fa-ruler"></i> Medir
        </button>
      `;
      
      imageContainer.appendChild(controlsDiv);
      
      // Adicionar event listeners para os botões
      document.getElementById('dicom-adjust').addEventListener('click', () => {
        cornerstoneTools.setToolActive('Wwwc', { mouseButtonMask: 1 });
      });
      
      document.getElementById('dicom-zoom').addEventListener('click', () => {
        cornerstoneTools.setToolActive('Zoom', { mouseButtonMask: 1 });
      });
      
      document.getElementById('dicom-measure').addEventListener('click', () => {
        cornerstoneTools.setToolActive('Length', { mouseButtonMask: 1 });
      });
      
    }).catch(error => {
      console.error('Erro ao carregar imagem:', error);
      updateDicomImageContainer(dicomData); // Fallback para visualização de placeholders
    });
  } catch (error) {
    console.error('Erro ao habilitar Cornerstone:', error);
    updateDicomImageContainer(dicomData); // Fallback para visualização de placeholders
  }
}

// Função para atualizar o contêiner de imagem DICOM (fallback sem Cornerstone)
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
          Visualização de pixel não disponível - verifique a biblioteca Cornerstone
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