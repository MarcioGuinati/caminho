let currentPage = 1;
let itemsPerPage = 10;
let lastVisible = null;
let firstVisible = null;
let allDocs = []; // Usaremos cache local para facilitar a paginação rápida se o volume for moderado

document.addEventListener("DOMContentLoaded", function() {
    initPagination();
    fetchResults();
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

async function fetchResults() {
    try {
        const resultsList = document.getElementById('results-list');
        if (!resultsList) return;
        resultsList.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 40px;">Carregando registros...</td></tr>';

        // Buscamos todos os documentos para facilitar a paginação client-side 
        // (mais rápido para o usuário trocar de página sem novas requisições)
        const q = query(collection(db, 'celebracoes'), orderBy('data', 'desc'));
        const querySnapshot = await getDocs(q);
        
        allDocs = [];
        querySnapshot.forEach(doc => {
            allDocs.push({ id: doc.id, ...doc.data() });
        });

        renderResults();
    } catch (error) {
        console.error("Error fetching documents: ", error);
        document.getElementById('results-list').innerHTML = '<tr><td colspan="4" style="text-align:center; color: red;">Erro ao carregar dados.</td></tr>';
    }
}

function renderResults() {
    const resultsList = document.getElementById('results-list');
    if (!resultsList) return;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageDocs = allDocs.slice(startIndex, endIndex);

    resultsList.innerHTML = '';

    if (pageDocs.length === 0) {
        resultsList.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 40px;">Nenhum registro encontrado.</td></tr>';
        updatePaginationUI(0);
        return;
    }

    pageDocs.forEach((data, index) => {
        const date = new Date(data.data.seconds * 1000);
        const formattedDate = date.toLocaleDateString('pt-BR');

        const resultRow = document.createElement('tr');
        resultRow.innerHTML = `
            <td>
                <div style="font-weight: 700; color: var(--primary-dark);">${data.tema || 'Sem tema'}</div>
                <div style="font-size: 0.8rem; color: var(--text-light);">${data.grupo || 'Sem grupo'}</div>
            </td>
            <td>${formattedDate}</td>
            <td>
                <span class="badge ${data.participantes ? 'badge-danger' : 'badge-success'}">
                    ${data.participantes || 'Nenhum'}
                </span>
            </td>
            <td style="text-align: center;">
                <button class="action-btn" onclick="printResult('${data.id}')" style="background: none; border: none; color: var(--primary-color); cursor: pointer; font-size: 1.1rem;">
                    <i class="fas fa-print"></i>
                </button>
            </td>
        `;
        resultsList.appendChild(resultRow);
    });

    updatePaginationUI(allDocs.length);
}

function updatePaginationUI(total) {
    const totalPages = Math.ceil(total / itemsPerPage);
    const paginationContainer = document.getElementById('pagination-container');
    
    if (!paginationContainer) return;

    const start = total === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, total);

    paginationContainer.innerHTML = `
        <div class="pagination-info">
            Mostrando <strong>${start}-${end}</strong> de <strong>${total}</strong> registros
        </div>
        <div class="pagination-buttons">
            <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>
            <span class="pagination-btn active">${currentPage}</span>
            <button class="pagination-btn" ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>
        </div>
    `;
}

window.changePage = function(page) {
    currentPage = page;
    renderResults();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function printResult(id) {
    try {
        const docSnap = await getDoc(doc(db, 'celebracoes', id));
        if (docSnap.exists()) {
            const data = docSnap.data();
            const date = new Date(data.data.seconds * 1000);
            const formattedDate = date.toLocaleDateString('pt-BR');

            const printableContent = `
                <div class="service-order">
                    <div class="header">
                        <img src="https://s3-sa-east-1.amazonaws.com/loja2/502253fe6a1b3fa283a422fd46b0d7fb.jpg" alt="Logo">
                        <h1>Celebração</h1>
                    </div>
                    <div class="content">
                        <div class="section">
                            <h2>Informações da Celebração</h2>
                            <p><strong>Tema:</strong> ${data.tema}</p>
                            <p><strong>Data:</strong> ${formattedDate}</p>
                            <p><strong>Grupo Responsável:</strong> ${data.grupo}</p>
                            <p><strong>Participantes Faltantes:</strong> ${data.participantes}</p>
                        </div>
                    </div>
                    <div class="footer">
                        <p>Caminho Nuporanga • Comunidade 5</p>
                    </div>
                </div>
            `;
            const printWindow = window.open('', '', 'height=800,width=600');
            printWindow.document.write('<html><head><title>Caminho</title>');
            printWindow.document.write('<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap" rel="stylesheet">');
            printWindow.document.write(`<style>
                body { font-family: 'Montserrat', sans-serif; background: #fff; padding: 20px; }
                .service-order { border: 2px solid #603813; border-radius: 20px; padding: 40px; max-width: 700px; margin: 0 auto; }
                .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #603813; padding-bottom: 20px; }
                .header img { width: 80px; height: 80px; border-radius: 50%; margin-bottom: 10px; }
                .header h1 { color: #603813; margin: 0; font-size: 1.8rem; }
                .section h2 { background: #603813; color: #fff; padding: 10px 15px; font-size: 1.1rem; border-radius: 8px; margin-bottom: 20px; }
                .section p { margin: 12px 0; font-size: 1.05rem; color: #333; line-height: 1.6; }
                .footer { margin-top: 40px; text-align: center; border-top: 1px solid #eee; padding-top: 20px; color: #777; font-size: 0.9rem; }
            </style>`);
            printWindow.document.write('</head><body>');
            printWindow.document.write(printableContent);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.print();
        }
    } catch (error) {
        console.error("Error getting document: ", error);
    }
}

