function ControlWeb(){
    this.inicializarNavegacion=function(){
        // Mostrar por defecto la sección de Inicio Sesión si no hay sesión
        let nick = $.cookie("nick");
        if (nick) {
            cw.mostrarSeccion('seccionAcciones');
        } else {
            cw.mostrarSeccion('seccionInicioSesion');
        }
        
        // Event listeners para los links de navegación
        $("#linkInicioSesion").on("click", function(e){
            e.preventDefault();
            cw.mostrarSeccion('seccionInicioSesion');
        });
        
        $("#linkAcciones").on("click", function(e){
            e.preventDefault();
            cw.mostrarSeccion('seccionAcciones');
        });
        
        $("#linkPartidas").on("click", function(e){
            e.preventDefault();
            cw.mostrarSeccion('seccionPartidas');
        });
        
        $("#linkAcercaDe").on("click", function(e){
            e.preventDefault();
            cw.mostrarSeccion('seccionAcercaDe');
        });
    }
    
    this.mostrarSeccion=function(seccionId){
        // Ocultar todas las secciones
        $("#seccionInicioSesion").hide();
        $("#seccionPartidas").hide();
        $("#seccionAcciones").hide();
        $("#seccionAcercaDe").hide();
        
        // Mostrar la sección solicitada
        $("#" + seccionId).show();
        
        // Si vamos a la sección de inicio sesión, actualizar visibilidad según estado de sesión
        if (seccionId === 'seccionInicioSesion') {
            let nick = $.cookie("nick");
            if (nick) {
                // Hay sesión activa - ocultar elementos de autenticación
                $("#tituloAutenticacion").hide();
                $("#googleSignInContainer").hide();
                $("#separadorAuth").hide();
            } else {
                // No hay sesión - mostrar elementos de autenticación
                $("#tituloAutenticacion").show();
                $("#googleSignInContainer").show();
                $("#separadorAuth").show();
            }
        }
        
        // Actualizar clase active en navbar
        $(".navbar-nav .nav-link").removeClass("active");
        if (seccionId === 'seccionInicioSesion') {
            $("#linkInicioSesion").addClass("active");
        } else if (seccionId === 'seccionPartidas') {
            $("#linkPartidas").addClass("active");
            // Inicializar la sección de partidas
            cw.inicializarPartidas();
        } else if (seccionId === 'seccionAcciones') {
            $("#linkAcciones").addClass("active");
        } else if (seccionId === 'seccionAcercaDe') {
            $("#linkAcercaDe").addClass("active");
        }
    }
    
    this.mostrarAgregarUsuario=function(){
        let cadena = '<div class="card mb-3" id="mAU">';
            cadena+=' <div class="card-body">';
            cadena+='<h5 class="card-title">Agregar usuario</h5>';
            cadena+='<div class="form-group">';
            cadena+='<label for="nick">Nombre:</label>';
            cadena+='<input id="nick" type="text" class="form-control">';
            cadena+='</div>';
            cadena+='<button id="btnAU" class="btn btn-primary btn-block">Enviar</button>';
            cadena+='</div></div>';
        $("#left-cards").append(cadena);
        $("#btnAU").on("click", function(){
            let nick=$("#nick").val();
            $("#mAU .alert").remove();
            if (!nick){
                $("#mAU .card-body").append('<div class="alert alert-danger mt-2">Por favor introduce un nombre</div>');
                return;
            }
            rest.agregarUsuario(nick);
        });
    }

    this.mostrarObtenerUsuarios=function(){
        $("#right-cards").append('<div class="card mb-3" id="mOU">'
            +'<div class="card-body">'
            +'<h5 class="card-title">Obtener usuarios</h5>'
            +'<button id="btnOU" class="btn btn-secondary btn-block">Listar usuarios</button>'
            +'<div class="mt-3">'
            +'<table class="table table-sm table-striped" id="tablaUsuarios">'
            +'<thead><tr><th>Nick</th></tr></thead>'
            +'<tbody><tr><td><em>...</em></td></tr></tbody>'
            +'</table>'
            +'</div>'
            +'</div></div>');
        $("#btnOU").on('click', function(){
            rest.obtenerUsuarios();
        });
    }

    // Para llenar la tabla de susuarios
    this.llenarTabla = function(data){
        let tbody = $("#tablaUsuarios tbody");
        tbody.html('');
        if (!data || data.length === 0){
            tbody.append('<tr><td><em>No hay usuarios</em></td></tr>');
        }
        else{
            data.forEach(function(u){
                var nick = u.nick;
                tbody.append('<tr><td>'+nick+'</td></tr>');
            });
        }
    }

    this.mostrarNumeroUsuarios=function(){
        $("#right-cards").append('<div class="card mb-3" id="mNU">'
            +'<div class="card-body">'
            +'<h5 class="card-title">Número de usuarios</h5>'
            +'<button id="btnNU" class="btn btn-secondary btn-block">Mostrar número</button>'
            +'</div></div>');
        $("#btnNU").on('click', function(){
            rest.numeroUsuarios();
        });
    }

    this.mostrarUsuarioActivo=function(){
        $("#left-cards").append('<div class="card mb-3" id="mUA">'
            +'<div class="card-body">'
            +'<h5 class="card-title">Comprobar usuario activo</h5>'
            +'<div class="form-group">'
            +'<label for="nickAct">Nombre:</label>'
            +'<input id="nickAct" type="text" class="form-control">'
            +'</div>'
            +'<button id="btnUA" class="btn btn-secondary btn-block">Comprobar</button>'
            +'</div></div>');
        $("#btnUA").on('click', function(){
            let nick = $("#nickAct").val();
            $("#mUA .alert").remove();
            if (!nick){
                $("#mUA .card-body").append('<div class="alert alert-danger mt-2">Por favor introduce un nombre</div>');
                return;
            }
            rest.usuarioActivo(nick);
        });
    }

    this.mostrarEliminarUsuario=function(){
        $("#left-cards").append('<div class="card mb-3" id="mEU">'
            +'<div class="card-body">'
            +'<h5 class="card-title">Eliminar usuario</h5>'
            +'<div class="form-group">'
            +'<label for="nickDel">Nombre:</label>'
            +'<input id="nickDel" type="text" class="form-control">'
            +'</div>'
            +'<button id="btnEU" class="btn btn-danger btn-block">Eliminar</button>'
            +'</div></div>');
        $("#btnEU").on('click', function(){
            let nick = $("#nickDel").val();
            $("#mEU .alert").remove();
            if (!nick){
                $("#mEU .card-body").append('<div class="alert alert-danger mt-2">Por favor introduce un nombre</div>');
                return;
            }
            rest.eliminarUsuario(nick);
        });
    }

    this.mostrarBienvenida=function(msg){
        $("#mensajes").html('<div class="alert alert-info mt-2 d-flex justify-content-between align-items-center">'+
            '<span>'+msg+'</span>'+
            '<button id="btnSalir" class="btn btn-light btn-sm ml-3">Salir</button>'+
        '</div>');
        $("#btnSalir").on("click", function(){
            cw.salir();
        });
    }

    this.comprobarSesion=function(){
        let nick = $.cookie("nick");
        if (nick){
            cw.mostrarBienvenida("Bienvenido al sistema, "+nick);
            cw.mostrarSeccion('seccionPartidas');
        }
        else{
            // Mostrar login por defecto cuando no hay sesión
            cw.mostrarLogin();
            cw.mostrarSeccion('seccionInicioSesion');
        }
    }

    this.salir=function(){
        $.removeCookie("nick");
        rest.cerrarSesion();
        cw.mostrarMensaje("Has salido del sistema correctamente", "info");
        // Redirigir a la sección de inicio de sesión
        setTimeout(function(){
            location.reload();
        }, 1000);
    }

    this.mostrarSalir=function(){
        // Función obsoleta - ahora el botón se crea en mostrarBienvenida
    }

    this.mostrarRegistro=function(){ 
        $("#fmRegistro").remove();
        $("#fmLogin").remove(); // Ocultar el formulario de login
        $("#login").html(''); // Limpiar el contenedor de login
        
        $("#registro").load("./cliente/registro.html",function(){ 
            // Usar delegación de eventos
            $(document).off("click", "#btnRegistro").on("click", "#btnRegistro", function(e){ 
                e.preventDefault(); 
                
                // Limpiar alertas previas
                $("#fmRegistro .alert").remove();
                
                let email=$("#email").val().trim(); 
                let pwd=$("#pwd").val(); 
                let nombre=$("#nombre").val().trim();
                let apellidos = $("#apellidos").val().trim();
                
                if (!email || !pwd){ 
                    $("#fmRegistro").append('<div class="alert alert-danger mt-2">Por favor completa todos los campos</div>');
                    return;
                }
                
                rest.registrarUsuario(email, pwd, nombre, apellidos); 
                console.log("Intentando registrar:", email, nombre, apellidos); 
            });
            
            // Link para mostrar login desde el registro con delegación de eventos
            $(document).off("click", "#linkLogin").on("click", "#linkLogin", function(e){
                e.preventDefault();
                console.log("Click en linkLogin detectado");
                cw.mostrarLogin();
            });
        }); 
 
    }

    this.mostrarLogin=function(){ 
        $("#fmLogin").remove();
        $("#fmRegistro").remove(); // Ocultar el formulario de registro
        $("#registro").html(''); // Limpiar el contenedor de registro
        
        // Si hay sesión activa en la sección de inicio sesión, mostrar botón de salir
        let nick = $.cookie("nick");
        if (nick) {
            // Ocultar título, botón de Google y separador
            $("#tituloAutenticacion").hide();
            $("#googleSignInContainer").hide();
            $("#separadorAuth").hide();
            
            $("#login").html('<div class="text-center mt-5">'+
                '<div class="card mx-auto" style="max-width: 400px;">'+
                '<div class="card-body">'+
                '<h5 class="card-title">Sesión activa</h5>'+
                '<p class="card-text">Has iniciado sesión como:</p>'+
                '<h6 class="text-primary mb-4">'+nick+'</h6>'+
                '<button id="btnSalirLogin" class="btn btn-danger btn-lg btn-block">Cerrar Sesión</button>'+
                '</div>'+
                '</div>'+
            '</div>');
            $("#btnSalirLogin").on("click", function(){
                cw.salir();
            });
            return;
        }
        
        // Si no hay sesión, mostrar todo
        $("#tituloAutenticacion").show();
        $("#googleSignInContainer").show();
        $("#separadorAuth").show();
        
        $("#login").load("./cliente/login.html",function(){ 
            // Usar delegación de eventos para manejar clicks en botones/enlaces cargados dinámicamente
            $(document).off("click", "#btnLogin").on("click", "#btnLogin", function(e){ 
                e.preventDefault(); 
                
                // Limpiar alertas previas
                $("#fmLogin .alert").remove();
                
                let email=$("#emailLogin").val().trim(); 
                let pwd=$("#pwdLogin").val(); 
                
                // Validaciones
                if (!email || !pwd){ 
                    cw.mostrarMensaje("Por favor completa todos los campos", "danger");
                    return;
                }
                
                // Validar formato de email
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    cw.mostrarMensaje("Por favor introduce un email válido", "danger");
                    return;
                }
                
                // Si todo está bien, iniciar sesión
                rest.iniciarSesion(email, pwd); 
                console.log("Intentando iniciar sesión:", email); 
            });
            
            // Link para mostrar registro desde el login con delegación de eventos
            $(document).off("click", "#linkRegistro").on("click", "#linkRegistro", function(e){
                e.preventDefault();
                console.log("Click en linkRegistro detectado");
                cw.mostrarRegistro();
            });
        }); 
 
    }

    this.limpiar=function(){
        $("#email").val('');
        $("#pwd").val('');
        $("#nombre").val('');
        $("#apellidos").val('');
        
        $("#fmRegistro .alert").remove();
    }

    this.limpiarLogin=function(){
        $("#emailLogin").val('');
        $("#pwdLogin").val('');
        
        $("#fmLogin .alert").remove();
        $("#fmLogin").hide();
    }

    this.mostrarMensaje=function(mensaje, tipo){
        // tipo puede ser: 'success', 'danger', 'warning', 'info'
        // Por defecto usamos 'success'
        if (!tipo) {
            tipo = 'success';
        }
        
        $("#notificaciones .alert").remove();
        $("#notificaciones").html(`
            <div class="alert alert-${tipo} alert-dismissible fade show mt-2" role="alert">
                ${mensaje}
                <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
        `);
        
        // Auto-ocultar después de 5 segundos
        setTimeout(function(){
            $("#notificaciones .alert").fadeOut(function(){
                $(this).remove();
            });
        }, 5000);
        
        console.log("Mensaje mostrado:", mensaje);
    }

    // ========== GESTIÓN DE PARTIDAS ==========
    
    this.inicializarPartidas=function(){
        // Limpiar mensaje previo si existe
        $("#mensajeSinSesion").remove();
        
        // Verificar si hay sesión iniciada
        let nick = $.cookie("nick");
        
        if (!nick) {
            // No hay sesión - mostrar mensaje informativo
            $("#cardsPartidas").hide();
            $("#estadoPartidaActual").hide();
            $("#seccionPartidas").append(`
                <div id="mensajeSinSesion" class="alert alert-warning mt-3">
                    <h5><i class="fas fa-info-circle"></i> Inicia sesión para jugar</h5>
                    <p class="mb-0">Debes iniciar sesión para poder crear o unirte a partidas.</p>
                    <a href="#" id="linkIrALogin" class="btn btn-primary mt-2">Ir a Inicio de Sesión</a>
                </div>
            `);
            
            $("#linkIrALogin").on("click", function(e){
                e.preventDefault();
                cw.mostrarSeccion('seccionInicioSesion');
            });
            return;
        }
        
        // Hay sesión - mostrar interfaz normal
        $("#cardsPartidas").show();
        
        // Configurar botón de crear partida
        $("#btnCrearPartida").off("click").on("click", function(){
            ws.crearPartida();
        });
        
        // Botón para abandonar partida
        $("#btnAbandonarPartida").off("click").on("click", function(){
            cw.abandonarPartida();
        });
        
        // Limpiar estado de partida
        $("#estadoPartida").html("");
        $("#cardsPartidas").show();
        $("#estadoPartidaActual").hide();
        
        // Solicitar lista de partidas disponibles al cargar la sección
        ws.solicitarLista();
    }
    
    this.mostrarEsperandoRival=function(codigo){
        // Ocultar cards y mostrar estado
        $("#cardsPartidas").hide();
        $("#estadoPartidaActual").show();
        
        $("#estadoPartida").html(`
            <div class="alert alert-info">
                <h6><i class="fas fa-spinner fa-spin"></i> Esperando rival...</h6>
                <p class="mb-1">Código de partida: <strong>${codigo}</strong></p>
                <small>Comparte este código con otro jugador para que se una</small>
            </div>
        `);
    }
    
    this.mostrarPartidaCompleta=function(codigo){
        // Ocultar cards y mostrar estado
        $("#cardsPartidas").hide();
        $("#estadoPartidaActual").show();
        
        $("#estadoPartida").html(`
            <div class="alert alert-success text-center">
                <h4><i class="fas fa-check-circle"></i> ¡Partida completa!</h4>
                <p class="mb-2">Código: <strong>${codigo}</strong></p>
                <p class="mb-3">¡Ambos jugadores conectados!</p>
                <button id="btnIniciarJuego" class="btn btn-primary btn-lg">
                    🎮 Iniciar Juego
                </button>
                <div id="estadoEspera" style="display:none; margin-top: 15px;">
                    <p class="text-info"><strong>Esperando a que el otro jugador esté listo...</strong></p>
                    <div class="spinner-border text-primary" role="status">
                        <span class="sr-only">Cargando...</span>
                    </div>
                </div>
            </div>
        `);
        
        // Evento para indicar que este jugador está listo
        $("#btnIniciarJuego").off("click").on("click", function() {
            console.log("Jugador listo para iniciar");
            // Enviar señal de que este jugador está listo
            ws.jugadorListo(codigo);
            // Deshabilitar botón y mostrar mensaje de espera
            $("#btnIniciarJuego").prop("disabled", true).text("✓ Listo");
            $("#estadoEspera").show();
        });
    }
    
    this.iniciarJuegoSincronizado=function(codigo){
        console.log("Iniciando juego sincronizado con código:", codigo);
        
        // Ocultar estado de partida y mostrar canvas del juego
        $("#estadoPartidaActual").hide();
        $("#juegoContainer").show();
        
        // Crear instancia del juego Phaser
        juego = new Juego();
        juego.iniciar(codigo);
        
        // Configurar botón de salir del juego
        $("#btnSalirJuego").off("click").on("click", function() {
            if (confirm("¿Seguro que quieres salir del juego? Se abandonará la partida.")) {
                if (juego) {
                    juego.destruir();
                    juego = null;
                }
                $("#juegoContainer").hide();
                cw.abandonarPartida();
            }
        });
    }
    
    this.abandonarPartida=function(){
        // Notificar al servidor antes de limpiar
        if (ws.codigo) {
            ws.abandonarPartida(ws.codigo);
        }
        
        // Volver a mostrar los cards
        $("#cardsPartidas").show();
        $("#estadoPartidaActual").hide();
        $("#estadoPartida").html("");
        
        // Limpiar código de partida
        ws.codigo = undefined;
        
        // Solicitar lista actualizada de partidas
        ws.solicitarLista();
        
        this.mostrarMensaje("Has abandonado la partida", "info");
    }
    
    this.mostrarListaPartidas=function(lista){
        if (!lista || lista.length === 0) {
            $("#listaPartidas").html('<p class="text-muted">No hay partidas disponibles en este momento.</p>');
            return;
        }
        
        let html = '<div class="table-responsive"><table class="table table-hover">';
        html += '<thead class="thead-light"><tr><th>Código</th><th>Creador</th><th>Jugadores</th><th>Acción</th></tr></thead>';
        html += '<tbody>';
        
        lista.forEach(function(partida){
            html += '<tr>';
            html += '<td><code>' + partida.codigo + '</code></td>';
            html += '<td>' + (partida.creador || 'Anónimo') + '</td>';
            html += '<td>' + partida.jugadores + '/' + partida.maxJugadores + '</td>';
            html += '<td><button class="btn btn-sm btn-primary btnUnirse" data-codigo="' + partida.codigo + '">Unirse</button></td>';
            html += '</tr>';
        });
        
        html += '</tbody></table></div>';
        $("#listaPartidas").html(html);
        
        // Event listener para botones de unirse
        $(".btnUnirse").off("click").on("click", function(){
            let codigo = $(this).data("codigo");
            let nick = $.cookie("nick");
            if (!nick) {
                cw.mostrarMensaje("Debes iniciar sesión para unirte a una partida", "warning");
                return;
            }
            ws.unirAPartida(codigo);
        });
    }

 }
