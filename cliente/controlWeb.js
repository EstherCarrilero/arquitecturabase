function ControlWeb(){
    
    // Nueva función de inicialización
    this.inicializar=function(){
        // Configurar eventos del navbar
        $("#linkSalir").on("click", function(e){
            e.preventDefault();
            cw.salir();
        });
        
        // Configurar botón de jugar
        $("#btnJugar").on("click", function(){
            cw.mostrarSeccionPartidas();
        });
        
        // Comprobar sesión al cargar
        cw.comprobarSesion();
    }
    
    this.comprobarSesion=function(){
        let nick = $.cookie("nick");
        if (nick){
            // Hay sesión activa - mostrar pantalla de inicio con botón de jugar
            cw.mostrarPantallaInicio(nick);
        }
        else{
            // No hay sesión - mostrar modal de login
            cw.mostrarModalLogin();
        }
    }
    
    this.mostrarModalLogin=function(){
        // Cargar formulario de login en el modal
        cw.cargarFormularioLogin();
        // Mostrar el modal
        $("#modalLogin").modal('show');
    }
    
    this.cargarFormularioLogin=function(){
        $("#tituloModal").html('<img src="./cliente/assets/images/hud_player_yellow.png" alt="Player" class="icon-hud"> Wonder Alien - Inicio de Sesión');
        $("#contenedorFormulario").load("./cliente/login.html", function(){
            // Configurar eventos del formulario de login
            $(document).off("click", "#btnLogin").on("click", "#btnLogin", function(e){ 
                e.preventDefault(); 
                
                // Limpiar alertas previas
                $("#notificacionesModal .alert").remove();
                
                let email=$("#emailLogin").val().trim(); 
                let pwd=$("#pwdLogin").val(); 
                
                // Validaciones
                if (!email || !pwd){ 
                    cw.mostrarMensajeModal("Por favor completa todos los campos", "danger");
                    return;
                }
                
                // Validar formato de email
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    cw.mostrarMensajeModal("Por favor introduce un email válido", "danger");
                    return;
                }
                
                // Si todo está bien, iniciar sesión
                rest.iniciarSesion(email, pwd); 
                console.log("Intentando iniciar sesión:", email); 
            });
            
            // Link para mostrar registro desde el login
            $(document).off("click", "#linkRegistro").on("click", "#linkRegistro", function(e){
                e.preventDefault();
                console.log("Cambiar a formulario de registro");
                cw.cargarFormularioRegistro();
            });
        });
    }
    
    this.cargarFormularioRegistro=function(){
        $("#tituloModal").html('<img src="./cliente/assets/images/hud_player_yellow.png" alt="Player" class="icon-hud"> Wonder Alien - Registro');
        $("#contenedorFormulario").load("./cliente/registro.html", function(){
            // Configurar eventos del formulario de registro
            $(document).off("click", "#btnRegistro").on("click", "#btnRegistro", function(e){ 
                e.preventDefault(); 
                
                // Limpiar alertas previas
                $("#notificacionesModal .alert").remove();
                
                let email=$("#email").val().trim(); 
                let pwd=$("#pwd").val(); 
                let nombre=$("#nombre").val().trim();
                let apellidos = $("#apellidos").val().trim();
                
                if (!email || !pwd){ 
                    cw.mostrarMensajeModal("Por favor completa todos los campos", "danger");
                    return;
                }
                
                rest.registrarUsuario(email, pwd, nombre, apellidos); 
                console.log("Intentando registrar:", email, nombre, apellidos); 
            });
            
            // Link para volver al login desde el registro
            $(document).off("click", "#linkLogin").on("click", "#linkLogin", function(e){
                e.preventDefault();
                console.log("Cambiar a formulario de login");
                cw.cargarFormularioLogin();
            });
        });
    }
    
    this.mostrarMensajeModal=function(mensaje, tipo){
        if (!tipo) tipo = 'info';
        
        $("#notificacionesModal .alert").remove();
        $("#notificacionesModal").html(`
            <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
                ${mensaje}
                <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
        `);
    }
    
    this.cerrarModalLogin=function(){
        $("#modalLogin").modal('hide');
    }
    
    this.mostrarPantallaInicio=function(nick){
        // Ocultar modal si está abierto
        cw.cerrarModalLogin();
        
        // Mostrar navbar
        $("#mainNavbar").show();
        $("#nombreUsuario").html(nick);
        
        // Restaurar navbar a estado transparente por defecto
        $(".navbar-custom").removeClass("navbar-partidas").css({
            background: 'transparent',
            boxShadow: 'none'
        });
        $("#nombreUsuario").css('color', '#1e3a8a');

        // Ocultar sección de partidas
        $("#seccionPartidas").hide();
        
        // Mostrar pantalla de inicio con botón de jugar
        $("#pantallaInicio").show();
    }
    
    this.mostrarBienvenidaTemporal=function(email){
        $("#mensajeBienvenida").html("¡Bienvenido al sistema, " + email + "!").fadeIn();
        
        setTimeout(function(){
            $("#mensajeBienvenida").fadeOut(function(){
                // Después de ocultar el mensaje, mostrar la pantalla de inicio
                cw.mostrarPantallaInicio($.cookie("nick"));
            });
        }, 3000);
    }
    
    this.mostrarSeccionPartidas=function(){
        // Ocultar pantalla de inicio
        $("#pantallaInicio").hide();
        
        // Cambiar el fondo del contenedor principal (quitar la imagen de fondo)
        $("#mainContent").removeClass("custom-bg").addClass("fondo-partidas");
        
        // Activar modo partidas en navbar (fondo azul oscuro)
        $(".navbar-custom").addClass("navbar-partidas");
        // Asegurar que las reglas se apliquen aunque haya otras declaraciones con !important
        $(".navbar-custom").css({
            background: 'linear-gradient(135deg, #34495e 0%, #2c3e50 100%)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        });
        $("#nombreUsuario").css('color', '#ffffff');
        
        // Mostrar sección de partidas
        $("#seccionPartidas").show();
        
        // Inicializar partidas
        cw.inicializarPartidas();
    }
    
    this.salir=function(){
        $.removeCookie("nick");
        rest.cerrarSesion();
        
        // Recargar la página para volver al estado inicial
        location.reload();
    }

    // Funciones heredadas del código original (adaptadas)
    
    this.inicializarNavegacion=function(){
        // Función obsoleta - mantenida por compatibilidad
    }
    
    this.mostrarSeccion=function(seccionId){
        // Función obsoleta - mantenida por compatibilidad
    }
    
    this.mostrarAgregarUsuario=function(){
        // Función obsoleta - eliminada del nuevo diseño
    }

    this.mostrarObtenerUsuarios=function(){
        // Función obsoleta - eliminada del nuevo diseño
    }

    this.llenarTabla = function(data){
        // Función obsoleta - eliminada del nuevo diseño
    }

    this.mostrarNumeroUsuarios=function(){
        // Función obsoleta - eliminada del nuevo diseño
    }

    this.mostrarUsuarioActivo=function(){
        // Función obsoleta - eliminada del nuevo diseño
    }

    this.mostrarEliminarUsuario=function(){
        // Función obsoleta - eliminada del nuevo diseño
    }

    this.mostrarBienvenida=function(msg){
        // Función obsoleta - reemplazada por mostrarPantallaInicio
    }

    this.mostrarSalir=function(){
        // Función obsoleta
    }

    this.mostrarRegistro=function(){
        // Ahora se usa cargarFormularioRegistro
        cw.cargarFormularioRegistro();
    }

    this.mostrarLogin=function(){
        // Ahora se usa cargarFormularioLogin
        cw.cargarFormularioLogin();
    }

    this.limpiar=function(){
        $("#email").val('');
        $("#pwd").val('');
        $("#nombre").val('');
        $("#apellidos").val('');
        
        $("#notificacionesModal .alert").remove();
    }

    this.limpiarLogin=function(){
        $("#emailLogin").val('');
        $("#pwdLogin").val('');
        
        $("#notificacionesModal .alert").remove();
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
        
        // Determinar si este usuario es el creador
        let nick = $.cookie("nick");
        let esCreador = ws.esCreadorPartida || false; // Flag que se debe setear al crear partida
        
        let selectorNivel = '';
        if (esCreador) {
            selectorNivel = `
                <div class="mb-3">
                    <h5>Selecciona el nivel:</h5>
                    <div class="btn-group btn-group-toggle d-flex" data-toggle="buttons">
                        <label class="btn btn-outline-success active flex-fill">
                            <input type="radio" name="nivelOptions" id="nivel1" value="1" checked> Nivel 1 (Fácil)
                        </label>
                        <label class="btn btn-outline-danger flex-fill">
                            <input type="radio" name="nivelOptions" id="nivel2" value="2"> Nivel 2 (Difícil)
                        </label>
                    </div>
                    <small class="text-muted d-block mt-2">Nivel 1: Pocos enemigos, más champiñones<br>
                    Nivel 2: Más enemigos, menos champiñones</small>
                </div>
            `;
        }
        
        $("#estadoPartida").html(`
            <div class="alert alert-success text-center">
                <h4><i class="fas fa-check-circle"></i> ¡Partida completa!</h4>
                <p class="mb-2">Código: <strong>${codigo}</strong></p>
                <p class="mb-3">¡Ambos jugadores conectados!</p>
                ${selectorNivel}
                <button id="btnIniciarJuego" class="btn btn-primary btn-lg">
                    <img src="./cliente/assets/images/hud_player_yellow.png" alt="Player" class="icon-hud"> Iniciar Juego
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
            
            // Si es creador, enviar nivel seleccionado
            let nivelSeleccionado = 1;
            if (esCreador) {
                nivelSeleccionado = parseInt($('input[name="nivelOptions"]:checked').val()) || 1;
                console.log("Creador seleccionó nivel:", nivelSeleccionado);
                ws.enviarNivelSeleccionado(codigo, nivelSeleccionado);
            }
            
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
