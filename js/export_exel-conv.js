import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCFu1Y1ml9bB-Fna6859_RfXTF7bbPvP1U",
    authDomain: "caminho-comunidade6.firebaseapp.com",
    projectId: "caminho-comunidade6",
    storageBucket: "caminho-comunidade6.firebasestorage.app",
    messagingSenderId: "723550846433",
    appId: "1:723550846433:web:1fb390b81cd3e132a026a0",
    measurementId: "G-EHV4MC98BE"
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
    const convivenciasRef = collection(db, "convivencias");  // Ajuste conforme a coleção no Firestore
    const q = query(convivenciasRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    let dados = [];
    snapshot.forEach(doc => {
        let data = doc.data();
        dados.push({
            "Criado em": new Date(data.createdAt.seconds * 1000).toLocaleString("pt-BR"),
            "Data": new Date(data.data.seconds * 1000).toLocaleDateString("pt-BR"),
            // "Grupo": data.grupo,
            "Faltantes": data.participantes,
            "Local": data.local
        });
    });

    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "convivencias");

    XLSX.writeFile(wb, "convivencias.xlsx");
}

window.exportarParaExcel = exportarParaExcel;