/**
 * ========================================
 * SERVICIO DE EMAIL
 * ========================================
 * 
 * Envío de correos usando Nodemailer con Gmail SMTP
 */

const nodemailer = require('nodemailer');

// Crear transporter con configuración de Gmail
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

/**
 * Verificar conexión al servidor SMTP
 */
const verifyConnection = async () => {
    try {
        await transporter.verify();
        console.log('✅ Conexión SMTP verificada');
        return true;
    } catch (error) {
        console.error('❌ Error conectando a SMTP:', error.message);
        return false;
    }
};

/**
 * Enviar email de recuperación de contraseña con link
 * @param {string} to - Email del destinatario
 * @param {string} resetToken - Token de reset
 * @param {string} frontendUrl - URL base del frontend
 */
const sendPasswordResetEmail = async (to, resetToken = null, frontendUrl = 'http://localhost:5173') => {
    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;

    // Generar link de reset si hay token
    const resetLink = resetToken
        ? `${frontendUrl}/reset-password?token=${resetToken}`
        : null;

    const mailOptions = {
        from: fromAddress,
        to: to,
        subject: '🧠 Cerebro al Fuego - Restablecer Contraseña',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #14b8a6;">🧠 Cerebro al Fuego</h1>
                    <p style="color: #666;">Sistema Clínico VR - Gestión de Terapias</p>
                </div>
                
                <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                    <h2 style="color: #374151; margin-top: 0;">Restablecer Contraseña</h2>
                    <p style="color: #4b5563;">
                        Hemos recibido una solicitud para restablecer la contraseña de su cuenta.
                    </p>
                    ${resetLink ? `
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" 
                           style="background: linear-gradient(135deg, #14b8a6, #0d9488); 
                                  color: white; 
                                  padding: 14px 32px; 
                                  text-decoration: none; 
                                  border-radius: 8px; 
                                  font-weight: bold;
                                  display: inline-block;">
                            Restablecer Contraseña
                        </a>
                    </div>
                    <p style="color: #6b7280; font-size: 14px; text-align: center;">
                        O copie y pegue este enlace en su navegador:<br>
                        <a href="${resetLink}" style="color: #14b8a6; word-break: break-all;">${resetLink}</a>
                    </p>
                    ` : `
                    <p style="color: #4b5563;">
                        Por favor contacte al administrador del sistema para completar el proceso.
                    </p>
                    `}
                </div>
                
                <div style="background: #fef3c7; padding: 15px; border-radius: 10px; border-left: 4px solid #f59e0b;">
                    <p style="margin: 0; color: #92400e; font-size: 14px;">
                        <strong>⚠️ Importante:</strong> Este enlace expirará en <strong>1 hora</strong>. 
                        Si usted no solicitó este cambio, puede ignorar este mensaje.
                    </p>
                </div>
                
                <div style="margin-top: 30px; text-align: center; color: #9ca3af; font-size: 12px;">
                    <p>Este es un correo automático, por favor no responda a este mensaje.</p>
                    <p>© 2026 Cerebro al Fuego - Sistema Clínico VR</p>
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`📧 Email enviado a ${to}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`❌ Error enviando email a ${to}:`, error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Enviar código de verificación (6 dígitos)
 * @param {string} to - Destinatario
 * @param {string} code - Código de 6 dígitos
 */
const sendVerificationCodeEmail = async (to, code) => {
    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;

    const mailOptions = {
        from: fromAddress,
        to: to,
        subject: '🔐 Código de Verificación - Cerebro al Fuego',
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #374151;">
                <div style="text-align: center; margin-bottom: 24px;">
                     <h1 style="color: #2AA87E; font-size: 24px; margin: 0;">Cerebro al Fuego</h1>
                     <p style="color: #6B7280; font-size: 14px; margin-top: 4px;">Seguridad de Cuenta</p>
                </div>
                
                <div style="background: #ffffff; padding: 32px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #E5E7EB;">
                    <h2 style="color: #111827; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">
                        Verifica tu identidad
                    </h2>
                    <p style="margin-bottom: 24px; line-height: 1.5;">
                        Para continuar con el cambio de contraseña, por favor ingresa el siguiente código de verificación:
                    </p>
                    
                    <div style="background: #F3F4F6; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px; letter-spacing: 8px;">
                        <span style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: 700; color: #2AA87E;">
                            ${code}
                        </span>
                    </div>

                    <p style="font-size: 14px; color: #6B7280; margin-bottom: 0;">
                        Este código expirará en 15 minutos. Si no solicitaste este cambio, por favor ignora este correo y cambia tu contraseña inmediatamente si sospechas actividad inusual.
                    </p>
                </div>
                
                <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #9CA3AF;">
                    <p>© 2026 Cerebro al Fuego. Todos los derechos reservados.</p>
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`📧 Código enviado a ${to}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`❌ Error enviando código a ${to}:`, error.message);
        return { success: false, error: error.message };
    }
};

module.exports = {
    verifyConnection,
    sendPasswordResetEmail,
    sendVerificationCodeEmail
};
