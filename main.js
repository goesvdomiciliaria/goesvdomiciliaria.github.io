let currentPosition = null;
const SCRIPT_ID = 'AKfycbxdtSDbHYnXMOKI5RjV0qQDaAwPd_YQ5k5y_OocaG1S'; // ID del script de Google Apps Script desplegado

// Configuración del acceso administrativo
const ADMIN_PASSWORD = '123456'; // Cambia esto por una contraseña segura

// Agregar al inicio del archivo, después de las variables globales
let nombresLista = [];
let unidadesLista = [];

// Función para generar un nombre de callback único
function generateCallback() {
    return 'callback_' + Date.now();
}

// Función para realizar llamadas a Google Apps Script
function callGoogleScript(action, params) {
    return new Promise((resolve, reject) => {
        const callbackName = generateCallback();
        window[callbackName] = function(response) {
            delete window[callbackName];
            resolve(response);
        };

        const script = document.createElement('script');
        const url = new URL(`https://script.google.com/macros/s/${SCRIPT_ID}/exec`);
        url.searchParams.append('action', action);
        url.searchParams.append('callback', callbackName);
        
        for (let key in params) {
            url.searchParams.append(key, params[key]);
        }

        script.src = url.toString();
        document.body.appendChild(script);
        script.onerror = reject;
    });
}

// Manejador del formulario
document.getElementById('visitaForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        fecha: new Date().toISOString(),
        nombre: document.getElementById('nombre').value.trim(),
        unidad: document.getElementById('unidad').value.trim(),
        direccion: document.getElementById('direccion').value.trim(),
        latitud: currentPosition ? currentPosition.lat.toString() : '',
        longitud: currentPosition ? currentPosition.lng.toString() : '',
        observaciones: document.getElementById('observaciones').value.trim(),
        foto: document.getElementById('preview-container').getAttribute('data-url') || ''
    };

    try {
        const response = await callGoogleScript('guardarRegistro', formData);
        if (response.success) {
            alert('Registro guardado exitosamente');
            document.getElementById('visitaForm').reset();
            document.getElementById('preview-container').innerHTML = '';
            currentPosition = null;
            updateMap({lat: 0, lng: 0}); // Reset del mapa
        } else {
            throw new Error('Error al guardar el registro');
        }
    } catch (error) {
        console.error('Error al guardar:', error);
        alert('Error al guardar el registro');
    }
});

// Obtener ubicación actual
document.getElementById('ubicacionBtn').addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                currentPosition = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                updateMap(currentPosition);
            },
            (error) => {
                console.error('Error obteniendo ubicación:', error);
                alert('No se pudo obtener la ubicación');
            }
        );
    } else {
        alert('Geolocalización no soportada en este navegador');
    }
});

// Configuración del acceso administrativo
document.getElementById('admin-access').addEventListener('click', () => {
    document.getElementById('login-modal').classList.add('active');
});

document.getElementById('login-btn').addEventListener('click', () => {
    const password = document.getElementById('admin-password').value;
    if (password === ADMIN_PASSWORD) {
        document.getElementById('registro-form').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        document.getElementById('login-modal').classList.remove('active');
        loadAdminData();
    } else {
        alert('Contraseña incorrecta');
    }
});

