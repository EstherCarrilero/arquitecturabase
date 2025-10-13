function ClienteRest(){
    this.agregarUsuario=function(nick){
        var cli=this;
        $.getJSON("/agregarUsuario/"+nick,function(data){
            if (data.nick!=-1){
                console.log("Usuario "+nick+" ha sido registrado")
            }
            else{
                console.log("El nick ya está ocupado");
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
        });
    }

    this.numeroUsuarios=function(){
        var cli=this;
        $.getJSON("/numeroUsuarios",function(data){
            console.log("Número de usuarios registrados: "+data.num);
        });
    }

    this.usuarioActivo=function(nick){
        var cli=this;
        $.getJSON("/usuarioActivo/"+nick,function(data){
            if (data.res){
                console.log("El usuario "+nick+" está activo");
            }
            else{
                console.log("El usuario "+nick+" no está activo");
            }
        });
    }

    this.eliminarUsuario=function(nick){
        var cli=this;
        $.getJSON("/eliminarUsuario/"+nick,function(data){
            if (data.nick!=-1){
                console.log("Usuario "+nick+" ha sido eliminado")
            }
            else{
                console.log("El usuario "+nick+" no existe");
            }
        });
    }
}