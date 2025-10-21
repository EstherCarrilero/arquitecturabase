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
            cw.mostrarAgregarUsuario();
        }
    }

    this.salir=function(){
         $.removeCookie("nick") //localStorage.removeItem("nick");
        location.reload();

        $("#mensajes").append('<div class="alert alert-info mt-2">Has salido del sistema</div>');
    }

    this.mostrarSalir=function(){
        $("#mensajes").append('<button id="btnSalir" class="btn btn-outline-secondary btn-sm ml-2">Salir</button>');
        $("#btnSalir").on("click", function(){
            cw.salir();
        });
    }

 }
