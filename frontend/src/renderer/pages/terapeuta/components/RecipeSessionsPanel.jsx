import React from 'react';

const RecipeSessionsPanel = ({
    Icons,
    recipeExpanded,
    setRecipeExpanded,
    recipeSessions,
    inProgressRecipeSession,
    getRemainingMinutes,
    handleCloseRecipeSession,
    paginatedRecipeSessions,
    getRecipeName,
    getSessionStatusBadge,
    getSessionStatusLabel,
    formatDateTime,
    totalRecipePages,
    recipeCurrentPage,
    setRecipeCurrentPage,
    recipeSessionsPerPage
}) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <button
                type="button"
                onClick={() => setRecipeExpanded((prev) => !prev)}
                className="inline-flex items-center gap-2 text-left group"
                title={recipeExpanded ? 'Comprimir registros' : 'Desplegar registros'}
            >
                <Icons.Sesiones />
                <span className="text-sm font-semibold text-gray-900">Registro de sesiones de receta</span>
                <svg
                    className={`w-4 h-4 text-gray-500 transition-transform ${recipeExpanded ? 'rotate-180' : 'rotate-0'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            <span className="text-xs text-gray-500">{recipeSessions.length} total</span>
        </div>

        {recipeExpanded ? (
            <div className="px-4 py-3 space-y-3">
                {inProgressRecipeSession && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">Sesión en curso</p>
                                <p className="text-xs text-amber-700 mt-1">
                                    {inProgressRecipeSession.status === 'CREATED'
                                        ? `Si no inicia en VR se cerrará automáticamente en ${getRemainingMinutes(inProgressRecipeSession.created_at)} min.`
                                        : 'La sesión ya fue iniciada desde el videojuego.'}
                                </p>
                            </div>
                            <button
                                onClick={() => handleCloseRecipeSession(inProgressRecipeSession.id)}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                            >
                                Finalizar desde dashboard
                            </button>
                        </div>
                    </div>
                )}

                {recipeSessions.length === 0 ? (
                    <div className="text-sm text-gray-500 py-6 text-center">Aún no hay sesiones de receta registradas.</div>
                ) : (
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                        <table className="w-full text-xs">
                            <thead className="bg-gray-50">
                                <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-200">
                                    <th className="py-2 px-3">Participante</th>
                                    <th className="py-2 px-3">Receta</th>
                                    <th className="py-2 px-3">Token</th>
                                    <th className="py-2 px-3">Estado</th>
                                    <th className="py-2 px-3">Creada</th>
                                    <th className="py-2 px-3">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedRecipeSessions.map((session) => (
                                    <tr key={session.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/70">
                                        <td className="py-2 px-3 font-medium text-gray-800">{session.participant_code}</td>
                                        <td className="py-2 px-3 text-gray-700">{getRecipeName(session.recipe_id)}</td>
                                        <td className="py-2 px-3 font-mono font-semibold text-[#2AA87E]">{session.start_token}</td>
                                        <td className="py-2 px-3">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getSessionStatusBadge(session.status)}`}>
                                                {getSessionStatusLabel(session.status)}
                                            </span>
                                        </td>
                                        <td className="py-2 px-3 text-gray-600 whitespace-nowrap">{formatDateTime(session.created_at)}</td>
                                        <td className="py-2 px-3">
                                            {['CREATED', 'ACTIVE'].includes(session.status) ? (
                                                <button
                                                    onClick={() => handleCloseRecipeSession(session.id)}
                                                    className="text-xs px-2.5 py-1 rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                                                >
                                                    Finalizar
                                                </button>
                                            ) : (
                                                <span className="text-xs text-gray-400">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {totalRecipePages > 1 && (
                            <div className="pt-2 flex items-center justify-between text-xs text-gray-500">
                                <span>
                                    Mostrando {((recipeCurrentPage - 1) * recipeSessionsPerPage) + 1}-
                                    {Math.min(recipeCurrentPage * recipeSessionsPerPage, recipeSessions.length)} de {recipeSessions.length}
                                </span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setRecipeCurrentPage((prev) => Math.max(1, prev - 1))}
                                        disabled={recipeCurrentPage === 1}
                                        className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                                    >
                                        Anterior
                                    </button>
                                    <span className="px-2 py-1">{recipeCurrentPage}/{totalRecipePages}</span>
                                    <button
                                        onClick={() => setRecipeCurrentPage((prev) => Math.min(totalRecipePages, prev + 1))}
                                        disabled={recipeCurrentPage === totalRecipePages}
                                        className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        ) : (
            <div className="px-4 py-3 text-xs text-gray-500 bg-gray-50">
                Registros ocultos. Haz clic en el encabezado para desplegar.
            </div>
        )}
    </div>
);

export default RecipeSessionsPanel;
