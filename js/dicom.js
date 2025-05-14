/**
 * MVP de Interfaceamento Laboratorial - Funcionalidades DICOM
 */

// Variável para a aplicação DWV
let dwvApp;

// OHIF Viewer Integration (migrated from ohif-viewer.js)
// Polyfill pointer events support
if (window.cornerstone) {
  cornerstone.events = cornerstone.events || {};
  cornerstone.events.touch = cornerstone.events.touch || {};
  cornerstone.events.touch.SUPPORT_POINTER_EVENTS = ('onpointerdown' in window);
  cornerstone.touchEventListeners = cornerstone.touchEventListeners || {};
  cornerstone.touchEventListeners.SUPPORT_POINTER_EVENTS = ('onpointerdown' in window);
}

function initOHIFViewer() {
  try {
    // Initialize cornerstone and tools
    cornerstone.enable(document.getElementById('dicom-image-container'));
    cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
    cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
    cornerstoneTools.init({ showSVGCursors: true });
    setupDicomControlListeners();
  } catch (e) {
    console.warn('OHIF init skipped:', e);
  }
}

function showDicomWithOHIF(buffer, filename) {
  const element = document.getElementById('dicom-image-container');
  if (!element) return;
  // clear container
  while (element.firstChild) element.removeChild(element.firstChild);
  addDicomControls();
  try {
    cornerstone.enable(element);
    cornerstone.resize(element);
  } catch {}
  const blob = new Blob([buffer], { type: 'application/dicom' });
  const imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(blob);
  cornerstone.loadAndCacheImage(imageId).then(image => {
    cornerstone.displayImage(element, image);
    addToolsToDicomImage(element);
    updateDicomControls(true);
  }).catch(() => updateDicomControls(false));
}

window.showDicomImage = showDicomWithOHIF;
document.addEventListener('DOMContentLoaded', initOHIFViewer);

// OHIF control listeners and helpers
function setupDicomControlListeners() {
  window.addEventListener('resize', () => {
    const el = document.getElementById('dicom-image-container');
    if (el && cornerstone.getEnabledElement(el)) {
      cornerstone.resize(el);
    }
  });
}

