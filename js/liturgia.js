document.addEventListener('DOMContentLoaded', function () {
    // Elementos do DOM
    const daySelect = document.getElementById('day');
    const monthSelect = document.getElementById('month');
    const fetchBtn = document.getElementById('fetch-btn');
    const todayBtn = document.getElementById('today-btn');

    // Preencher dias do mês
    function populateDays() {
        daySelect.innerHTML = '';
        const month = parseInt(monthSelect.value);
        let daysInMonth = 31;

        if (month === 2) {
            daysInMonth = 29; // Simplificado (não considera anos bissextos)
        } else if ([4, 6, 9, 11].includes(month)) {
            daysInMonth = 30;
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const option = document.createElement('option');
            option.value = i < 10 ? `0${i}` : i.toString();
            option.textContent = i < 10 ? `0${i}` : i.toString();
            daySelect.appendChild(option);
        }
    }

    // Carregar dados da liturgia
    async function fetchLiturgy(day, month) {
        try {
            const response = await fetch(`https://liturgia.up.railway.app/v2/?dia=${day}&mes=${month}`);
            if (!response.ok) {
                throw new Error('Erro ao carregar a liturgia');
            }

            const data = await response.json();

            // Verificar se a API retornou um erro
            if (data.erro) {
                Alerts.error("Aviso", data.erro);
                displayNotFound(data.data || `${day}/${month}`);
                return;
            }

            // Verificar se a resposta contém dados válidos
            if (!data || !data.liturgia) {
                throw new Error('Dados da liturgia não disponíveis para esta data');
            }

            displayLiturgy(data);
        } catch (error) {
            console.error('Erro:', error);
            Alerts.error("Erro na Consulta", error.message);
            displayError();
        }
    }

    // Exibir dados da liturgia
    function displayLiturgy(data) {
        // Data e título
        document.getElementById('liturgy-date').textContent = data.data || 'Data não disponível';
        document.getElementById('liturgy-title').textContent = data.liturgia || 'Liturgia não disponível';

        // Cor litúrgica
        const colorElement = document.getElementById('liturgy-color');
        if (data.cor) {
            colorElement.textContent = data.cor;
            colorElement.className = 'liturgy-color';

            // Aplicar classe de cor correspondente
            const colorMap = {
                'Branco': 'color-branco',
                'Vermelho': 'color-vermelho',
                'Verde': 'color-verde',
                'Roxo': 'color-roxo',
                'Rosa': 'color-rosa',
                'Preto': 'color-preto'
            };

            if (colorMap[data.cor]) {
                colorElement.classList.add(colorMap[data.cor]);
            }
        } else {
            colorElement.style.display = 'none';
        }

        // Antífonas
        if (data.antifonas) {
            document.getElementById('antiphon-entrance').textContent = data.antifonas.entrada || 'Não disponível';
            document.getElementById('antiphon-communion').textContent = data.antifonas.comunhao || 'Não disponível';
        }

        // Orações
        if (data.oracoes) {
            document.getElementById('coleta').innerHTML = formatText(data.oracoes.coleta || 'Não disponível');
            document.getElementById('oferendas').innerHTML = formatText(data.oracoes.oferendas || 'Não disponível');
            document.getElementById('comunhao').innerHTML = formatText(data.oracoes.comunhao || 'Não disponível');
        }

        // Mostrar o container de conteúdo
        document.getElementById('liturgy-content').style.display = 'block';

        // Leituras - Corrigido para verificar se existe o objeto leituras
        if (data.leituras) {
            displayReading('primeira-leitura', data.leituras.primeiraLeitura || []);
            displayPsalm(data.leituras.salmo || []);
            displayReading('segunda-leitura', data.leituras.segundaLeitura || []);
            displayGospel(data.leituras.evangelho || []);
        }
    }

    // Exibir leitura (1ª ou 2ª) - Corrigido para usar innerHTML corretamente
    function displayReading(elementId, readings) {
        const container = document.getElementById(elementId);

        if (!readings || readings.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        container.innerHTML = ''; // Limpa o conteúdo antes de adicionar

        readings.forEach(reading => {
            const readingHtml = `
                <label>${reading.titulo || 'Leitura'}</label>
                <div class="reading-text">
                    <small>${reading.referencia || ''}</small>
                    <p>${formatText(reading.texto || 'Texto não disponível')}</p>
                </div>
            `;
            container.innerHTML += readingHtml; // Adiciona ao invés de substituir
        });
    }

    // Exibir salmo - Corrigido para usar innerHTML corretamente
    function displayPsalm(psalms) {
        const container = document.getElementById('salmo');

        if (!psalms || psalms.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        container.innerHTML = ''; // Limpa o conteúdo antes de adicionar

        psalms.forEach(psalm => {
            const psalmHtml = `
                <label>Salmo Responsorial</label>
                <div class="reading-text">
                    <small>${psalm.referencia || ''}</small>
                    ${psalm.refrao ? `<span class="refrain">${psalm.refrao}</span>` : ''}
                    <p>${formatText(psalm.texto || 'Texto não disponível')}</p>
                </div>
            `;
            container.innerHTML += psalmHtml; // Adiciona ao invés de substituir
        });
    }

    // Exibir evangelho - Corrigido para usar innerHTML corretamente
    function displayGospel(gospels) {
        const container = document.getElementById('evangelho');

        if (!gospels || gospels.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        container.innerHTML = ''; // Limpa o conteúdo antes de adicionar

        gospels.forEach(gospel => {
            const gospelHtml = `
                <label>${gospel.titulo || 'Evangelho'}</label>
                <div class="reading-text">
                    <small>${gospel.referencia || ''}</small>
                    <p>${formatText(gospel.texto || 'Texto não disponível')}</p>
                </div>
            `;
            container.innerHTML += gospelHtml; // Adiciona ao invés de substituir
        });
    }

    // Formatar texto (substituir \n por <br> e versículos por superscript)
    function formatText(text) {
        if (!text) return 'Não disponível';

        let formattedText = text.replace(/\n/g, '<br><br>');

        // Depois, processar os versículos (números no início de frases)
        // Isso encontrará números no início de palavras após quebras ou no início do texto
        formattedText = formattedText.replace(/(^|<br>|<br><br>|\s)(\d+)([^\d<])/g,
            '$1<sup class="verse-number">$2</sup>$3');

        formattedText = formattedText.replace(/(\s)(\d+)([a-zA-ZÀ-ú])/g,
            '$1<sup class="verse-number">$2</sup>$3');

        return formattedText;
    }

    // Definir data atual
    function setCurrentDate() {
        const today = new Date();
        const day = today.getDate();
        const month = today.getMonth() + 1;

        monthSelect.value = month < 10 ? `0${month}` : month.toString();
        populateDays();
        daySelect.value = day < 10 ? `0${day}` : day.toString();

        fetchLiturgy(daySelect.value, monthSelect.value);
    }

    // Event Listeners
    monthSelect.addEventListener('change', populateDays);

    fetchBtn.addEventListener('click', () => {
        fetchLiturgy(daySelect.value, monthSelect.value);
    });

    todayBtn.addEventListener('click', setCurrentDate);

    // Inicializar
    populateDays();
    setCurrentDate();
});