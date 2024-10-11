// Lista dos números a serem inseridos
const numeros = [30563, 30780, 32749, 32295, 31165, 31545, 28990, 29067, 32423, 34678, 36402, 38627];

// Função para processar cada número independentemente
function processarNumero(numero, callback) {
    console.log(`Preparando para inserir o número ${numero}...`);

    // Função para verificar se o campo e o botão estão disponíveis
    function tentarPreencherFormulario() {
        let campoTexto = document.querySelector('input[name="rg"]');
        let botaoAdicionar = document.querySelector('input[value="Adicionar"]');

        // Verifica se os elementos estão dentro de um iframe
        if (!campoTexto || !botaoAdicionar) {
            const iframes = document.querySelectorAll('iframe');
            if (iframes.length > 0) {
                for (let i = 0; i < iframes.length; i++) {
                    const iframeDoc = iframes[i].contentDocument || iframes[i].contentWindow.document;
                    campoTexto = iframeDoc.querySelector('input[name="rg"]');
                    botaoAdicionar = iframeDoc.querySelector('input[value="Adicionar"]');
                    if (campoTexto && botaoAdicionar) break; // Se encontrarmos os elementos, saímos do loop
                }
            }
        }

        // Se não encontrar os elementos, tenta novamente depois de 500 ms
        if (!campoTexto || !botaoAdicionar) {
            console.error("Campo de texto ou botão não encontrados, tentando novamente em 500ms...");
            setTimeout(tentarPreencherFormulario, 500);
            return;
        }

        console.log("Campo de texto e botão encontrados, preparando para inserir o número.");

        // Limpa o campo e foca antes de inserir o número
        campoTexto.focus();
        campoTexto.value = ''; // Limpa o campo
        console.log("Campo de texto limpo.");

        // Insere o número no campo após um pequeno atraso
        setTimeout(() => {
            campoTexto.value = numero;
            console.log("Número inserido:", campoTexto.value);

            // Simula o clique no botão "Adicionar"
            if (botaoAdicionar) {
                console.log("Tentando clicar no botão Adicionar...");
                botaoAdicionar.click(); // Simula o clique
                console.log("Clique no botão Adicionar foi acionado.");
            } else {
                console.error("Erro: O botão Adicionar não foi encontrado.");
            }

            // Aguarda um pouco antes de chamar o callback para processar o próximo número
            setTimeout(callback, 3000); // Aguardar 3 segundos para processar o próximo número
        }, 1000); // Tempo para garantir que o campo está focado antes de inserir o valor
    }

    // Inicia o processo para o número atual
    tentarPreencherFormulario();
}

// Função para processar todos os números um por um
function processarTodosNumeros(numeros, index = 0) {
    if (index >= numeros.length) {
        console.log("Todos os números foram processados.");
        return;
    }

    // Processa o número atual e passa para o próximo quando o callback for chamado
    processarNumero(numeros[index], () => {
        processarTodosNumeros(numeros, index + 1);
    });
}

// Inicia o processo para todos os números
processarTodosNumeros(numeros);
