import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCQrsuTuqXowmnl2JWse0balVQChUHvjBg",
    authDomain: "igreja-747c5.firebaseapp.com",
    projectId: "igreja-747c5",
    storageBucket: "igreja-747c5.firebasestorage.app",
    messagingSenderId: "909549397062",
    appId: "1:909549397062:web:f99c36435c54b970299647",
    measurementId: "G-WF0ZL1TWW2"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.db = db;
window.collection = collection;
window.getDocs = getDocs;
window.query = query;
window.orderBy = orderBy;

async function exportarParaPDF() {
    try {
        const celebracoesRef = collection(db, "celebracoes");
        const q = query(celebracoesRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        const doc = new jspdf.jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        // Cabeçalho
        doc.setFontSize(18);
        doc.text("Relatório de Celebrações", 15, 15);
        doc.setFontSize(10);
        doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 15, 22);

        // Dados da tabela
        const body = [];
        snapshot.forEach(docData => {
            const data = docData.data();
            body.push([
                formatDate(data.createdAt.toDate()),
                formatDate(data.data.toDate()),
                data.grupo,
                data.participantes,
                data.tema
            ]);
        });

        // Configuração da tabela
        doc.autoTable({
            head: [['Data Criação', 'Data Celebração', 'Grupo', 'Faltantes', 'Tema']],
            body: body,
            startY: 25,
            theme: 'grid',
            styles: { fontSize: 10 },
            headStyles: { fillColor: [96, 56, 19], textColor: 255 },
            columnStyles: {
                0: { cellWidth: 35 },
                1: { cellWidth: 35 },
                2: { cellWidth: 50 },
                3: { cellWidth: 50 },
                4: { cellWidth: 30 }
            }
        });

        // Salvar PDF
        doc.save(`celebracoes_${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
        console.error("Erro ao exportar:", error);
        alert("Ocorreu um erro ao gerar o PDF");
    }
}

function formatDate(date) {
    return date.toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'America/Sao_Paulo'
    }) + ' UTC-3';
}

window.exportarParaPDF = exportarParaPDF;