// Función para cargar datos en el panel administrativo
async function loadAdminData() {
    try {
        // Inicializar el mapa administrativo
        initAdminMap();
        
        // Limpiar marcadores existentes
        limpiarMarcadoresAdmin();

        const response = await callGoogleScript('obtenerRegistros', {});
        if (response.registros) {
            const tbody = document.querySelector('#registros-tabla tbody');
            tbody.innerHTML = '';
            
            response.registros.forEach(registro => {
                try {
                    // Formatear la fecha correctamente
                    const fechaObj = new Date(registro.fecha);
                    const fecha = !isNaN(fechaObj) ? fechaObj.toLocaleString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }) : 'Fecha no válida';

                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${fecha}</td>
                        <td>${registro.nombre || 'No especificado'}</td>
                        <td>${registro.unidad || 'No especificado'}</td>
                        <td>${registro.direccion || 'No especificado'}</td>
                        <td>
                            <button class="ver-detalles-btn" type="button">Ver detalles</button>
                        </td>
                    `;

                    // Agregar event listener al botón
                    const btnDetalles = tr.querySelector('.ver-detalles-btn');
                    btnDetalles.addEventListener('click', () => mostrarDetalles(registro));

                    tbody.appendChild(tr);

                    // Si tiene coordenadas, agregar marcador al mapa administrativo
                    if (registro.latitud && registro.longitud) {
                        agregarMarcadorAdmin(registro);
                    }
                } catch (err) {
                    console.error('Error al procesar registro:', err);
                }
            });

            // Ajustar la vista después de agregar todos los marcadores
            setTimeout(() => {
                ajustarVistaMarcadores();
            }, 200);
        }
    } catch (error) {
        console.error('Error al cargar datos:', error);
        alert('Error al cargar los registros');
    }
}

// Nueva función para mostrar detalles
function mostrarDetalles(registro) {
    try {
        console.log('Mostrando detalles del registro:', registro);

        const fechaObj = new Date(registro.fecha);
        const fechaFormateada = !isNaN(fechaObj) ? 
            fechaObj.toLocaleString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : 'Fecha no disponible';

        // Centrar el mapa en la ubicación del registro
        if (registro.latitud && registro.longitud) {
            const lat = parseFloat(registro.latitud);
            const lng = parseFloat(registro.longitud);
            if (!isNaN(lat) && !isNaN(lng)) {
                adminMap.setView([lat, lng], 15);
                adminMarkers.forEach(marker => {
                    const markerLat = marker.getLatLng().lat;
                    const markerLng = marker.getLatLng().lng;
                    if (markerLat === lat && markerLng === lng) {
                        marker.openPopup();
                    }
                });
            }
        }

        const detallesModal = document.createElement('div');
        detallesModal.className = 'modal active';
        
        const coordenadas = registro.latitud && registro.longitud ? 
            `<div class="coordenadas-badge">
                📍 ${registro.latitud}, ${registro.longitud}
            </div>` : '';
        
        const foto = registro.foto ? 
            `<div class="foto-container">
                <img src="${registro.foto}" alt="Foto de la visita">
            </div>` : '';

        detallesModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Detalles de la Visita</h3>
                </div>
                <div class="modal-body">
                    <div class="modal-info-grid">
                        <div class="info-item">
                            <strong>Fecha y Hora</strong>
                            <p>${fechaFormateada}</p>
                        </div>
                        <div class="info-item">
                            <strong>Nombre</strong>
                            <p>${registro.nombre || 'No especificado'}</p>
                        </div>
                        <div class="info-item">
                            <strong>Unidad</strong>
                            <p>${registro.unidad || 'No especificada'}</p>
                        </div>
                        <div class="info-item">
                            <strong>Dirección</strong>
                            <p>${registro.direccion || 'No especificada'}</p>
                        </div>
                    </div>
                    ${coordenadas}
                    ${foto}
                    <div class="info-item">
                        <strong>Observaciones</strong>
                        <p>${registro.observaciones || 'Sin observaciones'}</p>
                    </div>
                    <div class="info-item registrado-por">
                        <strong>Registrado por</strong>
                        <p>${registro.registradoPor || 'No especificado'}</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="cerrar-modal">Cerrar</button>
                </div>
            </div>
        `;

        document.body.appendChild(detallesModal);

        const btnCerrar = detallesModal.querySelector('.cerrar-modal');
        btnCerrar.addEventListener('click', () => {
            detallesModal.classList.remove('active');
            setTimeout(() => detallesModal.remove(), 300);
        });

    } catch (error) {
        console.error('Error al mostrar detalles:', error);
        alert('Error al mostrar los detalles del registro');
    }
}

// Eliminar la función global verDetallesRegistro ya que no la necesitamos más
if (window.verDetallesRegistro) {
    delete window.verDetallesRegistro;
}

// Función para cargar las matrices
async function cargarMatrices() {
    try {
        const response = await callGoogleScript('obtenerMatrices', {});
        if (response.success) {
            nombresLista = response.nombres;
            unidadesLista = response.unidades;
            
            // Llenar los datalists
            const nombresDatalist = document.getElementById('nombres-list');
            const unidadesDatalist = document.getElementById('unidades-list');
            
            nombresDatalist.innerHTML = nombresLista
                .map(nombre => `<option value="${nombre}">`)
                .join('');
                
            unidadesDatalist.innerHTML = unidadesLista
                .map(unidad => `<option value="${unidad}">`)
                .join('');
                
            // También actualizar el select del filtro de unidades en el panel admin
            const unidadFiltro = document.getElementById('unidad-filtro');
            unidadFiltro.innerHTML = '<option value="">Todas las unidades</option>' +
                unidadesLista.map(unidad => `<option value="${unidad}">${unidad}</option>`).join('');
        }
    } catch (error) {
        console.error('Error al cargar matrices:', error);
    }
}

// Modificar el evento DOMContentLoaded para incluir la carga de matrices
document.addEventListener('DOMContentLoaded', () => {
    cargarMatrices();
    // ... resto del código existente
});

// Agregar validación para los campos de entrada
document.getElementById('nombre').addEventListener('change', function() {
    const valor = this.value.trim();
    if (!nombresLista.includes(valor)) {
        this.setCustomValidity('Por favor seleccione un nombre de la lista');
    } else {
        this.setCustomValidity('');
    }
});

document.getElementById('unidad').addEventListener('change', function() {
    const valor = this.value.trim();
    if (!unidadesLista.includes(valor)) {
        this.setCustomValidity('Por favor seleccione una unidad de la lista');
    } else {
        this.setCustomValidity('');
    }
}); 
