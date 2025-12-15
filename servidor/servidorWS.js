function WSServer(){ 
    let srv = this;
    
    this.lanzarServer=function(io, sistema){ 
        io.on('connection',function(socket){ 
            console.log("Capa WS activa - Socket ID:", socket.id);
            
            // Enviar lista de partidas disponibles al conectarse
            let lista = sistema.obtenerPartidasDisponibles();
            srv.enviarAlRemitente(socket, "listaPartidas", lista);
            
            socket.on("crearPartida",function(datos){ 
                console.log("Solicitud crearPartida recibida con email:", datos.email);
                sistema.crearPartida(datos.email, function(res) {
                    console.log("Resultado de crearPartida:", res);
                    if (res.codigo != -1){ 
                        socket.join(res.codigo); 
                        srv.enviarAlRemitente(socket,"partidaCreada",{"codigo":res.codigo}); 
                        let lista = sistema.obtenerPartidasDisponibles(); 
                        srv.enviarATodosMenosRemitente(socket,"listaPartidas",lista); 
                    } else {
                        console.log("Error: No se pudo crear la partida para", datos.email);
                        srv.enviarAlRemitente(socket,"partidaCreada",{"codigo":-1, "error":"No se pudo crear la partida"}); 
                    }
                });
            });
            
            socket.on("unirAPartida",function(datos){
                console.log("Solicitud unirAPartida recibida - Email:", datos.email, "Código:", datos.codigo);
                // Pedir a sistema unir a partida
                sistema.unirAPartida(datos.email, datos.codigo, function(res) {
                    console.log("Resultado de unirAPartida:", res);
                    // Unirse al socket si el código no es -1
                    if (res.codigo != -1) {
                        socket.join(res.codigo);
                        // Enviar al remitente "unidoAPartida" y el código
                        srv.enviarAlRemitente(socket, "unidoAPartida", {"codigo": res.codigo});
                        
                        // Notificar a TODOS en la sala (incluyendo el creador) que la partida está completa
                        io.to(res.codigo).emit("partidaCompleta", {"codigo": res.codigo});
                        
                        // Enviar al resto la lista de partidas actualizada
                        let lista = sistema.obtenerPartidasDisponibles();
                        srv.enviarATodosMenosRemitente(socket, "listaPartidas", lista);
                    } else {
                        console.log("Error: No se pudo unir a la partida");
                        srv.enviarAlRemitente(socket, "unidoAPartida", {"codigo": -1, "error": res.error || "No se pudo unir a la partida"});
                    }
                });
            });
            
            socket.on("solicitarLista",function(){
                console.log("Solicitud de lista de partidas recibida");
                let lista = sistema.obtenerPartidasDisponibles();
                srv.enviarAlRemitente(socket, "listaPartidas", lista);
            });
            
            socket.on("abandonarPartida",function(datos){
                console.log("Solicitud abandonarPartida recibida - Email:", datos.email, "Código:", datos.codigo);
                
                let resultado = sistema.abandonarPartida(datos.email, datos.codigo);
                
                if (resultado.eliminada) {
                    // El creador abandonó - eliminar partida
                    // Notificar a los jugadores de esa partida que fue eliminada
                    socket.broadcast.to(datos.codigo).emit("partidaEliminada", {
                        mensaje: "El creador ha abandonado la partida. La partida ha sido eliminada."
                    });
                    
                    // Enviar lista actualizada a todos los clientes
                    let lista = sistema.obtenerPartidasDisponibles();
                    srv.enviarGlobal(io, "listaPartidas", lista);
                } else {
                    // Un jugador no-creador abandonó - notificar SOLO a los demás (el creador)
                    socket.broadcast.to(datos.codigo).emit("jugadorAbandono", {
                        codigo: datos.codigo,
                        mensaje: "Un jugador ha abandonado la partida"
                    });
                    
                    // Enviar lista actualizada a todos los clientes (la partida ahora tiene espacio)
                    let lista = sistema.obtenerPartidasDisponibles();
                    srv.enviarGlobal(io, "listaPartidas", lista);
                }
                
                // Hacer que el socket salga de la sala de esa partida
                socket.leave(datos.codigo);
                console.log("Socket salió de la sala:", datos.codigo);
            });
        }); 
    } 

    this.enviarAlRemitente=function(socket,mensaje,datos){ 
        socket.emit(mensaje,datos); 
    } 

    this.enviarATodosMenosRemitente=function(socket,mens,datos){ 
        socket.broadcast.emit(mens,datos); 
    } 

    this.enviarGlobal=function(io,mens,datos){ 
        io.emit(mens,datos); 
    } 
}

module.exports.WSServer=WSServer; 