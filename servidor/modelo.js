const datos=require("./cad.js"); 
const correo=require("./email.js");
const bcrypt = require("bcrypt");

function Sistema(test){ 
    this.usuarios={}; 
    this.cad=new datos.CAD();

    if (!test.test) {
    this.cad.conectar(function(db){ 
        console.log("Conectado a Mongo Atlas"); 
    }); 
    }

    this.usuarioGoogle=function(usr,callback){ 
        this.cad.buscarOCrearUsuario(usr,function(obj){ 
            callback(obj); 
        }); 
    } 

    this.agregarUsuario=function(nick){ 
        let res={"nick":-1};
        if (!this.usuarios[nick]){
        this.usuarios[nick]=new Usuario(nick);
        res.nick=nick;
        }
        else{
            console.log("el nick "+nick+" está en uso");
        }
        return res;
    } 

    this.obtenerUsuarios=function(){
        return this.usuarios;
    }

    this.usuarioActivo=function(nick){
        let res={"res":false};
        if (this.usuarios[nick]){
            res.res=true;
        }
        return res;
    }

    this.eliminarUsuario=function(nick){
        let res={"nick":-1};
        if (this.usuarios[nick]){
            delete this.usuarios[nick];
            res.nick=nick;
        }
        return res;
    }

    this.numeroUsuarios=function(){
        let res = {"num":0};
        res.num = Object.keys(this.usuarios).length;
        return res;
    }

    this.registrarUsuario=function(obj,callback){ 
        let modelo=this; 
        
        // Validar que tenga los campos obligatorios
        if (!obj.email || !obj.password || !obj.nombre || !obj.apellidos){
            return callback({"email": -1, error: "Faltan campos obligatorios"});
        }
        
        // Buscar si el usuario ya existe por email
        this.cad.buscarUsuario({email: obj.email}, async function(usr){ 
            if (!usr){ 
                const hash = await bcrypt.hash(obj.password, 10); 
                // Preparar el objeto usuario con todos los campos
                const nuevoUsuario = {
                    email: obj.email,
                    password: hash, // En producción deberías hashear con bcrypt
                    nombre: obj.nombre,
                    apellidos: obj.apellidos,
                    nick: obj.email,
                    key: Date.now().toString(),
                    confirmada: false
                };
                
                modelo.cad.insertarUsuario(nuevoUsuario, function(res){ 
                    if (res) {
                        console.log("Usuario registrado correctamente:", res.email);
                        
                        // Enviar email de confirmación
                        correo.enviarEmail(nuevoUsuario.email, nuevoUsuario.key, "Confirmar cuenta")
                            .catch((err) => {
                                console.error("Error al enviar correo:", err);
                            });
                        
                        callback(res); 
                    } else {
                        callback({"email": -1, error: "Error al insertar en BD"});
                    }
                });
            } 
            else { 
                console.log("El usuario ya existe:", obj.email);
                callback({"email": -1, error: "Usuario ya existe"}); 
            } 
        }); 
    }

    this.iniciarSesion=function(obj, callback){ 
        let modelo=this; 
        
        // Validar que tenga los campos obligatorios
        if (!obj.email || !obj.password){
            return callback({"nick": -1, error: "Faltan email o contraseña"});
        }
        
        // Buscar usuario por email
        this.cad.buscarUsuario({email: obj.email, confirmada: true}, async function(usr){ 
            if (usr){ 
                // Usuario encontrado, verificar contraseña con bcrypt
                const passwordValida = await bcrypt.compare(obj.password, usr.password);
                if (passwordValida){
                    console.log("Login exitoso:", usr.email);
                    callback({
                        nick: usr.email,
                        email: usr.email,
                        nombre: usr.nombre,
                        apellidos: usr.apellidos
                    }); 
                } else {
                    console.log("Contraseña incorrecta para:", obj.email);
                    callback({"nick": -1, error: "Contraseña incorrecta"}); 
                }
            } 
            else { 
                console.log("Usuario no encontrado:", obj.email);
                callback({"nick": -1, error: "Usuario no encontrado"}); 
            } 
        }); 
    }

    this.confirmarUsuario=function(obj,callback){ 
        let modelo=this; 
        this.cad.buscarUsuario({"email":obj.email,"confirmada":false,"key":obj.key},function(usr){ 
            if (usr){ 
                usr.confirmada=true; 
                modelo.cad.actualizarUsuario(usr,function(res){ 
                    callback({"email":res.email}); //callback(res) 
                }) 
            } 
            else 
            { 
                callback({"email":-1}); 
            } 
        }) 
    } 
}

function Usuario(nick){ 
    this.nick=nick; 
} 

module.exports.Sistema=Sistema;