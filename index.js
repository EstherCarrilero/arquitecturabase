const fs=require("fs");
const express = require('express');
const app = express();
const passport=require("passport");
const cookieSession=require("cookie-session");
require("./servidor/passport-setup.js");
const modelo = require("./servidor/modelo.js");
const PORT = process.env.PORT || 3000;
const bodyParser=require("body-parser"); 

let sistema = new modelo.Sistema({test:false});

app.use(express.static(__dirname + "/"));
app.use(cookieSession({
    name: 'Sistema',
    keys: ['key1', 'key2']
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.urlencoded({extended:true})); 
app.use(bodyParser.json()); 

app.get("/auth/google",passport.authenticate('google', { scope: ['profile','email'] }));

app.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/fallo' }),
    function(req, res) {
        res.redirect('/good');
    }
);

app.get("/good", function(request,response){
    let email=request.user.emails[0].value; 
    sistema.usuarioGoogle({"email":email},function(obj){
        response.cookie('nick',obj.email); 
        response.redirect('/'); 
    });
}); 

app.get("/fallo",function(request,response){
    response.send({nick:"nook"})
});

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err && err.stack ? err.stack : err);
    res.status(500).send({ error: 'internal_server_error', message: err && err.message });
});

app.get("/", function(request,response){
   var contenido=fs.readFileSync(__dirname+"/cliente/index.html");
    response.setHeader("Content-type","text/html");
    response.send(contenido);
});

app.listen(PORT, () => {
    console.log(`App está escuchando en el puerto ${PORT}`);
    console.log('Ctrl+C para salir');
});

app.get("/agregarUsuario/:nick",function(request,response){
    let nick=request.params.nick;
    let res=sistema.agregarUsuario(nick);
    response.send(res);
});

app.get("/obtenerUsuarios",function(request,response){
    let res=sistema.obtenerUsuarios();
    response.send(res);
});

app.get("/usuarioActivo/:nick",function(request,response){
    let nick=request.params.nick;
    let res=sistema.usuarioActivo(nick);
    response.send(res);
});

app.get("/numeroUsuarios",function(request,response){
    let res=sistema.numeroUsuarios();
    response.send(res);
});

app.get("/eliminarUsuario/:nick",function(request,response){
    let nick=request.params.nick;
    let res = sistema.eliminarUsuario(nick);
    response.send(res);
});

app.post('/oneTap/callback',  
passport.authenticate('google-one-tap', { failureRedirect: '/fallo' }), 
function(req, res) { 
    // Successful authentication, redirect home. 
    res.redirect('/good'); 
});