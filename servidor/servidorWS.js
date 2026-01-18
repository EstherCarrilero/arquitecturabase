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
            
            socket.on("posicionJugador", function(datos){
                // Reenviar la posición del jugador a los demás en la sala
                socket.broadcast.to(datos.codigo).emit("actualizacionJuego", {
                    x: datos.x,
                    y: datos.y
                });
            });
            
            socket.on("puntuacionJugador", function(datos){
                // Reenviar la puntuación del jugador a los demás en la sala
                socket.broadcast.to(datos.codigo).emit("actualizacionPuntuacion", {
                    puntuacion: datos.puntuacion
                });
            });
            
            socket.on("recogerMoneda", function(datos){
                // Reenviar qué moneda fue recogida a los demás en la sala
                socket.broadcast.to(datos.codigo).emit("monedaRecogida", {
                    monedaId: datos.monedaId
                });
            });
            
            socket.on("eliminarGoomba", function(datos){
                // Reenviar qué Goomba fue eliminado a los demás en la sala
                socket.broadcast.to(datos.codigo).emit("goombaEliminado", {
                    goombaId: datos.goombaId
                });
            });
            
            socket.on("cambiarEstadoKoopa", function(datos){
                // Reenviar cambio de estado de Koopa a los demás en la sala
                socket.broadcast.to(datos.codigo).emit("koopaEstadoCambiado", {
                    koopaId: datos.koopaId,
                    estado: datos.estado,
                    velocidad: datos.velocidad
                });
            });
            
            socket.on("cambiarEstadoGrande", function(datos){
                // Reenviar cambio de estado grande/pequeño a los demás en la sala
                socket.broadcast.to(datos.codigo).emit("estadoGrandeCambiado", {
                    grande: datos.grande
                });
            });
            
            socket.on("recogerChampinon", function(datos){
                // Reenviar qué champiñón fue recogido a los demás en la sala
                socket.broadcast.to(datos.codigo).emit("champinonRecogido", {
                    champinonId: datos.champinonId
                });
            });
            
            socket.on("romperBloque", function(datos){
                // Reenviar qué bloque fue roto a los demás en la sala
                socket.broadcast.to(datos.codigo).emit("bloqueRoto", {
                    bloqueId: datos.bloqueId
                });
            });
            
            socket.on("golpearBloquePregunta", function(datos){
                // Reenviar qué bloque de pregunta fue golpeado a los demás en la sala
                // Incluir monedaId si viene en el payload para mantener sincronización
                let payload = {
                    bloqueId: datos.bloqueId,
                    contenido: datos.contenido,
                    x: datos.x,
                    y: datos.y
                };
                if (typeof datos.monedaId !== 'undefined') payload.monedaId = datos.monedaId;

                socket.broadcast.to(datos.codigo).emit("bloquePreguntaGolpeado", payload);
            });
            
            socket.on("actualizarVidas", function(datos){
                // Reenviar las vidas del jugador a los demás en la sala
                socket.broadcast.to(datos.codigo).emit("vidasActualizadas", {
                    vidas: datos.vidas
                });
            });

            socket.on("jugadorMuerto", function(datos){
                // Reenviar evento de jugador muerto a los demás en la sala
                socket.broadcast.to(datos.codigo).emit("jugadorMuerto", {
                    codigo: datos.codigo
                });
            });
            
            socket.on("jugadorLlegoMeta", function(datos){
                // Reenviar evento de jugador llegando a meta a los demás en la sala
                // Incluir puntos si vienen en el payload
                let payload = {
                    codigo: datos.codigo
                };
                if (typeof datos.puntos !== 'undefined') payload.puntos = datos.puntos;
                
                socket.broadcast.to(datos.codigo).emit("jugadorLlegoMeta", payload);
            });
            
            socket.on("nivelSeleccionado", function(datos){
                // El creador seleccionó un nivel - almacenarlo en la partida
                console.log("Nivel seleccionado para partida", datos.codigo + ":", datos.nivel);
                let partida = sistema.partidas[datos.codigo];
                if (partida) {
                    partida.nivelSeleccionado = datos.nivel || 1;
                }
            });
            
            socket.on("jugadorListo", function(datos){
                console.log("Jugador listo recibido - Email:", datos.email, "Código:", datos.codigo);
                
                // Obtener la partida del sistema
                let partida = sistema.partidas[datos.codigo];
                
                if (partida) {
                    // Inicializar el objeto de estados listos si no existe
                    if (!partida.jugadoresListos) {
                        partida.jugadoresListos = [];
                    }
                    
                    // Marcar este jugador como listo (si no está ya)
                    if (!partida.jugadoresListos.includes(datos.email)) {
                        partida.jugadoresListos.push(datos.email);
                        console.log("Jugadores listos en partida", datos.codigo + ":", partida.jugadoresListos.length, "de", partida.jugadores.length);
                    }
                    
                    // Verificar si todos los jugadores están listos
                    if (partida.jugadoresListos.length === partida.jugadores.length) {
                        console.log("¡Ambos jugadores listos! Iniciando juego para partida:", datos.codigo);
                        // Emitir a TODOS en la sala (incluyendo el que envió) con el nivel seleccionado
                        io.to(datos.codigo).emit("iniciarJuegoAhora", {
                            codigo: datos.codigo,
                            nivel: partida.nivelSeleccionado || 1
                        });
                        // Resetear el estado de listos para futuros usos
                        partida.jugadoresListos = [];
                    }
                }
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