import React, { useState } from 'react';
import vrResultsService from '../../services/vrResultsService';
import VRSessionDetailModal from './VRSessionDetailModal';
import {
    isSessionNeverStarted,
    getActivityDisplayName,
    getDifficultyInfo
} from './vrSessionCardUtils';

const VRSessionCard = ({ session, onSessionUpdated }) => {
    const [showModal, setShowModal] = useState(false);

    const formatDate = (isoDate) => {
        if (!isoDate) return '-';
        const date = new Date(isoDate);
        return date.toLocaleDateString('es-CO', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatTime = (isoDate) => {
        if (!isoDate) return '';
        const date = new Date(isoDate);
        return date.toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const getStatusInfo = () => {
        if (isSessionNeverStarted(session)) {
            return { label: 'No iniciada', color: 'bg-gray-500', icon: '⏸️' };
        }

        const errors = session.summary_total_errors || 0;
        const sets = session.summary_sets_completed || 0;

        if (errors === 0 && sets >= 4) {
            return { label: 'Excelente', color: 'bg-green-500', icon: '🌟' };
        }
        if (errors <= 2) {
            return { label: 'Bueno', color: 'bg-emerald-500', icon: '✓' };
        }
        if (errors <= 5) {
            return { label: 'Regular', color: 'bg-yellow-500', icon: '⚠' };
        }
        return { label: 'Necesita práctica', color: 'bg-red-500', icon: '!' };
    };

    const getReviewBadge = () => {
        if (isSessionNeverStarted(session)) {
            return { label: 'No iniciada', class: 'bg-gray-100 text-gray-700' };
        }

        if (session.estado_revision === 'REVISADA') {
            return { label: 'Revisada', class: 'bg-blue-100 text-blue-700' };
        }
        return { label: 'Pendiente', class: 'bg-orange-100 text-orange-700' };
    };

    const status = getStatusInfo();
    const reviewBadge = getReviewBadge();
    const difficulty = getDifficultyInfo(session.activity_id);

    return (
        <>
            <div
                role="button"
                tabIndex={0}
                onClick={() => setShowModal(true)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowModal(true); } }}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg hover:border-[#2AA87E] transition-all cursor-pointer group"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 ${status.color} rounded-xl flex items-center justify-center text-white text-xl shadow-sm`}>
                            {status.icon}
                        </div>

                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold text-gray-900 group-hover:text-[#2AA87E] transition-colors">
                                    {getActivityDisplayName(session.activity_id)}
                                </h4>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${reviewBadge.class}`}>
                                    {reviewBadge.label}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                    difficulty.color === 'green' ? 'bg-green-100 text-green-700' :
                                        difficulty.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                                            difficulty.color === 'red' ? 'bg-red-100 text-red-700' :
                                                'bg-gray-100 text-gray-700'
                                    }`}>
                                    {difficulty.icon} {difficulty.label}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500">
                                📅 {formatDate(session.started_at)} • {formatTime(session.started_at)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-center hidden sm:block">
                            <p className="text-lg font-bold text-gray-800">{vrResultsService.formatDuration(session.total_seconds)}</p>
                            <p className="text-xs text-gray-500">Duración</p>
                        </div>

                        <div className="text-center hidden sm:block">
                            <p className={`text-lg font-bold ${session.summary_total_errors === 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {session.summary_total_errors || 0}
                            </p>
                            <p className="text-xs text-gray-500">Errores</p>
                        </div>

                        <div className="text-center hidden md:block">
                            <p className="text-lg font-bold text-purple-600">{session.summary_sets_completed || 0}/4</p>
                            <p className="text-xs text-gray-500">Etapas</p>
                        </div>

                        <div className="text-center hidden md:block">
                            <p className="text-lg font-bold text-blue-600">{session.summary_total_drops || 0}</p>
                            <p className="text-xs text-gray-500">Caídas</p>
                        </div>

                        <div className="text-gray-400 group-hover:text-[#2AA87E] transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {showModal && (
                <VRSessionDetailModal
                    session={session}
                    onClose={() => setShowModal(false)}
                    onSessionUpdated={(updated) => {
                        if (onSessionUpdated) onSessionUpdated(updated);
                    }}
                />
            )}
        </>
    );
};

export default VRSessionCard;
