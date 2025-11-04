const datos=require("./cad.js"); 

function Sistema(test){ 
    this.usuarios={}; 
    this.cad=new datos.CAD();

    if (!test.test) {
    this.cad.conectar(function(db){ 
        console.log("Conectado a Mongo Atlas"); 
    }); 
    }

    this.usuarioGoogle=function(usr,callback){ 
        this.cad.buscarOCrearUsuario(usr,function(obj){ 
            callback(obj); 
        }); 
    } 

    this.agregarUsuario=function(nick){ 
        let res={"nick":-1};
        if (!this.usuarios[nick]){
        this.usuarios[nick]=new Usuario(nick);
        res.nick=nick;
        }
        else{
            console.log("el nick "+nick+" está en uso");
        }
        return res;
    } 

    this.obtenerUsuarios=function(){
        return this.usuarios;
    }

    this.usuarioActivo=function(nick){
        let res={"res":false};
        if (this.usuarios[nick]){
            res.res=true;
        }
        return res;
    }

    this.eliminarUsuario=function(nick){
        let res={"nick":-1};
        if (this.usuarios[nick]){
            delete this.usuarios[nick];
            res.nick=nick;
        }
        return res;
    }

    this.numeroUsuarios=function(){
        let res = {"num":0};
        res.num = Object.keys(this.usuarios).length;
        return res;
    }
}

function Usuario(nick){ 
    this.nick=nick; 
} 

module.exports.Sistema=Sistema;