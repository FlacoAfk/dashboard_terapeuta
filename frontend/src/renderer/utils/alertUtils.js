import Swal from 'sweetalert2';

/**
 * Muestra una alerta básica
 * @param {'success' | 'error' | 'warning' | 'info' | 'question'} icon - Tipo de icono
 * @param {string} title - Título de la alerta
 * @param {string} text - Texto descriptivo
 */
export const showAlert = (icon, title, text) => {
    return Swal.fire({
        icon,
        title,
        text,
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Aceptar'
    });
};

/**
 * Muestra una alerta de confirmación
 * @param {string} title - Título
 * @param {string} text - Texto descriptivo
 * @param {string} confirmButtonText - Texto del botón de confirmar
 * @param {string} cancelButtonText - Texto del botón de cancelar
 * @returns {Promise<boolean>} - Resolves true si confirma, false si cancela
 */
export const showConfirm = async (
    title,
    text,
    confirmButtonText = 'Sí, confirmar',
    cancelButtonText = 'Cancelar'
) => {
    const result = await Swal.fire({
        title,
        text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText,
        cancelButtonText,
        reverseButtons: true
    });

    return result.isConfirmed;
};

/**
 * Muestra un toast (notificación pequeña)
 * @param {'success' | 'error' | 'warning' | 'info'} icon 
 * @param {string} title 
 */
export const showToast = (icon, title) => {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });

    Toast.fire({
        icon,
        title
    });
};
