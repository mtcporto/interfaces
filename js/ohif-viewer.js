// OHIF Viewer Integration
// Este arquivo implementa a integração com o OHIF Viewer para visualização de imagens DICOM
// Requer que as dependências sejam carregadas no HTML

// Configuração do OHIF viewer
let ohifViewer = null;

function initOHIFViewer() {
  console.log('Inicializando OHIF Viewer...');
  
  // Verificar se as dependências estão carregadas
  if (!window.cornerstone) {
    console.error('Dependência do OHIF Viewer não encontrada: cornerstone');
    return;
  }
  if (!window.cornerstoneWADOImageLoader) {
    console.error('Dependência do OHIF Viewer não encontrada: cornerstoneWADOImageLoader');
    return;
  }
  if (!window.cornerstoneTools) {
    console.error('Dependência do OHIF Viewer não encontrada: cornerstoneTools');
    return;
  }
  
  try {
    // Adicionar controles DICOM à interface
    addDicomControls();
    
    // Inicializar cornerstone (parte do ecossistema OHIF)
    cornerstone.enable(document.getElementById('dicom-image-container'));
    
    // Configurar o cornerstoneWADOImageLoader
    cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
    cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
    
    // Inicializar as ferramentas
    cornerstoneTools.init({
      showSVGCursors: true,
    });
    
    // Configurar listeners para os botões de controle
    setupDicomControlListeners();
    
    // Adicionar objetos ao window para debug
    window.cornerstone = cornerstone;
    window.cornerstoneTools = cornerstoneTools;

    console.log('OHIF Viewer inicializado com sucesso');
  } catch (error) {
    console.error('Erro ao inicializar OHIF Viewer:', error);
  }
}

// Função para carregar e exibir uma imagem DICOM usando o OHIF
function showDicomWithOHIF(buffer, filename) {
  console.log(`Carregando imagem DICOM: ${filename}`);
  
  // Obter o elemento alvo para renderização
  const element = document.getElementById('dicom-image-container');
  if (!element) {
    console.error('Elemento do contêiner DICOM não encontrado');
    return;
  }
  
  try {
    // Verificar novamente se as dependências do Cornerstone estão disponíveis
    if (!window.cornerstone || !window.cornerstoneWADOImageLoader) {
      throw new Error('Dependências do Cornerstone não disponíveis para renderização');
    }
    
    // Salvar os controles DICOM se existirem
    const dicomControls = element.querySelector('.dicom-controls');
    
    // Limpar o elemento
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
    
    // Recolocar os controles DICOM se existirem
    if (dicomControls) {
      element.appendChild(dicomControls);
    }
    
    // Se os controles não existirem, adicioná-los
    if (!element.querySelector('.dicom-controls')) {
      addDicomControls();
    }
    
    // Ativar o elemento para a renderização pelo cornerstone
    cornerstone.enable(element);
    
    try {
      // Converter o buffer para um Blob
      const blob = new Blob([buffer], { type: 'application/dicom' });
      
      // Criar uma URL para o blob
      const imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(blob);
      
      // Carregar a imagem
      cornerstone.loadAndCacheImage(imageId)
        .then(image => {
          // Exibir a imagem
          cornerstone.displayImage(element, image);
          
          // Mostrar mensagem de sucesso
          console.log('Imagem DICOM carregada com sucesso');
          
          // Adicionar ferramentas básicas como zoom, pan etc.
          addToolsToDicomImage(element);
          
          // Atualizar os controles da imagem
          updateDicomControls(true);
        })
        .catch(error => {
          console.error('Erro ao carregar a imagem DICOM:', error);
          showDicomImageError(element, 'Erro ao carregar a imagem');
          updateDicomControls(false);
        });
        
    } catch (error) {
      console.error('Erro ao processar arquivo DICOM:', error);
      showDicomImageError(element, 'Formato de arquivo não suportado');
      updateDicomControls(false);
    }
  } catch (error) {
    console.error('Erro ao configurar o visualizador DICOM:', error);
    showDicomImageError(element, 'Erro ao configurar o visualizador');
  }
}

// Função para adicionar ferramentas interativas à imagem DICOM
function addToolsToDicomImage(element) {
  try {
    // Adicionar as ferramentas padrão do cornerstone
    cornerstoneTools.addToolForElement(element, cornerstoneTools.WwwcTool);
    cornerstoneTools.addToolForElement(element, cornerstoneTools.ZoomTool);
    cornerstoneTools.addToolForElement(element, cornerstoneTools.PanTool);
    cornerstoneTools.addToolForElement(element, cornerstoneTools.LengthTool);
    
    // Ativar a ferramenta de ajuste de janela como padrão
    cornerstoneTools.setToolActiveForElement(element, 'Wwwc', { mouseButtonMask: 1 });
  } catch (error) {
    console.error('Erro ao adicionar ferramentas DICOM:', error);
  }
}

// Função para exibir erro na área da imagem
function showDicomImageError(element, message) {
  element.innerHTML = `
    <div style="color: #e74c3c; padding: 2rem; text-align: center;">
      <i class="fas fa-exclamation-circle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
      <p>${message}</p>
    </div>
  `;
}

