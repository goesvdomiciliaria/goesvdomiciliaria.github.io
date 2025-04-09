let map;
let marker;
let adminMap;
let adminMarkers = [];

function initMap() {
    // Inicializar mapa del formulario
    map = L.map('map').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
}

function initAdminMap() {
    // Inicializar mapa administrativo solo si existe el elemento
    const adminMapElement = document.getElementById('admin-map');
    if (adminMapElement && !adminMap) {
        adminMap = L.map('admin-map').setView([0, 0], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(adminMap);

        // Forzar un reajuste del mapa después de la inicialización
        setTimeout(() => {
            adminMap.invalidateSize();
        }, 100);
    }
}

function updateMap(position) {
    if (!map) {
        initMap();
    }
    
    if (marker) {
        map.removeLayer(marker);
    }

    if (position && position.lat && position.lng) {
        map.setView([position.lat, position.lng], 15);
        marker = L.marker([position.lat, position.lng]).addTo(map);
    }
}

function agregarMarcadorAdmin(registro) {
    if (!adminMap) {
        initAdminMap();
    }

    try {
        const lat = parseFloat(registro.latitud);
        const lng = parseFloat(registro.longitud);
        
        if (!isNaN(lat) && !isNaN(lng)) {
            const marker = L.marker([lat, lng])
                .bindPopup(`
                    <strong>${registro.nombre || 'Sin nombre'}</strong><br>
                    ${registro.direccion || 'Sin dirección'}<br>
                    <small>${new Date(registro.fecha).toLocaleString('es-ES')}</small>
                `, {
                    autoPan: true
                });
            
            adminMarkers.push(marker);
            marker.addTo(adminMap);
        }
    } catch (error) {
        console.error('Error al agregar marcador:', error);
    }
}

// Limpiar marcadores del mapa administrativo
function limpiarMarcadoresAdmin() {
    if (adminMap) {
        adminMarkers.forEach(marker => adminMap.removeLayer(marker));
        adminMarkers = [];
    }
}

// Ajustar la vista del mapa administrativo para mostrar todos los marcadores
function ajustarVistaMarcadores() {
    if (adminMap && adminMarkers.length > 0) {
        const group = new L.featureGroup(adminMarkers);
        adminMap.fitBounds(group.getBounds().pad(0.1));
    }
}

// Inicializar mapa del formulario cuando se carga la página
document.addEventListener('DOMContentLoaded', initMap); 