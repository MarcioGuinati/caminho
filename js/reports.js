let allData = [];
let filteredData = [];
let currentPage = 1;
let itemsPerPage = 10;

document.addEventListener("DOMContentLoaded", function() {
    initPagination();
    setupFilters();
    loadAllData();
});

function initPagination() {
    const limitSelect = document.getElementById('page-limit');
    if (limitSelect) {
        limitSelect.addEventListener('change', (e) => {
            itemsPerPage = parseInt(e.target.value);
            currentPage = 1;
            renderResults();
        });
    }
}

function setupFilters() {
    const applyBtn = document.getElementById('apply-filters');
    if (applyBtn) {
        applyBtn.addEventListener('click', applyFilters);
    }

    // Atalho para enter no campo de busca
    document.getElementById('filter-search').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') applyFilters();
    });
}

async function loadAllData() {
    try {
        const resultsList = document.getElementById('results-list');
        resultsList.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 40px;">Carregando dados...</td></tr>';

        // Fetch de todas as coleções em paralelo
        const [celebSnap, convSnap, enconSnap] = await Promise.all([
            getDocs(query(collection(db, 'celebracoes'), orderBy('data', 'desc'))),
            getDocs(query(collection(db, 'convivencias'), orderBy('data', 'desc'))),
            getDocs(query(collection(db, 'encontros'), orderBy('data', 'desc')))
        ]);

        allData = [];
        
        // Processar Celebrações
        celebSnap.forEach(doc => {
            allData.push({ id: doc.id, type: 'celebracoes', label: 'Celebração', ...doc.data() });
        });

        // Processar Convivências
        convSnap.forEach(doc => {
            allData.push({ id: doc.id, type: 'convivencias', label: 'Convivência', ...doc.data() });
        });

        // Processar Encontros
        enconSnap.forEach(doc => {
            allData.push({ id: doc.id, type: 'encontros', label: 'Encontro', ...doc.data() });
        });

        // Ordenar tudo por data descrescente
        allData.sort((a, b) => b.data.seconds - a.data.seconds);

        updateStats();
        applyFilters();

    } catch (error) {
        console.error("Erro ao carregar dados:", error);
        Alerts.error("Erro no Banco de Dados", "Não foi possível conectar ao sistema. Tente novamente mais tarde.");
        document.getElementById('results-list').innerHTML = '<tr><td colspan="4" style="text-align:center; color: red;">Erro ao carregar o banco de dados.</td></tr>';
    }
}

function updateStats() {
    const counts = {
        celebracoes: allData.filter(d => d.type === 'celebracoes').length,
        convivencias: allData.filter(d => d.type === 'convivencias').length,
        encontros: allData.filter(d => d.type === 'encontros').length
    };

    document.getElementById('total-celeb').textContent = counts.celebracoes;
    document.getElementById('total-conv').textContent = counts.convivencias;
    document.getElementById('total-encon').textContent = counts.encontros;
    document.getElementById('total-geral').textContent = allData.length;
}

function applyFilters() {
    const type = document.getElementById('filter-type').value;
    const startDate = document.getElementById('filter-start-date').value;
    const endDate = document.getElementById('filter-end-date').value;
    const search = document.getElementById('filter-search').value.toLowerCase();

    filteredData = allData.filter(item => {
        // Filtro de Tipo
        if (type !== 'todos' && item.type !== type) return false;

        // Filtro de Data
        const itemDate = new Date(item.data.seconds * 1000).toISOString().split('T')[0];
        if (startDate && itemDate < startDate) return false;
        if (endDate && itemDate > endDate) return false;

        // Filtro de Busca (Tema, Local, Grupo ou Participantes)
        if (search) {
            const content = `${item.tema || ''} ${item.local || ''} ${item.encontro || ''} ${item.grupo || ''} ${item.participantes || ''}`.toLowerCase();
            if (!content.includes(search)) return false;
        }

        return true;
    });

    currentPage = 1;
    renderResults();
}

