const nodemailer = require('nodemailer'); 
const url = process.env.APP_URL || "http://localhost:3000/"; 
 
const transporter = nodemailer.createTransport({ 
    service: 'gmail', 
    auth: { 
        user: process.env.GMAIL_USER, 
        pass: process.env.GMAIL_PASS 
    } 
}); 
 
//send(); 
 
module.exports.enviarEmail=async function(direccion, key,men) { 
    try {
        // Asegurarse de que la URL tenga la barra final
        const baseUrl = url.endsWith('/') ? url : url + '/';
        const confirmUrl = `${baseUrl}confirmarUsuario/${direccion}/${key}`;
        
        const result = await transporter.sendMail({ 
            from: process.env.GMAIL_USER, 
            to: direccion, 
            subject: men, 
            text: 'Pulsa aquí para confirmar cuenta', 
            html: '<p>Bienvenido a Sistema</p><p><a href="'+confirmUrl+'">Pulsa aquí para confirmar cuenta</a></p>' 
        });
        
        return result;
    } catch (error) {
        console.error('Error al enviar email:', error);
        throw error;
    }
}