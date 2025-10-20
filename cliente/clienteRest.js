function ClienteRest(){
    this.agregarUsuario=function(nick){
        var cli=this;
        $.getJSON("/agregarUsuario/"+nick,function(data){
            $("#mAU .alert").remove();
            if (data.nick!=-1){
                console.log("Usuario "+nick+" ha sido registrado");
                
                $("#mAU .card-body").append('<div class="alert alert-success mt-2">Usuario '+nick+' ha sido registrado</div>');
                $("#nick").val('');
            }
            else{
                console.log("El nick ya está ocupado");

                $("#mAU .card-body").append('<div class="alert alert-danger mt-2">El nick '+nick+' ya está ocupado</div>');
            }
        });
    }

    this.agregarUsuario2=function(nick){
        $.ajax({
            type:'GET',
            url:'/agregarUsuario/'+nick,
            success:function(data){
                if (data.nick!=-1){
                    console.log("Usuario "+nick+" ha sido registrado")
                }
                else{
                    console.log("El nick ya está ocupado");
                }
            },
            error:function(xhr, textStatus, errorThrown){
                console.log("Status: " + textStatus);
                console.log("Error: " + errorThrown);
            },
            contentType:'application/json'
        });
    }

    this.obtenerUsuarios=function(){
        var cli=this;
        $.getJSON("/obtenerUsuarios",function(data){
            if (Object.keys(data).length>0){
                console.log("Usuarios registrados:");
                for (var i in data){
                    console.log("- "+ data[i].nick);
                }
            }
            else{
                console.log("No hay usuarios registrados");
            }

            cw.llenarTabla(Object.values(data));
        });
    }

    this.numeroUsuarios=function(){
        var cli=this;
        $("#mNU .alert").remove();
        $.getJSON("/numeroUsuarios",function(data){
            console.log("Número de usuarios registrados: "+data.num);

            $("#mNU .card-body").append('<div class="alert alert-success mt-2">Número de usuarios registrados: '+data.num+'</div>');
        });
    }

    this.usuarioActivo=function(nick){
        var cli=this;
        $("#mUA .alert").remove();
        $.getJSON("/usuarioActivo/"+nick,function(data){
            if (data.res){
                console.log("El usuario "+nick+" está activo");

                $("#mUA .card-body").append('<div class="alert alert-success mt-2">Usuario '+nick+' está activo</div>');
            }
            else{
                console.log("El usuario "+nick+" no está activo");
                $("#mUA .card-body").append('<div class="alert alert-danger mt-2">Usuario '+nick+' no está activo</div>');
            }
        });
    }

    this.eliminarUsuario=function(nick){
        var cli=this;
        $("#mEU .alert").remove();
        $.getJSON("/eliminarUsuario/"+nick,function(data){
            if (data.nick!=-1){
                console.log("Usuario "+nick+" ha sido eliminado")

                $("#mEU .card-body").append('<div class="alert alert-success mt-2">Usuario '+nick+' ha sido eliminado</div>');
                $("#nick").val('');
            }
            else{
                console.log("El usuario "+nick+" no existe");

                $("#mEU .card-body").append('<div class="alert alert-danger mt-2">El usuario '+nick+' no existe</div>');
            }
        });
    }
}