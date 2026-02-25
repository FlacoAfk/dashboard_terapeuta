const PASSWORD_MIN_LENGTH = 10;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/;

function isValidPassword(password) {
    if (typeof password !== 'string') return false;
    return PASSWORD_REGEX.test(password);
}

function getPasswordPolicyMessage() {
    return 'La contraseña debe tener mínimo 10 caracteres, incluir mayúsculas, minúsculas, números y símbolos (@$!%*?&)';
}

module.exports = {
    PASSWORD_MIN_LENGTH,
    PASSWORD_REGEX,
    isValidPassword,
    getPasswordPolicyMessage
};