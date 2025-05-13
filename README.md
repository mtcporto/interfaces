# MVP de Interfaceamento Laboratorial

## Descrição

Este projeto é um Protótipo Mínimo Viável (MVP) de um sistema de interfaceamento laboratorial, projetado para facilitar a integração entre equipamentos de análise (analisadores laboratoriais, equipamentos de imagem) e Sistemas de Informação Laboratorial (LIS) ou Hospitalar (HIS).

A aplicação suporta diversos formatos de dados comuns em ambientes de saúde, permitindo a visualização, interpretação e processamento de dados provenientes de diferentes fontes. O objetivo é demonstrar as possibilidades de integração automática entre sistemas heterogêneos frequentemente encontrados no setor de saúde, especialmente no contexto brasileiro.

## Funcionalidades

- Interpretação e visualização de mensagens **HL7** (Health Level Seven)
- Processamento de mensagens **ASTM** de analisadores laboratoriais
- Visualização e interpretação de imagens **DICOM** (Digital Imaging and Communications in Medicine)
- Importação e exportação de dados em formatos genéricos:
  - **CSV** (Comma-Separated Values)
  - **TXT** (Texto plano delimitado)
  - **XML** (Extensible Markup Language)
- Interface de usuário com duas visualizações distintas:
  - **Visão Técnica**: Mostra dados técnicos e estruturas dos protocolos
  - **Visão para Usuário Final**: Apresenta os dados em formato legível e amigável

## Tecnologias Utilizadas

### Frontend
- HTML5
- CSS3 (com design responsivo)
- JavaScript (ES6+)
- Font Awesome (ícones)
- Chart.js (para visualizações gráficas)

### Bibliotecas Específicas
- **HL7Parser**: Processamento de mensagens HL7
- **DICOM Parser**: Interpretação de arquivos DICOM
- **DWV (DICOM Web Viewer)**: Visualização de imagens médicas
- Decodificadores JPEG para DICOM

### Comunicação
- Web Serial API (para comunicação com equipamentos via porta serial)
- Suporte a TCP/IP (conceitual)
- Métodos de comunicação:
  - Unidirecional (Host Query ou Batch Download)
  - Bidirecional
  - Manual/Semi-automático

### Armazenamento
- Armazenamento local de arquivos DICOM de exemplo
- Suporte para importação e exportação de dados

## Compatibilidade

O sistema foi projetado para funcionar em navegadores web modernos, com foco especial em Chrome/Edge para funcionalidades avançadas como comunicação serial.

## Instalação

1. Clone o repositório
2. Coloque os arquivos em um servidor web (Apache, NGINX, etc.)
3. Acesse via navegador em http://localhost ou em seu domínio configurado

## Estrutura de Diretórios

```
/
├── index.html          # Página principal
├── scripts.js          # JavaScript principal
├── styles.css          # Estilos CSS
├── js/                 # Scripts específicos
│   ├── astm.js         # Processamento ASTM
│   ├── dicom.js        # Processamento DICOM
│   └── serial.js       # Comunicação Serial
└── dicom/              # Arquivos DICOM de exemplo
    └── image-*.dcm     # Imagens DICOM numeradas
```

## Uso

1. Acesse a página principal
2. Selecione o protocolo/formato desejado na barra de navegação
3. Insira ou carregue dados de exemplo no formato especificado
4. Clique no botão "Analisar" ou "Processar" para interpretar os dados
5. Alterne entre as visões técnica e de usuário final para diferentes perspectivas

## Contribuições

Contribuições são bem-vindas! Este é um projeto MVP em desenvolvimento, e há muitas oportunidades para expansão e melhoria.

## Licença

[Adicione informações sobre a licença aqui]