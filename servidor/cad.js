const mongo=require("mongodb").MongoClient;
const ObjectId=require("mongodb").ObjectId;

function CAD(){ 
    this.usuarios = null;
    
    this.conectar=async function(callback){
        let cad=this;
        let client= new mongo(process.env.MONGODB_URI);
        await client.connect();
        const database=client.db("sistema");
        cad.usuarios=database.collection("usuarios");
        callback(database);
    }

    this.buscarOCrearUsuario=function(usr,callback){
        buscarOCrear(this.usuarios,usr)
            .then(value => callback(value))
            .catch(err => {
                console.error("CAD.buscarOCrearUsuario: fallo en buscarOCrear:", err && err.message ? err.message : err);
                callback(null);
            }); 
    } 

    async function buscarOCrear(coleccion,criterio){ 
        try {
            const res = await coleccion.findOneAndUpdate(
                criterio,
                { $set: criterio },
                { upsert: true, returnDocument: "after", projection: { email: 1 }, writeConcern: { w: 1 } }
            );
            const email = res && res.value && res.value.email ? res.value.email : (criterio && criterio.email);
            if (!email) {
                return null;
            }
            return { email };
        } catch (e) {
            console.error("buscarOCrear: error:", e && e.message ? e.message : e);
            return null;
        }
    } 

    this.buscarUsuario=function(obj,callback){ 
        buscar(this.usuarios,obj,callback); 
    }

    this.insertarUsuario=function(usuario,callback){ 
        insertar(this.usuarios,usuario,callback); 
    } 

    async function buscar(coleccion, criterio, callback){ 
        try {
            const usuarios = await coleccion.find(criterio).toArray();
            if (usuarios.length === 0){ 
                callback(undefined);              
            } else { 
                callback(usuarios[0]); 
            } 
        } catch(error) {
            console.error("buscar: error:", error);
            callback(undefined);
        }
    } 

    async function insertar(coleccion, elemento, callback){ 
        try {
            await coleccion.insertOne(elemento);
            console.log("Nuevo usuario registrado:", elemento.email);
            callback(elemento); 
        } catch(err) {
            console.error("insertar: error:", err);
            callback(null);
        }
    } 

    this.actualizarUsuario=function(obj,callback){ 
        actualizar(this.usuarios,obj,callback); 
    } 

    function actualizar(coleccion,obj,callback){ 
        coleccion.findOneAndUpdate({_id:ObjectId(obj._id)}, {$set: obj}, 
        {upsert: false,returnDocument:"after",projection:{email:1}}, 
        function(err,doc) { 
            if (err) { throw err; } 
            else {  
                console.log("Elemento actualizado");  
                callback({email:doc.value.email}); 
            } 
        });    
    } 
} 

module.exports.CAD=CAD; 