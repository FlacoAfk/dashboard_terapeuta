# Seguridad del Proyecto

## ⚠️ Archivos Sensibles

Los siguientes archivos **NUNCA** deben subirse al repositorio:

| Archivo | Contenido |
|---------|-----------|
| `backend/.env` | Credenciales de base de datos y JWT |
| `*.log` | Logs que podrían contener datos sensibles |
| `*_result.json` | Outputs de scripts con datos de usuarios |

## 🔐 Buenas Prácticas

### Credenciales
- Usa `.env.example` como plantilla, **nunca** con valores reales
- Genera un JWT_SECRET único con: `openssl rand -base64 64`
- Usa contraseñas de DB de al menos 20 caracteres

### Contraseñas de Usuario
- Mínimo 10 caracteres
- Debe incluir: mayúsculas, minúsculas, números y símbolos (`@$!%*?&`)
- Nunca hardcodear contraseñas en el código

### Git
- Verifica `.gitignore` antes de cada commit
- Usa `git status` para confirmar qué archivos se subirán
- Si accidentalmente subes credenciales, rótalas inmediatamente

## 🛡️ Características de Seguridad Implementadas

| Característica | Descripción |
|----------------|-------------|
| **JWT** | Tokens con expiración de 24h |
| **bcrypt** | Hash de contraseñas con salt de 12 rounds |
| **RBAC** | Control de acceso basado en roles |
| **Auditoría** | Registro de todas las acciones sensibles |
| **SSL/TLS** | Conexión encriptada a la base de datos |

## 📞 Reporte de Vulnerabilidades

Si encuentras una vulnerabilidad de seguridad, por favor repórtala de forma privada.
