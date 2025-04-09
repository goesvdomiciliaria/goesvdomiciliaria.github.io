const cloudinaryWidget = cloudinary.createUploadWidget(
    {
        cloudName: 'dzbg2op4x',
        uploadPreset: 'v.domiciliarias',
        sources: ['camera', 'local'],
        maxFiles: 1,
        maxFileSize: 5000000,
        language: 'es',
        text: {
            es: {
                'local': {
                    'browse': 'Examinar',
                    'dd_title_single': 'Arrastra una foto aquí',
                    'dd_title_multi': 'Arrastra las fotos aquí',
                    'drop_title_single': 'Arrastra una foto para subirla',
                    'drop_title_multi': 'Arrastra las fotos para subirlas'
                }
            }
        },
        styles: {
            palette: {
                window: "#FFFFFF",
                windowBorder: "#E2E8F0",
                tabIcon: "#2c3e50",
                menuIcons: "#2c3e50",
                textDark: "#2D3748",
                textLight: "#FFFFFF",
                link: "#3498db",
                action: "#3498db",
                inactiveTabIcon: "#CBD5E0",
                error: "#e74c3c",
                inProgress: "#3498db",
                complete: "#2ecc71",
                sourceBg: "#F7FAFC"
            },
            fonts: {
                "'Poppins', sans-serif": "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap"
            },
            frame: {
                background: "rgba(0, 0, 0, 0.75)"
            }
        }
    },
    (error, result) => {
        if (!error && result && result.event === "success") {
            const previewContainer = document.getElementById('preview-container');
            previewContainer.innerHTML = `
                <div class="preview-image-container">
                    <img src="${result.info.secure_url}" alt="Imagen subida">
                    <div class="preview-overlay">
                        <button type="button" class="remove-image" onclick="removeImage()">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>`;
            previewContainer.setAttribute('data-url', result.info.secure_url);
        } else if (error) {
            console.error('Error en Cloudinary:', error);
            alert('Error al subir la imagen');
        }
    }
);

// Función para eliminar la imagen
window.removeImage = function() {
    const previewContainer = document.getElementById('preview-container');
    previewContainer.innerHTML = '';
    previewContainer.removeAttribute('data-url');
};

// Mejorar el botón de subida de fotos
document.getElementById('foto').addEventListener('click', (e) => {
    e.preventDefault();
    cloudinaryWidget.open();
}); 