// Função para adicionar controles DICOM ao contêiner da imagem
function addDicomControls() {
  const container = document.getElementById('dicom-image-container');
  // Verificar se o contêiner existe e se os controles já existem
  if (!container || container.querySelector('.dicom-controls')) {
    return;
  }
  
  // Criar a div de controles
  const controls = document.createElement('div');
  controls.className = 'dicom-controls';
  
  // Adicionar botões de controle
  controls.innerHTML = `
    <button class="dicom-btn" title="Ajustar Janela (Brilho/Contraste)">
      <i class="fas fa-adjust"></i>
    </button>
    <button class="dicom-btn" title="Zoom">
      <i class="fas fa-search-plus"></i>
    </button>
    <button class="dicom-btn" title="Medir">
      <i class="fas fa-ruler"></i>
    </button>
    <button class="dicom-btn" title="Mover">
      <i class="fas fa-arrows-alt"></i>
    </button>
    <button class="dicom-btn" title="Resetar">
      <i class="fas fa-undo"></i>
    </button>
  `;
  
  // Adicionar ao contêiner
  container.appendChild(controls);
  
  // Desabilitar botões inicialmente
  updateDicomControls(false);
}

// Função para atualizar os controles da imagem baseados no status
function updateDicomControls(enabled) {
  const buttons = document.querySelectorAll('.dicom-controls .dicom-btn');
  
  buttons.forEach(button => {
    button.disabled = !enabled;
    if (enabled) {
      button.classList.remove('disabled');
    } else {
      button.classList.add('disabled');
    }
  });
}

// Adicionar listeners aos botões de controle DICOM
function setupDicomControlListeners() {
  try {
    const container = document.getElementById('dicom-image-container');
    if (!container) return;
    
    // Botão de ajuste (brilho/contraste)
    const btnAjuste = document.querySelector('.dicom-controls .dicom-btn[title*="Ajustar"]');
    if (btnAjuste) {
      btnAjuste.addEventListener('click', () => {
        try {
          cornerstoneTools.setToolActiveForElement(container, 'Wwwc', { mouseButtonMask: 1 });
          highlightActiveButton(btnAjuste);
        } catch (error) {
          console.error('Erro ao ativar ferramenta de ajuste:', error);
        }
      });
    }
    
    // Botão de zoom
    const btnZoom = document.querySelector('.dicom-controls .dicom-btn[title*="Zoom"]');
    if (btnZoom) {
      btnZoom.addEventListener('click', () => {
        try {
          cornerstoneTools.setToolActiveForElement(container, 'Zoom', { mouseButtonMask: 1 });
          highlightActiveButton(btnZoom);
        } catch (error) {
          console.error('Erro ao ativar ferramenta de zoom:', error);
        }
      });
    }
    
    // Botão de medição
    const btnMedir = document.querySelector('.dicom-controls .dicom-btn[title*="Medir"]');
    if (btnMedir) {
      btnMedir.addEventListener('click', () => {
        try {
          cornerstoneTools.setToolActiveForElement(container, 'Length', { mouseButtonMask: 1 });
          highlightActiveButton(btnMedir);
        } catch (error) {
          console.error('Erro ao ativar ferramenta de medição:', error);
        }
      });
    }
    
    // Botão de movimentação (pan)
    const btnMover = document.querySelector('.dicom-controls .dicom-btn[title*="Mover"]');
    if (btnMover) {
      btnMover.addEventListener('click', () => {
        try {
          // Verificamos se o tool 'Pan' está registrado
          if (!cornerstoneTools.getToolForElement(container, 'Pan')) {
            // Se não estiver registrado, adicionamos a ferramenta primeiro
            cornerstoneTools.addToolForElement(container, cornerstoneTools.PanTool);
          }
          
          // Agora configuramos a ferramenta como ativa
          cornerstoneTools.setToolActiveForElement(container, 'Pan', { mouseButtonMask: 1 });
          highlightActiveButton(btnMover);
        } catch (error) {
          console.error('Erro ao ativar ferramenta de movimentação:', error);
        }
      });
    }
    
    // Botão de reset
    const btnReset = document.querySelector('.dicom-controls .dicom-btn[title*="Resetar"]');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        try {
          // Obtém o elemento cornerstone atual
          const element = document.getElementById('dicom-image-container');
          if (element) {
            // Reset zoom, pan, e windowing para valores padrão
            cornerstone.reset(element);
            
            // Retornar para a ferramenta de windowing como padrão
            setTimeout(() => {
              cornerstoneTools.setToolActiveForElement(element, 'Wwwc', { mouseButtonMask: 1 });
              highlightActiveButton(document.querySelector('.dicom-controls .dicom-btn[title*="Ajustar"]'));
            }, 100);
          }
        } catch (error) {
          console.error('Erro ao resetar a visualização DICOM:', error);
        }
      });
    }
  } catch (error) {
    console.error('Erro ao configurar os listeners dos controles DICOM:', error);
  }
}

// Função para destacar o botão ativo
function highlightActiveButton(activeButton) {
  const buttons = document.querySelectorAll('.dicom-controls .dicom-btn');
  buttons.forEach(button => {
    button.classList.remove('active');
  });
  if (activeButton) {
    activeButton.classList.add('active');
  }
}

// Exportando funções para uso global
window.initOHIFViewer = initOHIFViewer;
window.showDicomWithOHIF = showDicomWithOHIF;
window.setupDicomControlListeners = setupDicomControlListeners;
window.updateDicomControls = updateDicomControls;
window.addDicomControls = addDicomControls;

// Função para sobrescrever a função existente showDicomImage
// Esta serve como ponte entre o código existente e o novo visualizador OHIF
window.showDicomImage = function(buffer, filename) {
  showDicomWithOHIF(buffer, filename);
};
