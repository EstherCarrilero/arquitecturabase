// Cargar variables de entorno
require('dotenv').config();

const fs=require("fs");
const express = require('express');
const app = express();
const httpServer = require('http').Server(app); 
const { Server } = require("socket.io"); 
const passport=require("passport");
const cookieSession=require("cookie-session");
const LocalStrategy = require('passport-local').Strategy; 
require("./servidor/passport-setup.js");
const modelo = require("./servidor/modelo.js");
const PORT = process.env.PORT || 3000;
const bodyParser=require("body-parser"); 
const moduloWS = require("./servidor/servidorWS.js"); 

let sistema = new modelo.Sistema({test:false});
let ws = new moduloWS.WSServer(); 
let io = new Server(); 

httpServer.listen(PORT, () => { 
    console.log(`App está escuchando en el puerto ${PORT}`); 
    console.log('Ctrl+C para salir'); 
}); 
io.listen(httpServer); 
ws.lanzarServer(io, sistema); 

const haIniciado=function(request,response,next){ 
    if (request.user){ 
        next(); 
    } 
    else{ 
        response.redirect("/") 
    } 
} 

app.use(express.static(__dirname + "/"));
app.use(cookieSession({
    name: 'Sistema',
    keys: [process.env.SESSION_SECRET || 'key1', 'key2']
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy({usernameField:"email",passwordField:"password"}, 
    function(email,password,done){ 
        sistema.iniciarSesion({"email":email,"password":password},function(user){ 
            return done(null,user);       
        }) 
    } 
)); 

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
   // Reemplazar placeholders con variables de entorno
   contenido = contenido.toString()
       .replace("PLACEHOLDER_CLIENT_ID", process.env.GOOGLE_CLIENT_ID)
       .replace("PLACEHOLDER_LOGIN_URI", `${process.env.APP_URL || 'http://localhost:3000'}/oneTap/callback`);
    response.setHeader("Content-type","text/html");
    response.send(contenido);
});

app.listen(PORT, () => {
    console.log(`App está escuchando en el puerto ${PORT}`);
    console.log('Ctrl+C para salir');
});

app.get("/agregarUsuario/:nick",haIniciado,function(request,response){
    let nick=request.params.nick;
    let res=sistema.agregarUsuario(nick);
    response.send(res);
});

app.get("/obtenerUsuarios",haIniciado,function(request,response){
    let res=sistema.obtenerUsuarios();
    response.send(res);
});

app.get("/usuarioActivo/:nick",haIniciado,function(request,response){
    let nick=request.params.nick;
    let res=sistema.usuarioActivo(nick);
    response.send(res);
});

app.get("/numeroUsuarios",haIniciado,function(request,response){
    let res=sistema.numeroUsuarios();
    response.send(res);
});

app.get("/eliminarUsuario/:nick",haIniciado,function(request,response){
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

app.post("/registrarUsuario", function(request, response){ 
    const { email, password, nombre, apellidos } = request.body;
    
    console.log("Intento de registro:", email);
    
    sistema.registrarUsuario({
        email,
        password,
        nombre,
        apellidos
    }, function(res){ 
        if (res && res.email && res.email !== -1) {
            // Registro exitoso
            response.send({
                nick: res.email,
                email: res.email,
                nombre: res.nombre,
                apellidos: res.apellidos
            }); 
        } else {
            // Error en registro
            response.status(400).send({
                nick: -1,
                error: res.error || "Error al registrar usuario"
            });
        }
    }); 
});

app.post("/iniciarSesion", passport.authenticate("local",{failureRedirect:"/fallo",successRedirect: "/ok"}), function(request, response){ 
    const { email, password } = request.body;
    
    console.log("Intento de login:", email);
    
    sistema.iniciarSesion({
        email,
        password
    }, function(res){ 
        if (res && res.nick && res.nick !== -1) {
            // Login exitoso
            response.send({
                nick: res.nick,
                email: res.email,
                nombre: res.nombre,
                apellidos: res.apellidos
            }); 
        } else {
            // Error en login
            response.status(401).send({
                nick: -1,
                error: res.error || "Credenciales incorrectas"
            });
        }
    }); 
}); 

app.get("/confirmarUsuario/:email/:key",function(request,response){ 
  let email=request.params.email; 
  let key=request.params.key; 
  sistema.confirmarUsuario({"email":email,"key":key},function(usr){ 
    if (usr.email!=-1){ 
        response.cookie('nick',usr.email); 
    } 
    response.redirect('/'); 
  });
});

app.get("/ok",function(request,response){ 
    response.send({nick:request.user.email}) 
}); 

app.get("/cerrarSesion",haIniciado,function(request,response){ 
    let nick=request.user.nick; 
    request.logout(); 
    response.redirect("/"); 
    if (nick){ 
        sistema.eliminarUsuario(nick); 
    } 
}); 