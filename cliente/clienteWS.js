function ClienteWS(){ 
    this.socket=undefined; 
    this.esCreadorPartida = false; // Flag para saber si es creador
    this.ini=function(){ 
        this.socket=io(); 
    }
    this.ini(); 

    this.crearPartida=function(){ 
        // Obtener el email de la cookie de sesión
        let email = $.cookie("nick"); // La cookie guarda el email en "nick"
        console.log("Email obtenido de la cookie:", email);
        if (email) {
            console.log("Enviando solicitud para crear partida con email:", email);
            this.socket.emit("crearPartida",{"email":email}); 
        } else {
            console.log("Debes iniciar sesión para crear una partida");
        }
    } 

    this.unirAPartida=function(codigo){ 
        // Obtener el email de la cookie de sesión
        let email = $.cookie("nick");
        console.log("Intentando unir a partida - Email:", email, "Código:", codigo);
        if (email) {
            this.socket.emit("unirAPartida",{"email":email,"codigo":codigo}); 
        } else {
            console.log("Debes iniciar sesión para unirte a una partida");
        }
    }
    
    this.solicitarLista=function(){
        console.log("Solicitando lista de partidas disponibles");
        this.socket.emit("solicitarLista");
    }
    
    this.abandonarPartida=function(codigo){
        let email = $.cookie("nick");
        console.log("Abandonando partida - Email:", email, "Código:", codigo);
        if (email && codigo) {
            this.socket.emit("abandonarPartida",{"email":email,"codigo":codigo});
        }
    }
    
    this.enviarPosicion=function(datos){
        // Enviar posición del jugador al servidor
        if (datos && datos.codigo) {
            this.socket.emit("posicionJugador", datos);
        }
    }
    
    this.enviarPuntuacion=function(datos){
        // Enviar puntuación del jugador al servidor
        if (datos && datos.codigo) {
            // datos may include both `puntuacion` (monedas) and `puntos` (puntos totales)
            this.socket.emit("puntuacionJugador", datos);
        }
    }
    
    this.enviarMonedaRecogida=function(datos){
        // Enviar ID de moneda recogida al servidor
        if (datos && datos.codigo && datos.monedaId !== undefined) {
            this.socket.emit("recogerMoneda", datos);
        }
    }
    
    this.enviarGoombaEliminado=function(datos){
        // Enviar ID de Goomba eliminado al servidor
        if (datos && datos.codigo && datos.goombaId !== undefined) {
            this.socket.emit("eliminarGoomba", datos);
        }
    }
    
    this.enviarKoopaEstado=function(datos){
        // Enviar cambio de estado de Koopa al servidor
        if (datos && datos.codigo && datos.koopaId !== undefined) {
            this.socket.emit("cambiarEstadoKoopa", datos);
        }
    }
    
    this.enviarEstadoGrande=function(datos){
        // Enviar estado grande/pequeño del jugador al servidor
        if (datos && datos.codigo !== undefined && datos.grande !== undefined) {
            this.socket.emit("cambiarEstadoGrande", datos);
        }
    }
    
    this.enviarChampinonRecogido=function(datos){
        // Enviar ID de champiñón recogido al servidor
        if (datos && datos.codigo && datos.champinonId !== undefined) {
            try { console.log('Emitiendo recogerChampinon ->', datos); } catch(e) {}
            this.socket.emit("recogerChampinon", datos);
        }
    }
    
    this.enviarBloqueRoto=function(datos){
        // Enviar ID de bloque roto al servidor
        if (datos && datos.codigo && datos.bloqueId !== undefined) {
            this.socket.emit("romperBloque", datos);
        }
    }
    
    this.enviarBloqueGolpeado=function(datos){
        // Enviar ID de bloque de pregunta golpeado al servidor
        if (datos && datos.codigo && datos.bloqueId !== undefined) {
            this.socket.emit("golpearBloquePregunta", datos);
        }
    }
    
    this.enviarVidas=function(datos){
        // Enviar vidas del jugador al servidor
        if (datos && datos.codigo !== undefined && datos.vidas !== undefined) {
            try { console.log('Emitiendo actualizarVidas ->', datos); } catch(e) {}
            this.socket.emit("actualizarVidas", datos);
        }
    }

    this.enviarJugadorMuerto = function(datos) {
        // Notificar al servidor que el jugador ha muerto
        if (datos && datos.codigo) {
            this.socket.emit("jugadorMuerto", datos);
        }
    }
    
    this.enviarJugadorLlegoMeta = function(datos) {
        // Notificar al servidor que el jugador llegó a la meta
        if (datos && datos.codigo) {
            this.socket.emit("jugadorLlegoMeta", datos);
        }
    }

    this.enviarVictoriaTimeout = function(datos) {
        // Notificar al servidor que el timeout de victoria se ha disparado
        if (datos && datos.codigo) {
            try { console.log('Enviando victoriaTimeout ->', datos); } catch(e) {}
            this.socket.emit("victoriaTimeout", datos);
        }
    }
    
    this.enviarGameOverExit = function(codigo) {
        // Notificar al servidor que un jugador salió del Game Over
        // El servidor debe eliminar la partida y expulsar a ambos jugadores
        if (codigo) {
            this.socket.emit("gameOverExit", {codigo: codigo});
            console.log("Evento gameOverExit enviado al servidor");
        }
    }
    
    this.enviarNivelSeleccionado = function(codigo, nivel) {
        // Enviar el nivel seleccionado por el creador
        if (codigo && nivel) {
            this.socket.emit("nivelSeleccionado", {codigo: codigo, nivel: nivel});
        }
    }
    
    this.jugadorListo=function(codigo){
        // Enviar señal de que el jugador está listo para comenzar
        let email = $.cookie("nick");
        if (email && codigo) {
            console.log("Enviando señal de jugador listo:", codigo);
            this.socket.emit("jugadorListo", {email: email, codigo: codigo});
        }
    }

    this.socket.on("partidaCreada",function(datos){ 
        console.log("Partida creada con código:", datos.codigo); 
        ws.codigo=datos.codigo;
        ws.esCreadorPartida = true; // Marcar como creador
        if (datos.codigo != -1) {
            cw.mostrarEsperandoRival(datos.codigo);
        } else {
            cw.mostrarMensaje("Error al crear la partida", "danger");
        }
    }); 
    
    this.socket.on("unidoAPartida",function(datos){
        console.log("Unido a partida con código:", datos.codigo);
        ws.codigo=datos.codigo;
        if (datos.codigo != -1) {
            cw.mostrarPartidaCompleta(datos.codigo);
        } else {
            cw.mostrarMensaje(datos.error || "Error al unirse a la partida", "danger");
        }
    });
    
    this.socket.on("listaPartidas",function(lista){
        console.log("Lista de partidas disponibles:", lista);
        cw.mostrarListaPartidas(lista);
    });
    
    this.socket.on("partidaCompleta",function(datos){
        console.log("Partida completa - Código:", datos.codigo);
        ws.codigo = datos.codigo;
        cw.mostrarPartidaCompleta(datos.codigo);
    });
    
    this.socket.on("jugadorAbandono",function(datos){
        console.log("Un jugador ha abandonado - Código:", datos.codigo);
        // Volver a mostrar "Esperando rival..."
        cw.mostrarEsperandoRival(datos.codigo);
    });
    
    this.socket.on("iniciarJuegoAhora",function(datos){
        console.log("Ambos jugadores listos - Iniciando juego:", datos.codigo);
        // Iniciar el juego de forma sincronizada con el nivel recibido
        if (datos.nivel) {
            console.log("Nivel a cargar:", datos.nivel);
            // Guardar nivel para que Juego lo use
            if (window.juego) {
                window.juego.nivelActual = datos.nivel;
            } else {
                // Almacenar temporalmente para cuando se cree el juego
                window.nivelTemporal = datos.nivel;
            }
        }
        cw.iniciarJuegoSincronizado(datos.codigo);
    });
    
    this.socket.on("estadoGrandeCambiado",function(datos){
        console.log("Estado grande del otro jugador cambiado:", datos.grande);
        // Actualizar el estado del otro jugador en el juego
        if (window.juego && window.juego.actualizarOtroJugadorGrande) {
            window.juego.actualizarOtroJugadorGrande(datos.grande);
        }
    });
    
    this.socket.on("partidaEliminada",function(datos){
        console.log("Partida eliminada:", datos.mensaje);
        
        // Destruir el juego si está activo
        if (window.juego) {
            try {
                window.juego.destruir();
                window.juego = null;
                console.log("Juego destruido tras partida eliminada");
            } catch (e) {
                console.warn("Error al destruir juego:", e);
            }
        }
        
        // Ocultar el contenedor del juego
        $("#juegoContainer").hide();
        // Limpiar canvas residual
        try { $("#game").empty(); } catch(e) { console.warn('No se pudo limpiar #game:', e); }
        
        // Limpiar el estado y mostrar mensaje
        cw.mostrarMensaje(datos.mensaje, "warning");
        
        // Volver a mostrar los cards
        $("#cardsPartidas").show();
        $("#estadoPartidaActual").hide();
        $("#estadoPartida").html("");
        ws.codigo = undefined;
        
        // Solicitar lista actualizada
        ws.solicitarLista();
    });
    
    this.socket.on("gameOverExit",function(datos){
        console.log("Game Over Exit recibido - volviendo al menú de partidas");
        
        // Destruir el juego si está activo
        if (window.juego) {
            try {
                window.juego.destruir();
                window.juego = null;
                console.log("Juego destruido tras Game Over Exit");
            } catch (e) {
                console.warn("Error al destruir juego:", e);
            }
        }
        
        // Ocultar el contenedor del juego
        $("#juegoContainer").hide();
        // Limpiar canvas residual
        try { $("#game").empty(); } catch(e) { console.warn('No se pudo limpiar #game:', e); }
        
        // Limpiar el estado y mostrar mensaje
        cw.mostrarMensaje("La partida ha terminado. Volviendo al menú de partidas...", "info");
        
        // Volver a mostrar los cards
        $("#cardsPartidas").show();
        $("#estadoPartidaActual").hide();
        $("#estadoPartida").html("");
        ws.codigo = undefined;
        
        // Solicitar lista actualizada
        ws.solicitarLista();
    });
}