class Mapa {
    #map;
    #currentLat;
    #currentLon;
    #markers = [];

    constructor() {
        this.#map = L.map('map').setView([41.3851, 2.1734], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(this.#map);

        this.#getPosicioActual().then(() => {
            this.mostrarPuntInicial();
        });
    }

    mostrarPuntInicial() {
        if (this.#currentLat && this.#currentLon) {
            this.#map.setView([this.#currentLat, this.#currentLon], 13);
            this.mostrarPunt(this.#currentLat, this.#currentLon, "Estàs aquí");
        }
    }

    actualitzarPosInitMapa(lat, lon) {
        this.#map.setView([lat, lon], 13);
    }

    mostrarPunt(lat, long, desc = "") {
        const marker = L.marker([lat, long]).addTo(this.#map);
        if (desc) {
            marker.bindPopup(desc).openPopup();
        }
        this.#markers.push(marker);
    }

    borrarPunt() {
        this.#markers.forEach(marker => this.#map.removeLayer(marker));
        this.#markers = [];
    }

    async #getPosicioActual() {
        return new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        this.#currentLat = position.coords.latitude;
                        this.#currentLon = position.coords.longitude;
                        resolve();
                    },
                    (error) => {
                        console.error("Error en la geolocalización:", error);
                        reject(error);
                    }
                );
            } else {
                console.error("La geolocalización no está disponible en este navegador.");
                reject(new Error("Geolocalització no disponible"));
            }
        });
    }
}