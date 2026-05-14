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

async function exportarParaExcel() {
    const encontrosRef = collection(db, "encontros");  // Ajuste conforme a coleção no Firestore
    const q = query(encontrosRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    let dados = [];
    snapshot.forEach(doc => {
        let data = doc.data();
        dados.push({
            "Criado em": new Date(data.createdAt.seconds * 1000).toLocaleString("pt-BR"),
            "Data": new Date(data.data.seconds * 1000).toLocaleDateString("pt-BR"),
            "Faltantes": data.participantes,
            "Encontro": data.encontro
        });
    });

    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Encontros");

    XLSX.writeFile(wb, "encontros.xlsx");
}

window.exportarParaExcel = exportarParaExcel;