function renderResults() {
    const resultsList = document.getElementById('results-list');
    if (!resultsList) return;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredData.slice(startIndex, endIndex);

    resultsList.innerHTML = '';

    if (pageData.length === 0) {
        resultsList.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 40px;">Nenhum registro encontrado para os filtros selecionados.</td></tr>';
        updatePaginationUI(0);
        return;
    }

    pageData.forEach(item => {
        const date = new Date(item.data.seconds * 1000);
        const formattedDate = date.toLocaleDateString('pt-BR');
        
        // Cores por tipo
        let typeColor = '#603813';
        if (item.type === 'convivencias') typeColor = '#b29f94';
        if (item.type === 'encontros') typeColor = '#4a90e2';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <span class="badge" style="background: ${typeColor}; color: white; margin-bottom: 5px; display: inline-block;">${item.label}</span>
                <div style="font-weight: 700; color: var(--primary-dark);">${item.tema || item.local || item.encontro || 'Registro'}</div>
            </td>
            <td>${formattedDate}</td>
            <td>
                <div style="font-size: 0.85rem; color: var(--text-light);">
                    ${item.grupo ? `<strong>Grupo:</strong> ${item.grupo}<br>` : ''}
                    <strong>Faltantes:</strong> ${item.participantes || 'Nenhum'}
                </div>
            </td>
            <td style="text-align: center;">
                <button class="action-btn" onclick="printReportItem('${item.type}', '${item.id}')" style="color: var(--primary-color);">
                    <i class="fas fa-print"></i>
                </button>
            </td>
        `;
        resultsList.appendChild(row);
    });

    updatePaginationUI(filteredData.length);
}

function updatePaginationUI(total) {
    const totalPages = Math.ceil(total / itemsPerPage);
    const paginationContainer = document.getElementById('pagination-container');
    if (!paginationContainer) return;

    const start = total === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, total);

    paginationContainer.innerHTML = `
        <div class="pagination-info">Mostrando <strong>${start}-${end}</strong> de <strong>${total}</strong> resultados</div>
        <div class="pagination-buttons">
            <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})"><i class="fas fa-chevron-left"></i></button>
            <span class="pagination-btn active">${currentPage}</span>
            <button class="pagination-btn" ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''} onclick="changePage(${currentPage + 1})"><i class="fas fa-chevron-right"></i></button>
        </div>
    `;
}

window.changePage = function(page) {
    currentPage = page;
    renderResults();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.printReportItem = async function(type, id) {
    try {
        const docSnap = await getDoc(doc(db, type, id));
        if (docSnap.exists()) {
            const data = docSnap.data();
            const date = new Date(data.data.seconds * 1000);
            const formattedDate = date.toLocaleDateString('pt-BR');
            
            const title = type === 'celebracoes' ? 'Relatório de Celebração' : 
                         type === 'convivencias' ? 'Relatório de Convivência' : 'Relatório de Encontro';

            const printableContent = `
                <div class="service-order">
                    <div class="header">
                        <img src="https://s3-sa-east-1.amazonaws.com/loja2/502253fe6a1b3fa283a422fd46b0d7fb.jpg" alt="Logo">
                        <h1>${title}</h1>
                    </div>
                    <div class="content">
                        <div class="section">
                            <h2>Detalhes do Registro</h2>
                            <p><strong>Identificação:</strong> ${data.tema || data.local || data.encontro}</p>
                            <p><strong>Data:</strong> ${formattedDate}</p>
                            ${data.grupo ? `<p><strong>Grupo Responsável:</strong> ${data.grupo}</p>` : ''}
                            <p><strong>Participantes Faltantes:</strong> ${data.participantes || 'Nenhum'}</p>
                        </div>
                    </div>
                    <div class="footer"><p>Caminho Nuporanga • Comunidade 5</p></div>
                </div>
            `;
            
            const printWindow = window.open('', '', 'height=800,width=600');
            printWindow.document.write('<html><head><title>Caminho</title><link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap" rel="stylesheet"><style>body{font-family:"Montserrat",sans-serif;background:#fff;padding:20px}.service-order{border:2px solid #603813;border-radius:20px;padding:40px;max-width:700px;margin:0 auto}.header{text-align:center;margin-bottom:40px;border-bottom:2px solid #603813;padding-bottom:20px}.header img{width:80px;height:80px;border-radius:50%;margin-bottom:10px}.header h1{color:#603813;margin:0;font-size:1.8rem}.section h2{background:#603813;color:#fff;padding:10px 15px;font-size:1.1rem;border-radius:8px;margin-bottom:20px}.section p{margin:12px 0;font-size:1.05rem;color:#333;line-height:1.6}.footer{margin-top:40px;text-align:center;border-top:1px solid #eee;padding-top:20px;color:#777;font-size:0.9rem}</style></head><body>'+printableContent+'</body></html>');
            printWindow.document.close();
            printWindow.print();
        } else {
            Alerts.error("Erro", "O registro selecionado não foi encontrado!");
        }
    } catch (error) {
        console.error("Erro ao gerar relatório:", error);
        Alerts.error("Falha na Impressão", "Não foi possível gerar o documento para impressão.");
    }
}
