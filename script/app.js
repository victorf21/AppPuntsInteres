let mapa;
let puntsInteres = [];

document.addEventListener('DOMContentLoaded', () => {
    mapa = new Mapa();
    setupDropZone();
    setupFilters();
});

function setupDropZone() {
    const dropZone = document.getElementById('dropzone');

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        console.log("Archivo soltado");

        const files = e.dataTransfer.files;
        if (files.length === 0) return;

        const file = files[0];
        console.log("Archivo recibido:", file.name, "Tipo:", file.type);

        if (file.name.endsWith('.csv') || file.type === 'text/csv') {
            console.log("Archivo CSV válido detectado");
            readCsv(file);
        } else {
            console.error("El archivo no es CSV");
            alert("El fitxer no és CSV");
        }
    });
}

function readCsv(file) {
    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const content = e.target.result;
            console.log("Contenido del CSV:", content.substring(0, 100) + "..."); 

            const lines = content.split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);
            
            const hasHeader = lines[0].toLowerCase().includes('pais;codi;ciutat');
            const dataLines = hasHeader ? lines.slice(1) : lines;
            
            console.log(`Procesando ${dataLines.length} líneas de datos`);

            puntsInteres = dataLines.map((line, index) => {
            
                const campos = line.split(';').map(campo => campo.trim());
                console.log(`Línea ${index + 1}:`, campos);
         
                if (campos.length < 13) {
                    console.warn(`Línea ${index + 1} tiene solo ${campos.length} campos`);
                    return null;
                }
                
                return loadData(campos, index);
            }).filter(item => item !== null); 

            console.log("Puntos de interés cargados:", puntsInteres);
            
            actualitzarLlista();
            actualitzarMapa();
            carregarMenuTipus();
            
            if (puntsInteres.length > 0) {
                carregarInformacioPais();
            }
        } catch (error) {
            console.error("Error procesando CSV:", error);
            alert("Error procesant el fitxer CSV");
        }
    };

    reader.onerror = () => {
        console.error("Error al leer el archivo");
        alert("Error al llegir el fitxer");
    };

    console.log("Leyendo archivo como texto...");
    reader.readAsText(file);
}

function loadData(campos, index) {
    const tipus = campos[TIPUS];

    switch (tipus) {
        case "Atraccio":
            return new Atraccio(
                index, // id
                false, // esManual
                campos[PAIS], // pais
                campos[CIUTAT], // ciutat
                campos[NOM], // nom
                campos[DIR], // direccio
                campos[TIPUS], // tipus
                parseFloat(campos[LAT]), // latitud
                parseFloat(campos[LON]), // longitud
                parseFloat(campos[PUNTUACIO]), // puntuacio
                campos[HORARIS], // horaris
                parseFloat(campos[PREU]), // preu
                campos[MONEDA] // moneda
            );

        case "Museu":
            return new Museu(
                index, // id
                false, // esManual
                campos[PAIS], // pais
                campos[CIUTAT], // ciutat
                campos[NOM], // nom
                campos[DIR], // direccio
                campos[TIPUS], // tipus
                parseFloat(campos[LAT]), // latitud
                parseFloat(campos[LON]), // longitud
                parseFloat(campos[PUNTUACIO]), // puntuacio
                campos[HORARIS], // horaris
                parseFloat(campos[PREU]), // preu
                campos[MONEDA], // moneda
                campos[DESCRIPCIO] // descripcio
            );

        default:
            return new PuntInteres(
                index, // id
                false, // esManual
                campos[PAIS], // pais
                campos[CIUTAT], // ciutat
                campos[NOM], // nom
                campos[DIR], // direccio
                campos[TIPUS], // tipus
                parseFloat(campos[LAT]), // latitud
                parseFloat(campos[LON]), // longitud
                parseFloat(campos[PUNTUACIO]) // puntuacio
            );
    }
}

function actualitzarLlista() {
    const llista = document.getElementById('llistaPunts');
    llista.innerHTML = puntsInteres.map(punt => `
        <div class="punt ${punt.tipus.toLowerCase()}">
            <strong>${punt.nom}</strong> (${punt.tipus})
            ${punt.tipus === "Atraccio" ? `| Horaris: ${punt.horaris} | Preu: ${punt.preu}${punt.moneda}` : ''}
            ${punt.tipus === "Museu" ? `| Horaris: ${punt.horaris} | Preu: ${punt.preu}${punt.moneda} | Descripció: ${punt.descripcio}` : ''}
            <button onclick="eliminarPunt(${punt.id})">Eliminar</button>
        </div>
    `).join('');
    document.getElementById('totalElements').textContent = `Total elements: ${puntsInteres.length}`;
}

function actualitzarMapa() {
    mapa.borrarPunt();
    puntsInteres.forEach(punt => {
        mapa.mostrarPunt(punt.latitud, punt.longitud, punt.nom);
    });
}

function eliminarPunt(id) {
    if (confirm("Estàs segur que vols eliminar aquest punt?")) {
        puntsInteres = puntsInteres.filter(punt => punt.id !== id);
        actualitzarLlista();
        actualitzarMapa();
    }
}

function setupFilters() {
    document.getElementById('tipusFilter').addEventListener('change', aplicarFiltres);
    document.getElementById('ordreFilter').addEventListener('change', aplicarFiltres);
    document.getElementById('nomFilter').addEventListener('input', aplicarFiltres);
}

function aplicarFiltres() {
    const tipus = document.getElementById('tipusFilter').value;
    const ordre = document.getElementById('ordreFilter').value;
    const nom = document.getElementById('nomFilter').value.toLowerCase();

    let filtrada = puntsInteres.filter(punt => {
        return (tipus === "Tots" || punt.tipus === tipus) &&
               punt.nom.toLowerCase().includes(nom);
    });

    if (ordre === "Ascendent") {
        filtrada.sort((a, b) => a.nom.localeCompare(b.nom));
    } else {
        filtrada.sort((a, b) => b.nom.localeCompare(a.nom));
    }

    actualitzarLlista(filtrada);
    actualitzarMapa(filtrada);
}

function carregarMenuTipus() {
    const tipusSet = new Set(puntsInteres.map(punt => punt.tipus));
    const tipusFilter = document.getElementById('tipusFilter');

    tipusSet.forEach(tipus => {
        const option = document.createElement('option');
        option.value = tipus;
        option.textContent = tipus;
        tipusFilter.appendChild(option);
    });
}

async function carregarInformacioPais() {
    if (puntsInteres.length > 0) {
        const codiPais = puntsInteres[0].pais;
        const resposta = await fetch(`https://restcountries.com/v3.1/alpha/${codiPais}`);
        const dades = await resposta.json();

        if (dades.length > 0) {
            const pais = dades[0];
            const bandera = pais.flags.png;
            const lat = pais.latlng[0];
            const lon = pais.latlng[1];

            document.getElementById('infoPais').innerHTML = `
                <img src="${bandera}" alt="Bandera de ${pais.name.common}" width="50">
                <p>Ciutat: ${puntsInteres[0].ciutat}</p>
            `;

            mapa.actualitzarPosInitMapa(lat, lon);
        }
    }
}