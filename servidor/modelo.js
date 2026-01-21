const datos=require("./cad.js"); 
const correo=require("./email.js");
const bcrypt = require("bcrypt");

function Sistema(test){ 
    this.usuarios={}; 
    this.partidas={}; 
    this.cad=new datos.CAD();
    this.dbReady = false;
    this.dbReadyCallbacks = [];

    if (!test.test) {
        let sistema = this;
        this.cad.conectar(function(db){ 
            if (db) {
                console.log("Conectado a Mongo Atlas"); 
                sistema.dbReady = true;
                // Ejecutar callbacks pendientes
                sistema.dbReadyCallbacks.forEach(cb => cb());
                sistema.dbReadyCallbacks = [];
            } else {
                console.error("ERROR: No se pudo conectar a Mongo Atlas");
            }
        }); 
    }

    this.whenDbReady = function(callback) {
        if (this.dbReady) {
            callback();
        } else {
            this.dbReadyCallbacks.push(callback);
        }
    }

    this.usuarioGoogle=function(usr,callback){ 
        let sistema = this;
        this.whenDbReady(function() {
            sistema.cad.buscarOCrearUsuario(usr,function(obj){ 
                callback(obj); 
            });
        });
    } 

    this.agregarUsuario=function(nick){ 
        let res={"nick":-1};
        // Si se pasa un objeto Usuario, extraer el nick
        let nickStr = (typeof nick === 'object' && nick.nick) ? nick.nick : nick;
        let usuario = (typeof nick === 'object') ? nick : new Usuario(nick);
        
        if (!this.usuarios[nickStr]){
            this.usuarios[nickStr]=usuario;
            res.nick=nickStr;
        }
        else{
            console.log("el nick "+nickStr+" está en uso");
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

    this.obtenerCodigo=function(){
        let codigo = "";
        const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        const longitud = 6;
        
        do {
            codigo = "";
            for (let i = 0; i < longitud; i++) {
                codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
            }
        } while (this.partidas[codigo]); // Repetir si el código ya existe
        
        return codigo;
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

    this.crearPartida=function(email, callback){ 
        let modelo = this;
        
        // Buscar el usuario en la base de datos
        this.whenDbReady(function() {
            modelo.cad.buscarUsuario({email: email}, function(usuario) {
                if (usuario) {
                    // Obtener un código único
                    let codigo = modelo.obtenerCodigo();
                    
                    // Crear partida con ese código
                    let partida = new Partida(codigo);
                    
                    // Asignar al usuario como jugador de la partida
                    partida.jugadores.push({
                        email: usuario.email,
                        nick: usuario.nick || usuario.email,
                        nombre: usuario.nombre
                    });
                    
                    // Guardar la partida en la colección
                    modelo.partidas[codigo] = partida;
                    
                    callback({codigo: codigo});
                } else {
                    console.log("Usuario no encontrado en BD:", email);
                    callback({codigo: -1});
                }
            });
        });
    }

    this.unirAPartida=function(email, codigo, callback){
        let modelo = this;
        
        // Obtener la partida cuyo código es "codigo"
        let partida = this.partidas[codigo];
        
        if (!partida) {
            console.log("Partida no encontrada:", codigo);
            callback({codigo: -1, error: "Partida no encontrada"});
            return;
        }
        
        // Buscar el usuario en la base de datos
        this.whenDbReady(function() {
            modelo.cad.buscarUsuario({email: email}, function(usuario) {
                if (usuario) {
                    // Verificar que la partida no esté llena
                    if (partida.jugadores.length < partida.maxJug) {
                        // Verificar que el usuario no esté ya en la partida
                        let yaEnPartida = partida.jugadores.some(j => j.email === email);
                        if (!yaEnPartida) {
                            // Asignar al usuario a la partida
                            partida.jugadores.push({
                                email: usuario.email,
                                nick: usuario.nick || usuario.email,
                                nombre: usuario.nombre
                            });
                            callback({codigo: codigo});
                        } else {
                            console.log("El usuario ya está en la partida");
                            callback({codigo: -1, error: "Usuario ya en partida"});
                        }
                    } else {
                        console.log("La partida está llena");
                        callback({codigo: -1, error: "Partida llena"});
                    }
                } else {
                    console.log("Usuario no encontrado en BD:", email);
                    callback({codigo: -1, error: "Usuario no encontrado"});
                }
            });
        });
    }

    this.abandonarPartida=function(email, codigo){
        let partida = this.partidas[codigo];
        
        if (!partida) {
            console.log("Partida no encontrada:", codigo);
            return {eliminada: false};
        }
        
        console.log("=== DEBUG abandonarPartida ===");
        console.log("Email que abandona:", email);
        console.log("Código partida:", codigo);
        console.log("Jugadores en partida:", partida.jugadores);
        console.log("Email del creador (jugador[0]):", partida.jugadores[0] ? partida.jugadores[0].email : "N/A");
        
        // Eliminar la partida completamente cuando cualquier jugador la abandona
        const fueCreador = (partida.jugadores.length > 0 && partida.jugadores[0].email === email);
        delete this.partidas[codigo];
        console.log("→ Partida eliminada por abandono (codigo):", codigo, "fueCreador:", fueCreador);
        return {eliminada: true, esCreador: fueCreador};
    }

    this.obtenerPartidasDisponibles=function(){ 
        let lista=[]; 
        for(var e in this.partidas){ 
            let partida = this.partidas[e];
            
            // Comprobar si la partida está disponible (no llena)
            if (partida.jugadores.length < partida.maxJug) {
                // Obtener el email del creador de la partida (primer jugador)
                let emailCreador = partida.jugadores[0] ? partida.jugadores[0].email : "";
                
                // Obtener el código de la partida
                let codigo = partida.codigo;
                
                // Crear un objeto JSON con esos dos datos
                let objetoPartida = {
                    codigo: codigo,
                    creador: emailCreador,
                    jugadores: partida.jugadores.length,
                    maxJugadores: partida.maxJug
                };
                
                // Meter el objeto JSON en el array lista
                lista.push(objetoPartida);
            }
        } 
        return lista; 
    } 
}

function Usuario(data){ 
    if (typeof data === 'string') {
        this.nick = data;
    } else if (typeof data === 'object') {
        this.nick = data.nick;
        this.email = data.email;
        this.nombre = data.nombre;
        this.apellidos = data.apellidos;
    }
} 

module.exports.Sistema=Sistema;

function Partida(codigo){ 
    this.codigo = codigo; 
    this.jugadores = []; 
    this.maxJug = 2; 
} 