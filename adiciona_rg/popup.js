document.getElementById('start').addEventListener('click', () => {
    // Obtém os números inseridos pelo usuário e transforma em uma lista
    const rgNumbers = document.getElementById('rgNumbers').value.split(',').map(num => num.trim()).filter(Boolean);

    if (rgNumbers.length === 0) {
        alert('Por favor, insira ao menos um número de RG.');
        return;
    }

    // Reseta a barra de progresso e o status
    updateProgress(0, rgNumbers.length);
    document.getElementById('status').textContent = `Inserindo RGs...`;

    // Envia os números personalizados para o script de conteúdo
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            function: processRGNumbers,
            args: [rgNumbers]
        });
    });
});

// Função para atualizar a barra de progresso
function updateProgress(current, total) {
    const progressBar = document.getElementById('progress-bar');
    const percentage = Math.round((current / total) * 100);
    progressBar.style.width = percentage + '%';
    progressBar.textContent = percentage + '%';
    progressBar.setAttribute('aria-valuenow', percentage);
    document.getElementById('status').textContent = `Adicionado ${current} de ${total} RGs.`;
}

// Função executada na página ativa para processar os RGs
function processRGNumbers(rgNumbers) {
    let total = rgNumbers.length;

    function processarNumero(numero, callback) {
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
                setTimeout(tentarPreencherFormulario, 500);
                return;
            }

            campoTexto.focus();
            campoTexto.value = '';
            setTimeout(() => {
                campoTexto.value = numero;

                if (botaoAdicionar) {
                    botaoAdicionar.click();
                }

                setTimeout(callback, 3000);
            }, 1000);
        }

        tentarPreencherFormulario();
    }

    function processarTodosNumeros(numeros, index = 0) {
        if (index >= numeros.length) {
            chrome.runtime.sendMessage({ type: 'update', current: numeros.length, total: total });
            return;
        }

        processarNumero(numeros[index], () => {
            chrome.runtime.sendMessage({ type: 'update', current: index + 1, total: total });
            processarTodosNumeros(numeros, index + 1);
        });
    }

    processarTodosNumeros(rgNumbers);
}
