
import React, { useState } from 'react';
import TherapistLayout from '../../components/layout/TherapistLayout';
import { useAuth } from '../../context/AuthContext';
import EditarTerapeutaModal from '../../components/modals/EditarTerapeutaModal';
import therapistService from '../../services/therapistService';

/**
 * Página de Configuración / Perfil del Terapeuta
 */
const ConfiguracionTerapeuta = () => {
    const { user, login } = useAuth(); // Usamos login para actualizar el estado del usuario si es necesario (o un reload)
    const [showEditModal, setShowEditModal] = useState(false);
    const [message, setMessage] = useState(null);

    // El objeto 'user' del contexto tiene la info básica del token/login.
    // Para edición completa, idealmente tendríamos todo el objeto terapeuta.
    // Vamos a construir un objeto 'therapist' compatible con el modal.
    const currentTherapist = {
        id: user.id, // El ID del usuario en la tabla usuarios (que es lo que usa el endpoint PUT /api/usuarios/:id)
        nombre: user.nombre,
        correo: user.email,
        usuario: user.email, // El modal usa 'usuario' a veces, pero lo quitamos recientemente.
        // Otros campos si estuvieran en el user context...
    };

    const handleUpdate = async (updateData) => {
        try {
            // updateData trae: id, nombre, correo, (password). 
            // Llamamos al servicio. Nota: therapistService.update usa /api/usuarios/:id
            const result = await therapistService.update(currentTherapist.id, updateData);

            if (result.success) {
                setMessage({ type: 'success', text: 'Información actualizada correctamente. Los cambios se reflejarán en el próximo inicio de sesión.' });
                // Opcional: Podríamos intentar recargar el usuario del contexto si hubiera un método 'refreshUser'
            } else {
                setMessage({ type: 'error', text: result.error || 'Error al actualizar' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error al actualizar información' });
        }
    };

    return (
        <TherapistLayout>
             <div className="space-y-6">
                <div>
                     <h1 className="text-2xl font-bold text-gray-900">Configuración de Cuenta</h1>
                     <p className="text-gray-500 mt-1">Gestiona tu información personal y seguridad</p>
                </div>

                {message && (
                    <div className={`p-4 rounded-lg border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                {/* Tarjeta de Perfil */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-[#2AA87E] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                {user?.nombre?.charAt(0) || 'T'}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{user?.nombre}</h2>
                                <p className="text-gray-500">{user?.rol}</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setShowEditModal(true)}
                            className="px-4 py-2 bg-white border border-gray-300 shadow-sm text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                        >
                            Editar Perfil
                        </button>
                    </div>
                    
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Nombre Completo</label>
                            <p className="text-gray-900 font-medium">{user?.nombre}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Correo Electrónico</label>
                            <p className="text-gray-900 font-medium">{user?.email}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Rol</label>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {user?.rol}
                            </span>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Estado</label>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Activo
                            </span>
                        </div>
                    </div>
                </div>

                {/* Sección de Seguridad (Informativa, ya que la edición es en el modal) */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 w-full">
                     <h3 className="text-lg font-semibold text-gray-900 mb-4">Seguridad</h3>
                     <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-900 font-medium">Contraseña</p>
                            <p className="text-sm text-gray-500">Puedes cambiar tu contraseña editando tu perfil</p>
                        </div>
                        <button 
                             onClick={() => setShowEditModal(true)}
                             className="text-[#2AA87E] hover:text-[#239469] font-medium text-sm"
                        >
                            Cambiar contraseña
                        </button>
                     </div>
                </div>
             </div>

             {/* Modal de Edición (Reutilizado) */}
             <EditarTerapeutaModal 
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSubmit={handleUpdate}
                therapist={currentTherapist}
             />
        </TherapistLayout>
    );
};

export default ConfiguracionTerapeuta;
