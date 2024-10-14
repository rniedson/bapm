// Função para ajustar a altura do iframe para 200px
function ajustarAlturaIframe() {
    const xpath = "/html/body/form/table/tbody/tr[5]/td/iframe";
    const iframe = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    
    if (iframe) {
        iframe.style.height = '200px';  // Define a altura do iframe
        console.log("Altura do iframe ajustada para 200px.");
    } else {
        console.error("Iframe não encontrado.");
    }
}

// Função para verificar continuamente se o iframe está disponível e ajustar sua altura
function verificarIframe() {
    const xpath = "/html/body/form/table/tbody/tr[5]/td/iframe";
    const iframe = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

    if (iframe) {
        iframe.style.height = '200px';  // Ajusta a altura para 200px
        console.log("Altura do iframe ajustada para 200px.");
    } else {
        console.log("Iframe ainda não encontrado, tentando novamente em 500ms...");
        setTimeout(verificarIframe, 500);  // Tenta novamente após 500ms
    }
}

// Inicia a verificação do iframe após o carregamento da página
window.addEventListener('load', verificarIframe);

// Função para processar a inserção dos números de RG
function processarNumero(numero, callback) {
    console.log(`Preparando para inserir o número ${numero}...`);

    function tentarPreencherFormulario() {
        let campoTexto = document.querySelector('input[name="rg"]');
        let botaoAdicionar = document.querySelector('input[value="Adicionar"]');

        if (!campoTexto || !botaoAdicionar) {
            const iframes = document.querySelectorAll('iframe');
            if (iframes.length > 0) {
                for (let i = 0; i < iframes.length; i++) {
                    const iframeDoc = iframes[i].contentDocument || iframes[i].contentWindow.document;
                    campoTexto = iframeDoc.querySelector('input[name="rg"]');
                    botaoAdicionar = iframeDoc.querySelector('input[value="Adicionar"]');
                    if (campoTexto && botaoAdicionar) break;
                }
            }
        }

        if (!campoTexto || !botaoAdicionar) {
            console.error("Campo de texto ou botão não encontrados, tentando novamente em 500ms...");
            setTimeout(tentarPreencherFormulario, 500);
            return;
        }

        console.log("Campo de texto e botão encontrados, preparando para inserir o número.");
        campoTexto.focus();
        campoTexto.value = '';

        setTimeout(() => {
            campoTexto.value = numero;
            console.log("Número inserido:", campoTexto.value);

            if (botaoAdicionar) {
                console.log("Tentando clicar no botão Adicionar...");
                botaoAdicionar.click();
                console.log("Clique no botão Adicionar foi acionado.");
            } else {
                console.error("Erro: O botão Adicionar não foi encontrado.");
            }

            setTimeout(callback, 3000); // Aguarda 3 segundos antes de processar o próximo número
        }, 1000); // Tempo para garantir que o campo está focado
    }

    tentarPreencherFormulario();
}

// Função para processar todos os números de RG
function processarTodosNumeros(numeros, index = 0) {
    if (index >= numeros.length) {
        console.log("Todos os números foram processados.");
        return;
    }

    processarNumero(numeros[index], () => {
        chrome.runtime.sendMessage({ type: 'update', current: index + 1, total: numeros.length });
        processarTodosNumeros(numeros, index + 1);
    });
}

// Ouve as mensagens do popup.js com os números de RG
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'start') {
        console.log("Recebido pedido para iniciar a inserção dos RGs:", message.numeros);
        processarTodosNumeros(message.numeros);
    }
});
