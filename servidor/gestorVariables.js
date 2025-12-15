const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');
const client = new SecretManagerServiceClient();

async function accessGMAIL_PASS() {
    const name = 'projects/327493815857/secrets/GMAIL_PASS/versions/1'; // SUBIR A VARIABLE DE ENTORNO
    const [version] = await client.accessSecretVersion({
        name: name,
    });
    const datos=version.payload.data.toString("utf8");
    return datos;
}

async function accessGMAIL_USER() {
    const name = 'projects/327493815857/secrets/GMAIL_USER/versions/1'; // SUBIR A VARIABLE DE ENTORNO
    const [version] = await client.accessSecretVersion({
        name: name,
    });
    const datos=version.payload.data.toString("utf8");
    return datos;
}

module.exports.obtenerOptions= async function(callback){
    let options={user:"",pass:""};
    let user = await accessGMAIL_USER();
    let pass = await accessGMAIL_PASS();
    options.user = user;
    options.pass = pass;
    callback(options);
}