function addDicomControls() {
  const container = document.getElementById('dicom-image-container');
  if (!container) return;
  addViewerControls(container);
  addImageControls(container);
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

// Inicialização dos componentes DICOM
document.addEventListener('DOMContentLoaded', function() {
  // Setup DICOM dropzone
  setupDicomDropzone();
  
  // Lista os arquivos DICOM locais disponíveis
  loadLocalDicomFiles();
  
  // Removendo inicialização do DWV (usando OHIF Viewer apenas)
  // initializeDWV();
  
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

// Configurar presets de janelamento
function setupWindowLevelPresets() {
  // Presets para diferentes modalidades
  window.dicomWindowingPresets = {
    'CT': [
      { name: 'Tecido Mole', wl: 40, ww: 400 },
      { name: 'Pulmão', wl: -600, ww: 1500 },
      { name: 'Osso', wl: 500, ww: 2000 },
      { name: 'Cérebro', wl: 40, ww: 80 }
    ],
    'MR': [
      { name: 'T1', wl: 550, ww: 950 },
      { name: 'T2', wl: 750, ww: 800 }
    ],
    'XR': [
      { name: 'Padrão', wl: 128, ww: 256 },
      { name: 'Alto Contraste', wl: 128, ww: 128 }
    ],
    'DEFAULT': [
      { name: 'Alto Contraste', wl: 127.5, ww: 255 },
      { name: 'Baixo Contraste', wl: 127.5, ww: 700 }
    ]
  };
  console.log('Presets de janelamento configurados');
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

    // Renderizar a imagem DICOM usando OHIF Viewer
    if (typeof showDicomImage === 'function') {
      showDicomImage(buffer, filename);
    } else {
      console.warn('OHIF Viewer não disponível, tentando DWV');
      renderDicomViewer(buffer, extractedData);
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

// Função para aplicar janelamento padrão de acordo com a modalidade
function applyDefaultWindowLevel() {
  console.log('Aplicando janelamento padrão');
  
  try {
    // Verificar se a imagem foi carregada
    if (!dwvApp.isLoaded()) {
      console.warn('DWV não carregou nenhuma imagem ainda');
      return;
    }
    
    // Obter a imagem do DWV
    const image = dwvApp.getImage();
    if (!image) {
      console.warn('Imagem DICOM não disponível');
      return;
    }
    
    // Obter a modalidade da imagem
    const modality = image.getMeta().Modality || 'DEFAULT';
    console.log(`Detectada modalidade: ${modality}`);
    
    // Definir valores de janelamento de acordo com a modalidade
    let windowCenter, windowWidth;
    
    switch(modality) {
      case 'CT':
        // Valores padrão para CT - Tecido Mole
        windowCenter = 40;
        windowWidth = 350;
        break;
      case 'MR':
        // Valores padrão para MR
        windowCenter = 600;
        windowWidth = 1200;
        break;
      case 'XR':
      case 'CR':
        // Valores padrão para radiografia
        windowCenter = 2048;
        windowWidth = 4096;
        break;
      default:
        // Tentar obter valores do DICOM
        windowCenter = image.getMeta().WindowCenter;
        windowWidth = image.getMeta().WindowWidth;
        
        // Tratar arrays de valores (alguns DICOM têm múltiplos valores)
        if (Array.isArray(windowCenter)) windowCenter = windowCenter[0];
        if (Array.isArray(windowWidth)) windowWidth = windowWidth[0];
        
        // Se não houver valores específicos ou forem inválidos, calcular
        if (!windowCenter || !windowWidth || windowWidth <= 0) {
          // Calcular com base no alcance de valores na imagem
          const range = image.getRescaledDataRange();
          if (range) {
            windowWidth = (range.max - range.min) * 0.9;  // 90% do intervalo
            windowCenter = range.min + (range.max - range.min) / 2;
          } else {
            // Valores de fallback genéricos se tudo falhar
            windowWidth = 255;
            windowCenter = 127;
          }
        }
    }
    
    // Aplicar o janelamento à imagem
    dwvApp.setWindowLevel(windowCenter, windowWidth);
    console.log(`Janelamento aplicado: Centro=${windowCenter}, Largura=${windowWidth}`);
      // Atualizar a visualização (sem adicionar controles, isso será feito em outra função)
    dwvApp.render();
    
    // Forçar a atualização da visualização
    dwvApp.render();
    
  } catch (error) {
    console.error('Erro ao aplicar janelamento padrão:', error);
  }
}

// Função para adicionar controles de visualização ao contêiner
function addViewerControls(container) {
  console.log('Adicionando controles de visualização');
  
  // Verificar se já existem controles
  if (container.querySelector('.dicom-controls')) {
    console.log('Controles já existem');
    return;
  }
  
  // Criar contêiner para os controles
  const controlsDiv = document.createElement('div');
  controlsDiv.className = 'dicom-controls';
  controlsDiv.style.cssText = 'position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.6); padding: 10px; border-radius: 5px;';
  
  // Botão de auto-contraste
  const autoButton = document.createElement('button');
  autoButton.textContent = 'Auto Contraste';
  autoButton.style.cssText = 'margin: 5px; padding: 5px 10px; cursor: pointer; background: #2196F3; color: white; border: none; border-radius: 3px;';
  autoButton.onclick = applyDefaultWindowLevel;
  
  // Adicionar presets comuns
  const presets = [
    { name: 'Tecido Mole', center: 40, width: 350 },
    { name: 'Pulmão', center: -500, width: 1500 },
    { name: 'Osso', center: 480, width: 2500 },
    { name: 'Cérebro', center: 40, width: 80 }
  ];
  
  // Criar seletor de presets
  const presetSelect = document.createElement('select');
  presetSelect.style.cssText = 'margin: 5px; padding: 5px; cursor: pointer;';
  
  // Opção padrão
  const defaultOption = document.createElement('option');
  defaultOption.textContent = 'Selecione preset';
  defaultOption.disabled = true;
  defaultOption.selected = true;
  presetSelect.appendChild(defaultOption);
  
  // Adicionar opções de preset
  presets.forEach(preset => {
    const option = document.createElement('option');
    option.value = JSON.stringify({center: preset.center, width: preset.width});
    option.textContent = preset.name;
    presetSelect.appendChild(option);
  });
  
  // Evento de mudança do preset
  presetSelect.onchange = function() {
    try {
      const preset = JSON.parse(this.value);
      dwvApp.setWindowLevel(preset.center, preset.width);
      console.log(`Preset aplicado: ${this.options[this.selectedIndex].textContent}`);
    } catch (e) {
      console.error('Erro ao aplicar preset:', e);
    }
    this.selectedIndex = 0; // Reset para opção padrão
  };
  
  // Adicionar controles ao contêiner
  controlsDiv.appendChild(autoButton);
  controlsDiv.appendChild(presetSelect);
  container.appendChild(controlsDiv);
  
  console.log('Controles de visualização adicionados');
}

// Função para adicionar controles de imagem mais completos ao contêiner
function addImageControls(container) {
  // Verificar se já existem controles
  if (container.querySelector('.dicom-image-controls')) {
    return;
  }
  
  // Criar painel flutuante para controles
  const controlsPanel = document.createElement('div');
  controlsPanel.className = 'dicom-image-controls';
  controlsPanel.style.cssText = `
    position: absolute; 
    top: 10px; 
    right: 10px; 
    background-color: rgba(0,0,0,0.7);
    border-radius: 5px;
    padding: 10px;
    z-index: 1000;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
  `;
  
  // Título do painel
  const titleDiv = document.createElement('div');
  titleDiv.textContent = 'Ajustes de Imagem';
  titleDiv.style.cssText = `
    color: white;
    font-weight: bold;
    margin-bottom: 8px;
    text-align: center;
    font-size: 14px;
  `;
  controlsPanel.appendChild(titleDiv);
  
  // Botões de ferramentas
  const toolsDiv = document.createElement('div');
  toolsDiv.style.cssText = `
    display: flex;
    justify-content: center;
    margin-bottom: 10px;
  `;
  
  // Função para criar botão de ferramenta
  const createToolButton = (icon, tooltip, tool) => {
    const btn = document.createElement('button');
    btn.innerHTML = `<i class="fas fa-${icon}"></i>`;
    btn.title = tooltip;
    btn.style.cssText = `
      background-color: #333;
      color: white;
      border: none;
      border-radius: 3px;
      margin: 0 2px;
      padding: 5px 8px;
      cursor: pointer;
    `;
    btn.addEventListener('mouseover', () => { btn.style.backgroundColor = '#555'; });
    btn.addEventListener('mouseout', () => { btn.style.backgroundColor = '#333'; });
    btn.addEventListener('click', () => { 
      dwvApp.setTool(tool);
      // Destacar botão ativo
      toolsDiv.querySelectorAll('button').forEach(b => b.style.backgroundColor = '#333');
      btn.style.backgroundColor = '#2196F3';
    });
    return btn;
  };
  
  // Adicionar botões de ferramentas
  toolsDiv.appendChild(createToolButton('adjust', 'Ajustar Contraste/Brilho', 'WindowLevel'));
  toolsDiv.appendChild(createToolButton('search-plus', 'Zoom e Navegação', 'ZoomAndPan'));
  toolsDiv.appendChild(createToolButton('arrows-alt', 'Rolar (séries)', 'Scroll'));
  
  // Botão de reset
  const resetBtn = document.createElement('button');
  resetBtn.innerHTML = '<i class="fas fa-undo"></i>';
  resetBtn.title = 'Resetar Visualização';
  resetBtn.style.cssText = `
    background-color: #333;
    color: white;
    border: none;
    border-radius: 3px;
    margin: 0 2px;
    padding: 5px 8px;
    cursor: pointer;
  `;
  resetBtn.addEventListener('mouseover', () => { resetBtn.style.backgroundColor = '#555'; });
  resetBtn.addEventListener('mouseout', () => { resetBtn.style.backgroundColor = '#333'; });
  resetBtn.addEventListener('click', () => { dwvApp.resetDisplay(); });
  toolsDiv.appendChild(resetBtn);
  
  controlsPanel.appendChild(toolsDiv);
  
  // Botão de Auto Contraste
  const autoContrastBtn = document.createElement('button');
  autoContrastBtn.textContent = '🔄 Auto Contraste';
  autoContrastBtn.style.cssText = `
    background-color: #10b981;
    color: white;
    border: none;
    border-radius: 3px;
    padding: 6px;
    margin: 5px 0;
    width: 100%;
    cursor: pointer;
    font-size: 13px;
  `;
  autoContrastBtn.addEventListener('click', () => {
    try {
      const image = dwvApp.getImage();
      if (image) {
        const range = image.getRescaledDataRange();
        // Usar 95% do intervalo para evitar outliers
        const min = range.min + (range.max - range.min) * 0.025;
        const max = range.max - (range.max - range.min) * 0.025;
        const ww = max - min;
        const wc = min + ww/2;
        dwvApp.setWindowLevel(wc, ww);
        console.log(`Auto contraste aplicado: Centro=${wc.toFixed(0)}, Largura=${ww.toFixed(0)}`);
      }
    } catch (e) {
      console.error('Erro ao aplicar auto contraste:', e);
    }
  });
  controlsPanel.appendChild(autoContrastBtn);
  
  // Presets de contraste específicos por modalidade
  const image = dwvApp.getImage();
  if (image) {
    const modality = image.getMeta().Modality || 'DEFAULT';
    
    let presets = [];
    // Definir presets de acordo com a modalidade
    switch(modality) {
      case 'CT':
        presets = [
          { name: 'Tecido Mole', wc: 40, ww: 400 },
          { name: 'Pulmão', wc: -600, ww: 1500 },
          { name: 'Osso', wc: 500, ww: 2000 },
          { name: 'Cérebro', wc: 40, ww: 80 }
        ];
        break;
      case 'MR':
        presets = [
          { name: 'T1', wc: 550, ww: 950 },
          { name: 'T2', wc: 750, ww: 800 }
        ];
        break;
      case 'XR':
      case 'CR':
        presets = [
          { name: 'Padrão', wc: 2048, ww: 4096 },
          { name: 'Alto Contraste', wc: 2048, ww: 2048 }
        ];
        break;
      default:
        presets = [
          { name: 'Padrão', wc: 127, ww: 255 },
          { name: 'Alto Contraste', wc: 127, ww: 127 }
        ];
    }
    
    // Criar contêiner para presets
    const presetsDiv = document.createElement('div');
    presetsDiv.style.marginTop = '8px';
    
    // Título dos presets
    const presetsTitle = document.createElement('div');
    presetsTitle.textContent = 'Presets para ' + modality;
    presetsTitle.style.cssText = `
      color: white;
      font-size: 12px;
      margin-bottom: 5px;
      text-align: center;
    `;
    presetsDiv.appendChild(presetsTitle);
    
    // Grid de botões para os presets
    const presetsGrid = document.createElement('div');
    presetsGrid.style.cssText = `
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 5px;
    `;
    
    // Criar botões para cada preset
    presets.forEach(preset => {
      const presetBtn = document.createElement('button');
      presetBtn.textContent = preset.name;
      presetBtn.style.cssText = `
        background-color: #4b5563;
        color: white;
        border: none;
        border-radius: 3px;
        padding: 4px;
        font-size: 12px;
        cursor: pointer;
      `;
      presetBtn.addEventListener('click', () => {
        dwvApp.setWindowLevel(preset.wc, preset.ww);
        console.log(`Preset ${preset.name} aplicado: Centro=${preset.wc}, Largura=${preset.ww}`);
      });
      presetsGrid.appendChild(presetBtn);
    });
    
    presetsDiv.appendChild(presetsGrid);
    controlsPanel.appendChild(presetsDiv);
  }
  
  // Adicionar o painel de controle ao contêiner
  container.appendChild(controlsPanel);
}