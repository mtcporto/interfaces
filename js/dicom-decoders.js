/**
 * Script auxiliar para configurar decodificadores JPEG 2000 para DWV
 */

// Este script deve ser carregado antes do dwv.min.js

// Definir o objeto global para decodificadores
window.dwvDecoderConfig = {
  initialized: false
};

// Função para verificar se o PDF.js está disponível e configurar decodificadores
function setupDecoders() {
  // Se o PDF.js já estiver disponível, configure o decodificador JPEG 2000
  if (typeof JpxDecoder !== 'undefined' && dwv && !window.dwvDecoderConfig.initialized) {
    console.log('Configurando decodificador JPEG 2000 usando PDF.js');
    
    // Disponibilizar o decodificador para DWV
    dwv.image.decoderScripts = {
      'jpeg2000': 'https://cdn.jsdelivr.net/npm/dwv@0.31.0/decoders/pdfjs/jpx.js'
    };
    
    window.dwvDecoderConfig.initialized = true;
  }
}

// Configurar quando o documento estiver carregado
document.addEventListener('DOMContentLoaded', function() {
  console.log('Inicializando decodificadores DICOM...');
  setupDecoders();
  
  // Verifica a cada 100ms se o DWV foi carregado
  const checkInterval = setInterval(function() {
    if (typeof dwv !== 'undefined') {
      setupDecoders();
      clearInterval(checkInterval);
    }
  }, 100);
});

/**
 * Configuração e inicialização dos decodificadores DICOM
 */

// Configuração global para os decodificadores JPEG 2000
document.addEventListener('DOMContentLoaded', function() {
  console.log('Inicializando decodificadores DICOM...');
  
  // Verificar se os decodificadores já foram carregados
  if (typeof JpxImage === 'undefined') {
    console.warn('Decodificador JPEG 2000 (JpxImage) não está disponível');
    
    // Tentativa de carregar manualmente se estiver faltando
    loadScript('https://cdn.jsdelivr.net/npm/dwv@0.31.0/decoders/pdfjs/arithmetic_decoder.js')
      .then(() => loadScript('https://cdn.jsdelivr.net/npm/dwv@0.31.0/decoders/pdfjs/util.js'))
      .then(() => loadScript('https://cdn.jsdelivr.net/npm/dwv@0.31.0/decoders/pdfjs/jpx.js'))
      .then(() => {
        console.log('Decodificadores JPEG 2000 carregados com sucesso');
        
        // Configurar modos de janelamento predefinidos
        setupDicomPresets();
      })
      .catch(error => {
        console.error('Erro ao carregar decodificadores JPEG 2000:', error);
      });
  } else {
    console.log('Decodificador JPEG 2000 já está carregado');
    
    // Configurar modos de janelamento predefinidos
    setupDicomPresets();
  }
});

// Função auxiliar para carregar scripts
function loadScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Configurar presets de janelamento para diferentes modalidades
function setupDicomPresets() {
  // Verificar se o DWV está disponível
  if (typeof dwv === 'undefined') {
    console.warn('DWV não está disponível para configurar presets');
    return;
  }
  
  // Esta função adicionará presets de visualização específicos por modalidade
  // que serão utilizados quando a imagem for carregada
  
  // Estes valores são baseados em padrões radiológicos comuns
  const windowingPresets = {
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

  // Registrar os presets globalmente para uso na inicialização do DWV
  window.dicomWindowingPresets = windowingPresets;
}

// Função auxiliar para aplicar janelamento específico
function applyDicomWindowPreset(modalityType, presetName) {
  // Verificar se o DWV está disponível
  if (typeof dwvApp === 'undefined') {
    console.warn('Aplicação DWV não está inicializada');
    return false;
  }
  
  const windowingPresets = window.dicomWindowingPresets || {};
  const presetList = windowingPresets[modalityType] || windowingPresets['DEFAULT'];
  
  if (!presetList) {
    console.warn('Nenhum preset de janelamento disponível para', modalityType);
    return false;
  }
  
  const preset = presetList.find(p => p.name === presetName) || presetList[0];
  
  if (preset) {
    try {
      dwvApp.setWindowLevel(preset.wl, preset.ww);
      console.log(`Aplicado preset de janelamento: ${preset.name} (WL: ${preset.wl}, WW: ${preset.ww})`);
      return true;
    } catch (error) {
      console.error('Erro ao aplicar preset de janelamento:', error);
      return false;
    }
  }
  
  return false;
}