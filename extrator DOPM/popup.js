// Variáveis globais para armazenar os dados
let capturedText = '';
let rgs = '';
let authority = '';

// Função para capturar o conteúdo da página
function captureContent() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: extractContentFromPage
    }, (results) => {
      if (results && results[0] && results[0].result) {
        const data = results[0].result;
        processContent(data);
      }
    });
  });
}

// Função para processar o conteúdo capturado
function processContent(data) {
  const customInitials = "\nRNMM."; // Custom initials com quebra de linha e ponto final
  let text = data;
  let lines = text.split(/\r?\n/).filter(line => line.trim() !== '');

  // Encontrar a linha onde aparece "ITEM ..." e cortar a busca de RGs até essa linha
  const itemIndex = lines.findIndex(line =>
    /ITEM DOEPM|ITEM DOPM|ITEM DO DOPM|ITEM PARA DOPM/i.test(line)
  );
  const searchRange = itemIndex !== -1 ? lines.slice(0, itemIndex).join(' ') : text;

  // Extrair RGs até o ponto encontrado
  let rgMatches = searchRange.match(/(\b\d{2}[.,]\d{3}\b)|(\b\d{5}\b)/g);
  const rgList = rgMatches ? rgMatches.map(rg => rg.replace(/[.,]/g, '')).filter(rg => rg.length === 5) : [];

  // Processar o texto a partir das palavras-chave
  const startIndex = lines.findIndex(line =>
    /Por terem|Por ter|Que sempre|PELA CONTRIBUIÇÃO|Pelo ter/i.test(line)
  );
  const endIndex = lines.findIndex(line => /Documento Assinado|RNMM/i.test(line));
  const effectiveEndIndex = endIndex !== -1 ? endIndex : lines.length;

  const processedText = (startIndex !== -1 && startIndex < effectiveEndIndex)
    ? lines.slice(startIndex, effectiveEndIndex).join(' ')
    : lines.slice(startIndex).join(' ');

  // Adicionar customInitials com quebra de linha e ponto final, se necessário
  const finalText = processedText.includes(customInitials.trim())
    ? processedText
    : processedText + customInitials;

  // Varrer de trás para frente e capturar a linha anterior à palavra-chave que inicia a linha
  let authorityName = '';
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/^(Comandante|Chefe|Diretor|Assistente)/i.test(lines[i])) {
      if (i > 0) {
        authorityName = lines[i - 1].trim(); // Captura a linha anterior
      }
      break;
    }
  }

  // Atualizar variáveis e salvar
  capturedText = finalText.trim();
  rgs = rgList.join(', ');
  authority = authorityName;

  updateUI();
  saveData();
}

// Atualizar os campos da interface com os dados processados
function updateUI() {
  document.getElementById('capturedText').value = capturedText;
  document.getElementById('rgs').value = rgs;
  document.getElementById('autoridade').value = authority;
}

// Função para preencher o formulário na página ativa
function fillForm() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: fillFormFields,
      args: [capturedText, authority, rgs.split(',').map(num => num.trim())]
    });
  });
}

// Função para salvar dados no localStorage
function saveData() {
  localStorage.setItem('capturedText', capturedText);
  localStorage.setItem('rgs', rgs);
  localStorage.setItem('autoridade', authority);
}

// Função para carregar dados do localStorage
function loadData() {
  capturedText = localStorage.getItem('capturedText') || '';
  rgs = localStorage.getItem('rgs') || '';
  authority = localStorage.getItem('autoridade') || '';
  updateUI();
}

// Função para limpar dados
function clearData() {
  capturedText = '';
  rgs = '';
  authority = '';
  updateUI();
  localStorage.clear();
}

// Função injetada na página para extrair o conteúdo
function extractContentFromPage() {
  let extractedText = '';

  try {
    const iframeVisualizacao = document.getElementById('ifrVisualizacao');
    if (iframeVisualizacao) {
      const iframeDoc1 = iframeVisualizacao.contentDocument || iframeVisualizacao.contentWindow.document;
      const iframeArvoreHtml = iframeDoc1.getElementById('ifrArvoreHtml');
      if (iframeArvoreHtml) {
        const iframeDoc2 = iframeArvoreHtml.contentDocument || iframeArvoreHtml.contentWindow.document;
        extractedText = iframeDoc2.body.innerText.trim();
      }
    }
  } catch (e) {
    console.error('Erro ao acessar o conteúdo:', e);
  }

  return extractedText;
}

// Função injetada na página para preencher os campos do formulário
function fillFormFields(textoElogio, autoridade, numeros) {
  function buscarElemento(seletor) {
    let elemento = document.querySelector(seletor);
    if (!elemento) {
      const iframes = Array.from(document.querySelectorAll('iframe')).flatMap(iframe => {
        try {
          return iframe.contentDocument ? [iframe.contentDocument.querySelector(seletor)] : [];
        } catch {
          return [];
        }
      });
      elemento = iframes.find(Boolean);
    }
    return elemento;
  }

  // Função para preencher os campos de texto
  function preencherCamposTexto(callback) {
    const campoTextoElogio = buscarElemento('#textoElogio') || buscarElemento('textarea[name="textoElogio"]');
    const campoAutoridade = buscarElemento('#autoridade') || buscarElemento('input[name="autoridade"]');

    if (campoTextoElogio) campoTextoElogio.value = textoElogio;
    if (campoAutoridade) campoAutoridade.value = autoridade;

    if (callback) callback();
  }

  // Função para processar um número de RG e clicar no botão "Adicionar"
  function processarNumero(numero, callback) {
    function tentarPreencherFormulario() {
      const campoRG = buscarElemento('input[name="rg"]');
      const botaoAdicionar = buscarElemento('input[value="Adicionar"]');

      if (!campoRG || !botaoAdicionar) {
        console.error("Campo de RG ou botão 'Adicionar' não encontrados. Tentando novamente em 500ms...");
        setTimeout(tentarPreencherFormulario, 5000);
        return;
      }

      campoRG.value = '';
      setTimeout(() => {
        campoRG.value = numero;
        botaoAdicionar.click();
        setTimeout(callback, 5000); // Aguardar 1 segundo antes de processar o próximo número
      }, 5000);
    }

    tentarPreencherFormulario();
  }

  // Função para processar todos os números de forma sequencial
  function processarTodosNumeros(numeros, index = 0) {
    if (index >= numeros.length) {
      console.log("Todos os números foram processados.");
      return;
    }

    processarNumero(numeros[index], () => {
      processarTodosNumeros(numeros, index + 1);
    });
  }

  // Função principal que executa o preenchimento
  function executarPreenchimento() {
    preencherCamposTexto(() => {
      processarTodosNumeros(numeros);
    });
  }

  executarPreenchimento();
}

// Event Listeners
document.getElementById('captureButton').addEventListener('click', captureContent);
document.getElementById('fillButton').addEventListener('click', fillForm);
document.getElementById('clearButton').addEventListener('click', clearData);
document.querySelectorAll('textarea, input').forEach(input => {
  input.addEventListener('input', saveData);
});

// Carregar dados ao abrir o popup
window.addEventListener('DOMContentLoaded', loadData);
