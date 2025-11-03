const mongo=require("mongodb").MongoClient;
const ObjectId=require("mongodb").ObjectId;

function CAD(){ 
    this.usuarios = null;
    
    this.conectar=async function(callback){
        let cad=this;
        let client= new
        mongo("mongodb+srv://ecp:ecp@cluster0.sn3o5ts.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
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
} 

module.exports.CAD=CAD; 