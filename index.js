const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const axios = require('axios');

const port = 3000;
var path = require('path');
const app = express();

var backend = 'http://127.0.0.1:5000';

app.use(session({secret:'asdasdasdasdas'}));
app.use(bodyParser.urlencoded({extend:true}));
app.use(bodyParser.json());
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use('/public', express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, '/views'));
app.use(express.static(__dirname + '/bulma'));


function login(res, motivo) {
    res.render('login', {motivo: motivo});
};

// function sucesso(res, motivo){
//   return <section className="hero is-primary">
//       <div className="hero-body">
//           <p className="title">
//               motivo
//           </p>
//       </div>
//   </section>
// };

app.post('/login',(req, res)=>{
    axios.get(backend + '/login', {
        method: 'get',
        responseType: 'json',
        auth: {
            username: req.body.login,
            password: req.body.password
        }
    }).then((response) => {
        session.login = response.data.login;
        session.token = response.data.token;
        console.log(session.login);
        res.render('menu', {login: session.login});
    }).catch(function (error){
        console.log('ERRO Michel', error);
        res.render('login', {teste: session.login});
    });
});

app.post('/cad_usuario',(req, res)=>{
    var ativo;
    if(req.body.ativo=='on'){
        ativo = true;
    }else{
        ativo= false;
    };

    axios.post(backend + '/usuario', {
            nomeusuario: req.body.nomeusuario,
            login: req.body.login,
            senha: req.body.senha,
            telefone: req.body.telefone,
            email: req.body.email,
            ativo: ativo
    },{
        headers:{
            Authorization: 'Bearer ' + session.token,
            ContentType: 'application/json'
        }
    }).then((response) => {
        res.send('Usuário ' + req.body.nomeusuario + '. Cadastrado com Sucesso!');
        res.render('/menu');
    }).catch(function (error){
        console.log('ERRO Michel', error);
    });
});

app.get('/cad_usuario',(req, res)=>{
    if(session.login){
        console.log(session.login);
        res.render('cad_usuario');
    }else{
        login(res, 'Para acessar essa opção é necessário realizar login!')
    }

});

app.post('/cad_cliente',(req, res)=>{
    var ativo;
    if(req.body.ativo=='on'){
        ativo = true;
    }else{
        ativo= false;
    };

    axios.post(backend + '/cliente', {
        nomecliente: req.body.nomecliente,
        cnpj: req.body.cnpj,
        ie: req.body.ie,
        telefone: req.body.telefone,
        uf: req.body.uf,
        endereco: req.body.endereco,
        numero: req.body.numero,
        cep: req.body.cep,
        ativo: ativo
    },{
        headers:{
            Authorization: 'Bearer ' + session.token,
            ContentType: 'application/json'
        }
    }).then((response) => {
        res.send('Cliente ' + req.body.nomecliente + '. Cadastrado com Sucesso!');
        res.render('/menu');
    }).catch(function (error){
        console.log('ERRO Michel', error);
    });
});
app.get('/cad_cliente',(req, res)=>{
    if(session.login){
        console.log(session.login);
        res.render('cad_cliente');
    }else{
        login(res, 'Para acessar essa opção é necessário realizar login!')
    }

});

app.get('/',(req, res)=>{
    if(session.login){
        console.log(session.login);
        res.render('menu', {login: session.login});
    }else{
        res.render('login');
    }

});

app.listen(port,()=>{
    console.log('Servidor em Execução');
});
