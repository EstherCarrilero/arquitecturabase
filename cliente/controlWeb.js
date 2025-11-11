function ControlWeb(){
    this.mostrarAgregarUsuario=function(){
        let cadena = '<div class="card mb-3" id="mAU">';
            cadena+=' <div class="card-body">';
            cadena+='<h5 class="card-title">Agregar usuario</h5>';
            cadena+='<div class="form-group">';
            cadena+='<label for="nick">Nombre:</label>';
            cadena+='<input id="nick" type="text" class="form-control">';
            cadena+='</div>';
            cadena+='<button id="btnAU" class="btn btn-primary btn-block">Enviar</button>';
            cadena=cadena+'<div><a href="/auth/google"><img src="./cliente/img/btn_google_sign_in_web_light_rd_SI@2x.png" style="height:40px;"></a></div>';
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
        $("#mensajes").html('<div class="alert alert-info mt-2">'+msg+'</div>');
        cw.mostrarSalir();
    }

    this.comprobarSesion=function(){
        let nick=  $.cookie("nick")// localStorage.getItem("nick");
        if (nick){
            cw.mostrarBienvenida("Bienvenido al sistema, "+nick);
        }
        else{
            // Mostrar login por defecto cuando no hay sesión
            cw.mostrarLogin();
        }
    }

    this.salir=function(){
        $.removeCookie("nick") //localStorage.removeItem("nick");
        location.reload();
        rest.cerrarSesion(); 

        $("#mensajes").append('<div class="alert alert-info mt-2">Has salido del sistema</div>');
    }

    this.mostrarSalir=function(){
        $("#mensajes").append('<button id="btnSalir" class="btn btn-outline-secondary btn-sm ml-2">Salir</button>');
        $("#btnSalir").on("click", function(){
            cw.salir();
        });
    }

    this.mostrarRegistro=function(){ 
        $("#fmRegistro").remove(); 
        $("#registro").load("./cliente/registro.html",function(){ 
            $("#btnRegistro").on("click",function(e){ 
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
            
            // Link para mostrar login desde el registro
            $("#linkLogin").on("click", function(e){
                e.preventDefault();
                cw.mostrarLogin();
            });
        }); 
 
    }

    this.mostrarLogin=function(){ 
        $("#fmLogin").remove(); 
        $("#login").load("./cliente/login.html",function(){ 
            $("#btnLogin").on("click",function(e){ 
                e.preventDefault(); 
                
                // Limpiar alertas previas
                $("#fmLogin .alert").remove();
                
                let email=$("#emailLogin").val().trim(); 
                let pwd=$("#pwdLogin").val(); 
                
                // Validaciones
                if (!email || !pwd){ 
                    $("#fmLogin").append('<div class="alert alert-danger mt-2">Por favor completa todos los campos</div>');
                    return;
                }
                
                // Validar formato de email
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    $("#fmLogin").append('<div class="alert alert-danger mt-2">Por favor introduce un email válido</div>');
                    return;
                }
                
                // Si todo está bien, iniciar sesión
                rest.iniciarSesion(email, pwd); 
                console.log("Intentando iniciar sesión:", email); 
            });
            
            // Link para mostrar registro desde el login
            $("#linkRegistro").on("click", function(e){
                e.preventDefault();
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
        
        $("#mensajes .alert").remove();
        $("#mensajes").html('<div class="alert alert-'+tipo+' mt-2">'+mensaje+'</div>');
        
        console.log("Mensaje mostrado:", mensaje);
    }

 }
