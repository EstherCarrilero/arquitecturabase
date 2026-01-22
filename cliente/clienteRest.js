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

    this.registrarUsuario=function(email, password, nombre, apellidos){ 
        $.ajax({ 
            type:'POST', 
            url:'/registrarUsuario', 
            data: JSON.stringify({"email":email,"password":password,"nombre":nombre,"apellidos":apellidos}), 
            success:function(data){ 
                if (data.nick && data.nick !== -1){              
                    console.log("Usuario "+data.nick+" ha sido registrado"); 
                    // NO guardar cookie ni iniciar sesión automáticamente
                    cw.limpiar(); 
                    cw.mostrarMensajeModal("¡Registro exitoso! Revisa tu correo electrónico para confirmar tu cuenta.", "success"); 
                    // Volver al formulario de login después de unos segundos
                    setTimeout(function() {
                        cw.cargarFormularioLogin();
                    }, 3000);
                } 
                else{ 
                    console.log("Error en registro:", data.error || "El usuario ya existe"); 
                    cw.mostrarMensajeModal(data.error || "El email ya está registrado", "danger");
                } 
             }, 
             error:function(xhr, textStatus, errorThrown){ 
                console.log("Error en registro - Status: " + textStatus);  
                console.log("Error: " + errorThrown);
                
                let errorMsg = "Error al registrar usuario";
                if (xhr.responseJSON && xhr.responseJSON.error) {
                    errorMsg = xhr.responseJSON.error;
                }
                cw.mostrarMensajeModal(errorMsg, "danger");
             }, 
            contentType:'application/json' 
        }); 
    }

    this.iniciarSesion=function(email, password){ 
        $.ajax({ 
            type:'POST', 
            url:'/iniciarSesion', 
            data: JSON.stringify({"email":email,"password":password}), 
            success:function(data){ 
                if (data.nick && data.nick !== -1){              
                    console.log("Sesión iniciada: "+data.nick); 
                    console.log("Email del usuario:", data.email);
                    
                    // Guardar el email en la cookie (data.nick y data.email son el mismo valor)
                    $.cookie("nick", data.email || data.nick); 
                    
                    cw.limpiarLogin(); 
                    
                    // Cerrar el modal
                    cw.cerrarModalLogin();
                    
                    // Mostrar mensaje de bienvenida temporal
                    cw.mostrarBienvenidaTemporal(data.email || data.nick);
                } 
                else{ 
                    console.log("Error en login:", data.error || "Credenciales incorrectas"); 
                    cw.mostrarMensajeModal(data.error || "Email o contraseña incorrectos", "danger");
                } 
             }, 
             error:function(xhr, textStatus, errorThrown){ 
                console.log("Error en login - Status: " + textStatus);  
                console.log("Error: " + errorThrown);
                
                let errorMsg = "Error al iniciar sesión";
                if (xhr.responseJSON && xhr.responseJSON.error) {
                    errorMsg = xhr.responseJSON.error;
                }
                cw.mostrarMensajeModal(errorMsg, "danger");
             }, 
            contentType:'application/json' 
        }); 
    }

    this.cerrarSesion=function(){ 
        $.getJSON("/cerrarSesion",function(){    
            console.log("Sesión cerrada");   
            $.removeCookie("nick");      
        }); 
    } 
}