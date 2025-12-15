function ClienteWS(){ 
    this.socket=undefined; 
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

    this.socket.on("partidaCreada",function(datos){ 
        console.log("Partida creada con código:", datos.codigo); 
        ws.codigo=datos.codigo;
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
    
    this.socket.on("partidaEliminada",function(datos){
        console.log("Partida eliminada:", datos.mensaje);
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
}