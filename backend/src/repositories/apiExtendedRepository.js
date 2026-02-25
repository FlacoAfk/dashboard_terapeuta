const { supabase } = require('../config/supabase');

async function getAssignedPatientIdsForTherapist(therapistId) {
    const { data, error } = await supabase
        .from('terapeuta_paciente')
        .select('id_paciente')
        .eq('id_terapeuta', therapistId);

    if (error) throw error;
    return (data || []).map((item) => item.id_paciente);
}

function buildVrSessionsQuery(limit) {
    return supabase
        .from('vr_session_results')
        .select(`
            id,
            participant_id,
            activity_id,
            started_at,
            ended_at,
            total_seconds,
            summary_total_errors,
            summary_total_drops,
            summary_total_releases,
            summary_sets_completed,
            id_paciente_vinculado,
            id_terapeuta_revisor,
            observaciones_terapeuta,
            estado_revision,
            created_at
        `)
        .order('created_at', { ascending: false })
        .limit(limit);
}

async function runQuery(query) {
    const { data, error } = await query;
    if (error) throw error;
    return data;
}

async function getPatientsByIds(patientIds) {
    if (!patientIds || patientIds.length === 0) return [];

    const { data, error } = await supabase
        .from('pacientes')
        .select('id, nombre')
        .in('id', patientIds);

    if (error) throw error;
    return data || [];
}

async function getVrSessionById(sessionId) {
    const { data, error } = await supabase
        .from('vr_session_results')
        .select('id, id_paciente_vinculado, participant_id')
        .eq('id', sessionId)
        .single();

    if (error) return null;
    return data;
}

async function getTherapistPatientAssignment(patientId, therapistId) {
    const { data, error } = await supabase
        .from('terapeuta_paciente')
        .select('id_terapeuta')
        .eq('id_paciente', patientId)
        .eq('id_terapeuta', therapistId)
        .single();

    if (error) return null;
    return data;
}

async function getActivePatientById(patientId) {
    const { data, error } = await supabase
        .from('pacientes')
        .select('id, nombre')
        .eq('id', patientId)
        .eq('activo', true)
        .single();

    if (error) return null;
    return data;
}

async function updateVrSessionById(sessionId, updateData) {
    const { data, error } = await supabase
        .from('vr_session_results')
        .update(updateData)
        .eq('id', sessionId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

async function getPatientById(patientId) {
    const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .eq('id', patientId)
        .single();

    if (error) return null;
    return data;
}

async function getTherapistAssignmentByPatient(patientId) {
    const { data, error } = await supabase
        .from('terapeuta_paciente')
        .select('terapeutas(id, nombre)')
        .eq('id_paciente', patientId)
        .single();

    if (error) return null;
    return data;
}

async function getPatientReportSessions(patientId) {
    const { data, error } = await supabase
        .from('vr_session_results')
        .select(`
            id,
            started_at,
            ended_at,
            activity_id,
            total_seconds,
            summary_total_errors,
            summary_total_drops,
            summary_total_releases,
            observaciones_terapeuta,
            estado_revision
        `)
        .eq('id_paciente_vinculado', patientId)
        .order('started_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

async function listTherapistsWithUsers() {
    const { data, error } = await supabase
        .from('terapeutas')
        .select(`
            id,
            nombre,
            especialidad,
            correo,
            telefono,
            id_usuario,
            usuarios(email, activo)
        `)
        .order('nombre');

    if (error) throw error;
    return data || [];
}

async function countPatients() {
    const { count } = await supabase
        .from('pacientes')
        .select('id', { count: 'exact', head: true });
    return count || 0;
}

async function countVrSessions() {
    const { count } = await supabase
        .from('vr_session_results')
        .select('id', { count: 'exact', head: true });
    return count || 0;
}

async function countTherapists() {
    const { count } = await supabase
        .from('terapeutas')
        .select('id', { count: 'exact', head: true });
    return count || 0;
}

async function listActivityIds() {
    const { data, error } = await supabase
        .from('vr_session_results')
        .select('activity_id');

    if (error) throw error;
    return (data || []).map((item) => item.activity_id);
}

async function listRecentSessions(limit = 5) {
    const { data, error } = await supabase
        .from('vr_session_results')
        .select('id, activity_id, participant_id, started_at, total_seconds, summary_total_errors')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data || [];
}

module.exports = {
    getAssignedPatientIdsForTherapist,
    buildVrSessionsQuery,
    runQuery,
    getPatientsByIds,
    getVrSessionById,
    getTherapistPatientAssignment,
    getActivePatientById,
    updateVrSessionById,
    getPatientById,
    getTherapistAssignmentByPatient,
    getPatientReportSessions,
    listTherapistsWithUsers,
    countPatients,
    countVrSessions,
    countTherapists,
    listActivityIds,
    listRecentSessions
};
