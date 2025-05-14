/**
 * MVP de Interfaceamento Laboratorial - Funcionalidades DICOM
 */

// OHIF Viewer Integration (migrated from ohif-viewer.js)

function initOHIFViewer() {
  const element = document.getElementById('dicom-image-container');
  if (!element) return;
  // Configure externals for WADO loader and tools
  cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
  cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
  cornerstoneTools.external.cornerstone = cornerstone;
  if (typeof window.Hammer !== 'undefined') {
    cornerstoneTools.external.Hammer = window.Hammer;
  } else {
    console.warn('Hammer não encontrado em window');
  }
  // Initialize cornerstone WADO image loader web worker
  if (cornerstoneWADOImageLoader.webWorkerManager && typeof cornerstoneWADOImageLoader.webWorkerManager.initialize === 'function') {
    cornerstoneWADOImageLoader.webWorkerManager.initialize({
      webWorkerPath: 'https://unpkg.com/cornerstone-wado-image-loader@4.13.2/dist/cornerstoneWADOImageLoaderWebWorker.min.js',
      taskConfiguration: { decodeTask: { name: 'decodeTask' } }
    });
  }
  // Enable Cornerstone on the container
  try {
    cornerstone.enable(element);
  } catch (e) {
    console.warn('Cornerstone enable failed:', e);
    return;
  }
  // Initialize tools
  cornerstoneTools.init({ showSVGCursors: true });
  setupDicomControlListeners();
}

function showDicomWithOHIF(buffer, filename) {
  const element = document.getElementById('dicom-image-container');
  if (!element) return;
  // clear container
  while (element.firstChild) element.removeChild(element.firstChild);
  try {
    cornerstone.enable(element);
    cornerstone.resize(element);
    const blob = new Blob([buffer], { type: 'application/dicom' });
    const imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(blob);
    cornerstone.loadAndCacheImage(imageId).then(image => {
      cornerstone.displayImage(element, image);
      addToolsToDicomImage(element);
      updateDicomControls(true);
    }).catch(() => updateDicomControls(false));
  } catch (e) {
    console.warn('OHIF display skipped:', e);
  }
}

window.showDicomImage = showDicomWithOHIF;

// OHIF control listeners and helpers
function setupDicomControlListeners() {
  window.addEventListener('resize', () => {
    const el = document.getElementById('dicom-image-container');
    if (el && cornerstone.getEnabledElement(el)) {
      cornerstone.resize(el);
    }
  });
}

function addToolsToDicomImage(element) {
  // Register and activate basic tools
  cornerstoneTools.addTool(cornerstoneTools.WwwcTool);
  cornerstoneTools.addTool(cornerstoneTools.PanTool);
  cornerstoneTools.addTool(cornerstoneTools.ZoomTool);
  cornerstoneTools.addTool(cornerstoneTools.StackScrollTool);
  cornerstoneTools.setToolActive('Wwwc', { mouseButtonMask: 1 });
  cornerstoneTools.setToolActive('Pan', { mouseButtonMask: 2 });
  cornerstoneTools.setToolActive('Zoom', { mouseButtonMask: 4 });
  cornerstoneTools.setToolActive('StackScroll', { mouseButtonMask: 1 });
}

function updateDicomControls(isLoaded) {
  const container = document.getElementById('dicom-image-container');
  if (container) {
    container.classList.toggle('loaded', isLoaded);
  }
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

// Função para baixar DICOM da biblioteca local
function downloadOnlineDicom(modalityType) {
  const statusElement = document.getElementById('onlineDicomStatus');
  const outputElement = document.getElementById('dicomOutput');
  
  if (!statusElement || !outputElement) return;
  
  // Usar a pasta dicom local que já temos no projeto
  const dicomLibraryBaseURL = 'dicom';
  
  // Mapear as modalidades para arquivos específicos que temos no diretório dicom/
  const modalityFileMap = {
    'CT': 'image-00010.dcm', 
    'MR': 'image-00020.dcm', 
    'XR': 'image-00030.dcm', 
    'US': 'image-00040.dcm', 
    'MG': 'image-00050.dcm'  
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
  
  // Verificar se o arquivo existe antes de tentar carregar
  fetch(url, { method: 'HEAD' })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Arquivo não encontrado: ${response.status} ${response.statusText}`);
      }
      return fetch(url);
    })
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
  let extractedData = {};
  try {
    if (typeof dicomParser === 'undefined') {
      outputElement.textContent = 'Biblioteca dicomParser não carregada. Verifique o console.';
      outputElement.className = 'error';
      return;
    }
    
    const byteArray = new Uint8Array(buffer);
    const dataSet = dicomParser.parseDicom(byteArray);
    
    extractedData = {
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

    // Renderizar a imagem DICOM usando OHIF Viewer
    if (typeof showDicomImage === 'function') {
      showDicomImage(buffer, filename);
    } else {
      console.warn('OHIF Viewer não disponível');
      updateDicomImageContainer(extractedData);
    }
    return extractedData;
  } catch (error) {
    console.error("Erro ao processar DICOM:", error);
    outputElement.textContent = 'Erro ao analisar DICOM: ' + error.message;
    outputElement.className = 'error';
    
    // Mostrar mensagem de erro onde deveria estar a imagem
    updateDicomImageContainer({
      error: error.message,
      ...extractedData
    });
    
    return null;
  }
}

// Função para atualizar o contêiner de imagem DICOM (fallback sem DWV)
function updateDicomImageContainer(dicomData) {
  const imageContainer = document.getElementById('dicom-image-container');
  if (!imageContainer) return;
  
  // Mostrar os metadados básicos quando a visualização falhar
  imageContainer.innerHTML = `
    <div class="dicom-canvas-container">
      <div style="background-color: #0a0a0a; color: #ffffff; padding: 1rem; text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: center;">
        <div style="font-size: 1.2rem; margin-bottom: 1rem;">
          ${dicomData.modality || 'N/A'} - ${dicomData.rows || '?'}×${dicomData.columns || '?'}
        </div>
        <div style="font-size: 0.9rem; color: #aaa;">
          ${dicomData.fileName || 'arquivo.dcm'}
        </div>
        <div style="margin-top: 2rem;">
          <i class="fas fa-x-ray" style="font-size: 5rem; color: #4b5563;"></i>
        </div>
        <div style="margin-top: 1rem; font-size: 0.85rem; color: #aaa;">
          ${dicomData.error ? `Erro: ${dicomData.error}` : 'Metadados DICOM disponíveis, visualização de imagem indisponível'}
        </div>
      </div>
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