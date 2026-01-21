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

module.exports = {
    verifyConnection,
    sendPasswordResetEmail
};
