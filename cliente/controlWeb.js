function ControlWeb(){
    this.mostrarAgregarUsuario=function(){
        let cadena='<div id="mAU" class="form-group">';
        cadena+='<label for="nick">Name:</label>';
        cadena+='<input id="nick" type="text" class="form-control">';
        cadena+='<button  id="btnAU" type="submit" class="btn btn-primary">Submit</button>';
        cadena+='</div>';
        $("#au").append(cadena);
        $("#btnAU").on("click", function(){
            let nick=$("#nick").val();
            rest.agregarUsuario(nick);  
            $("#mAU").remove();
        });
    }

    this.mostrarObtenerUsuarios=function(){
        $("#au").append('<div id="mOU" class="form-group">'
            +'<label for="btnOU">Obtener usuarios</label>'
            +'<button id="btnOU" class="btn btn-secondary">Listar</button>'
            +'</div>');
        $("#btnOU").on('click', function(){
            rest.obtenerUsuarios();
        });
    }

    this.mostrarNumeroUsuarios=function(){
        $("#au").append('<div id="mNU" class="form-group">'
            +'<label for="btnNU">Número de usuarios</label>'
            +'<button id="btnNU" class="btn btn-secondary">Contar</button>'
            +'</div>');
        $("#btnNU").on('click', function(){
            rest.numeroUsuarios();
        });
    }

    this.mostrarUsuarioActivo=function(){
        $("#au").append('<div id="mUA" class="form-group">'
            +'<label for="nickAct">Comprobar usuario activo:</label>'
            +'<input id="nickAct" type="text" class="form-control">'
            +'<button id="btnUA" class="btn btn-secondary">Comprobar</button>'
            +'</div>');
        $("#btnUA").on('click', function(){
            let nick = $("#nickAct").val();
            rest.usuarioActivo(nick);
        });
    }

    this.mostrarEliminarUsuario=function(){
        $("#au").append('<div id="mEU" class="form-group">'
            +'<label for="nickDel">Eliminar usuario:</label>'
            +'<input id="nickDel" type="text" class="form-control">'
            +'<button id="btnEU" class="btn btn-danger">Eliminar</button>'
            +'</div>');
        $("#btnEU").on('click', function(){
            let nick = $("#nickDel").val();
            rest.eliminarUsuario(nick);
        });
    }
}