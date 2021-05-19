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
app.use('/bulma', express.static(path.join(__dirname, '/bulma')))
app.set('views', path.join(__dirname, '/views'));


function login(res, motivo) {
    res.render('login', {mensagem: motivo});
};

function index(req, res, mensagem, tipo) {
    if(req.session.login){
        res.session = req.session;
        var msg;
        axios.get(backend + '/monitoramento', {
            headers:{
                Authorization: 'Bearer ' + res.session.token,
                ContentType: 'application/json'
            },
            validateStatus: function (status) {
                return status >= 200 && status < 300; // default
            }
        }).then((responseget) => {
            res.render('index', {login: res.session.login, mensagem: mensagem, tipo: tipo, monitoramentos: responseget.data.monitoramentos});
        }).catch(function (error){
            console.log(error);
            msg = 'Erro desconhecido no Servidor!';
            res.render('index', {login: res.session.login, mensagem: mensagem + '||' + msg, tipo: tipo, monitoramentos: null});
        });
    }else{
        login(res, 'Para acessar essa opção é necessário realizar login!')
    }
};


// ------------------------LOGIN
app.post('/login',(req, res)=>{
    axios.get(backend + '/login', {
        method: 'get',
        responseType: 'json',
        auth: {
            username: req.body.login,
            password: req.body.password
        }
    }).then((response) => {
        axios.get(backend + '/usuario_login/' + req.body.login, {
            headers:{
                Authorization: 'Bearer ' + response.data.token,
                ContentType: 'application/json'
            },
            validateStatus: function (status) {
                return status >= 200 && status < 300; // default
            }
        }).then((responseget) => {
            req.session.login = response.data.login;
            req.session.token = response.data.token;
            req.session.idusuario = responseget.data.idusuario;
            index(req, res, null, 1);
        }).catch(function (error){
            var msg;
            msg = 'Erro desconhecido no Servidor!';
            res.render('login', {mensagem: msg});
        });

    }).catch(function (error){
        res.render('login', {mensagem: 'Login ou Senha inválidos!'});
    });

});

//-------------- USUARIO
app.get('/usuario',(req, res)=>{
    if(req.session.login){
        res.session = req.session;
        var msg;
        axios.get(backend + '/usuario', {
            headers:{
                Authorization: 'Bearer ' + res.session.token,
                ContentType: 'application/json'
            },
            validateStatus: function (status) {
                return status >= 200 && status < 300; // default
            }
        }).then((responseget) => {
            res.render('usuario', {usuarios: responseget.data.usuarios});
        }).catch(function (error){
            console.log(error);
            msg = 'Erro desconhecido no Servidor!';
            index(req, res, msg, 2);
        });
    }else{
        login(res, 'Para acessar essa opção é necessário realizar login!')
    }

});

app.get('/cad_usuario',(req, res)=>{
    if(req.session.login){
        res.session = req.session;
        res.render('cad_usuario');
    }else{
        login(res, 'Para acessar essa opção é necessário realizar login!')
    }

});

app.get('/cad_usuario/:id',(req, res)=>{
    if(req.session.login){
        res.session = req.session;
        if(req.params.id !='index'){
            var msg;
            axios.get(backend + '/usuario/' + req.params.id, {
                headers:{
                    Authorization: 'Bearer ' + res.session.token,
                    ContentType: 'application/json'
                },
                validateStatus: function (status) {
                    return status >= 200 && status < 300; // default
                }
            }).then((responseget) => {
                res.render('edit_usuario', {idusuario: responseget.data.usuario.idusuario, nomeusuario: responseget.data.usuario.nomeusuario , login: responseget.data.usuario.login, telefone: responseget.data.usuario.telefone, email: responseget.data.usuario.email, ativo: responseget.data.usuario.ativo });
            }).catch(function (error){
                console.log(error);
                msg = 'Erro desconhecido no Servidor!';
                index(req, res, msg, 2);
            });}
        else{
            index(req, res, null, 1)
        }
    }else{
        login(res, 'Para acessar essa opção é necessário realizar login!')
    }

});

app.post('/cad_usuario',(req, res)=>{
    if(req.session.login){
        res.session = req.session;
        var ativo;
        var msg;
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
                Authorization: 'Bearer ' + res.session.token,
                ContentType: 'application/json'
            },
            validateStatus: function (status) {
                return status >= 200 && status < 300; // default
            }
        }).then((response) => {
            index(req, res, 'Usuário ' + req.body.nomeusuario + '. Cadastrado com Sucesso!', 1);
        }).catch(function (error){
            if(error.response){
                if(error.response.status==418) {
                    msg = 'Login informado já está em uso!';
                };
            }else{
                msg = 'Erro desconhecido no Servidor!';
            };
            res.render('erro_cad_usuario', {mensagem: msg, nomeusuario: req.body.nomeusuario , login: req.body.login, telefone: req.body.telefone, email: req.body.email, ativo: req.body.ativo });
        });
    }else{
        login(res, 'Para acessar essa opção é necessário realizar login!')
    }
});

app.post('/cad_usuario/:id',(req, res)=>{
    if(req.session.login){
        res.session = req.session;
        var ativo;
        if(req.body.ativo=='on'){
            ativo = true;
        }else{
            ativo= false;
        };

        axios.put(backend + '/usuario/' + req.params.id, {
            idusuario: req.params.id,
            nomeusuario: req.body.nomeusuario,
            login: req.body.login,
            senha: req.body.senha,
            telefone: req.body.telefone,
            email: req.body.email,
            ativo: ativo
        },{
            headers:{
                Authorization: 'Bearer ' + res.session.token,
                ContentType: 'application/json'
            },
            validateStatus: function (status) {
                return status >= 200 && status < 300; // default
            }
        }).then((response) => {
            index(req, res, 'Usuário ' + req.body.nomeusuario + '. Atualizado com Sucesso!', 1);
        }).catch(function (error){
            console.log(error);
            msg = 'Erro desconhecido no Servidor!';
            index(req, res, msg, 2);
        });
    }else{
        login(res, 'Para acessar essa opção é necessário realizar login!')
    }
});

//------------------------CLIENTE
app.get('/cliente',(req, res)=>{
    if(req.session.login){
        res.session = req.session;
        var msg;
        axios.get(backend + '/cliente', {
            headers:{
                Authorization: 'Bearer ' + res.session.token,
                ContentType: 'application/json'
            },
            validateStatus: function (status) {
                return status >= 200 && status < 300; // default
            }
        }).then((responseget) => {
            res.render('cliente', {clientes: responseget.data.clientes});
        }).catch(function (error){
            console.log(error);
            msg = 'Erro desconhecido no Servidor!';
            index(req, res, msg, 2);
        });
    }else{
        login(res, 'Para acessar essa opção é necessário realizar login!')
    }

});

app.get('/cad_cliente',(req, res)=>{
    if(req.session.login){
        res.session = req.session;
        res.render('cad_cliente');
    }else{
        login(res, 'Para acessar essa opção é necessário realizar login!')
    }

});


app.get('/cad_cliente/:id',(req, res)=>{
    if(req.session.login){
        res.session = req.session;
        if(req.params.id !='index'){
            var msg;
            axios.get(backend + '/cliente/' + req.params.id, {
                headers:{
                    Authorization: 'Bearer ' + res.session.token,
                    ContentType: 'application/json'
                },
                validateStatus: function (status) {
                    return status >= 200 && status < 300; // default
                }
            }).then((responseget) => {
                res.render('edit_cliente', {idcliente: responseget.data.cliente.idcliente, nomecliente: responseget.data.cliente.nomecliente , cnpj: responseget.data.cliente.cnpj, ie: responseget.data.cliente.ie, telefone: responseget.data.cliente.telefone, uf: responseget.data.cliente.uf, endereco:responseget.data.cliente.endereco, numero: responseget.data.cliente.numero, cep: responseget.data.cliente.cep, ativo: responseget.data.cliente.ativo });
            }).catch(function (error){
                console.log(error);
                msg = 'Erro desconhecido no Servidor!';
                index(req, res, msg, 2);
            });}
        else{
            index(req, res, null, 1)
        }
    }else{
        login(res, 'Para acessar essa opção é necessário realizar login!')
    }
});

app.post('/cad_cliente',(req, res)=>{
    if(req.session.login){
        res.session = req.session;
        var ativo;
        var msg;
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
                Authorization: 'Bearer ' + res.session.token,
                ContentType: 'application/json'
            },
            validateStatus: function (status) {
                return status >= 200 && status < 300; // default
            }
        }).then((response) => {
            index(req, res, 'Cliente ' + req.body.nomecliente + '. Cadastrado com Sucesso!', 1);
        }).catch(function (error){
            msg = 'Erro desconhecido no Servidor!';
            res.render('erro_cad_cliente', {mensagem: msg, nomecliente: req.body.nomecliente , cnpj: req.body.cnpj, ie: req.body.ie, telefone: req.body.telefone, uf: req.body.uf, endereco: req.body.endereco, numero: req.body.numero, cep: req.body.cep, ativo: req.body.ativo });
        });
    }else{
        login(res, 'Para acessar essa opção é necessário realizar login!')
    }
});
app.post('/cad_cliente/:id',(req, res)=>{
    if(req.session.login){
        res.session = req.session;
        var ativo;
        var msg;
        if(req.body.ativo=='on'){
            ativo = true;
        }else{
            ativo= false;
        };

        axios.put(backend + '/cliente/' + req.params.id, {
            idcliente:  req.params.id,
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
                Authorization: 'Bearer ' + res.session.token,
                ContentType: 'application/json'
            },
            validateStatus: function (status) {
                return status >= 200 && status < 300; // default
            }
        }).then((response) => {
            index(req, res, 'Cliente ' + req.body.nomecliente + '. Atualizado com Sucesso!', 1);
        }).catch(function (error){
            console.log(error);
            msg = 'Erro desconhecido no Servidor!';
            index(req, res, msg, 2);
        });
    }else{
        login(res, 'Para acessar essa opção é necessário realizar login!')
    }
});


//----------------------BANCO
app.get('/banco',(req, res)=>{
    if(req.session.login){
        res.session = req.session;
        var msg;
        axios.get(backend + '/banco', {
            headers:{
                Authorization: 'Bearer ' + res.session.token,
                ContentType: 'application/json'
            },
            validateStatus: function (status) {
                return status >= 200 && status < 300; // default
            }
        }).then((responseget) => {
            res.render('banco', {bancos: responseget.data.bancos});
        }).catch(function (error){
            console.log(error);
            msg = 'Erro desconhecido no Servidor!';
            index(req, res, msg, 2);
        });
    }else{
        login(res, 'Para acessar essa opção é necessário realizar login!')
    }

});

app.get('/cad_banco',(req, res)=>{
    if(req.session.login){
        res.session = req.session;
        axios.get(backend + '/cliente/ativos', {
            headers:{
                Authorization: 'Bearer ' + res.session.token,
                ContentType: 'application/json'
            },
            validateStatus: function (status) {
                return status >= 200 && status < 300; // default
            }
        }).then((responseget_cliente) => {
            console.log(responseget_cliente);
            res.render('cad_banco', {clientes: responseget_cliente.data.clientes });
        }).catch(function (error){
            res.render('cad_banco', {clientes: null });
        });
    }else{
        login(res, 'Para acessar essa opção é necessário realizar login!')
    }

});
app.get('/cad_banco/:id',(req, res)=>{
    if(req.session.login){
        res.session = req.session;
        if(req.params.id !='index'){
            var msg;
            axios.get(backend + '/banco/' + req.params.id, {
                headers:{
                    Authorization: 'Bearer ' + res.session.token,
                    ContentType: 'application/json'
                },
                validateStatus: function (status) {
                    return status >= 200 && status < 300; // default
                }
            }).then((responseget) => {
                axios.get(backend + '/cliente/ativos', {
                    headers:{
                        Authorization: 'Bearer ' + res.session.token,
                        ContentType: 'application/json'
                    },
                    validateStatus: function (status) {
                        return status >= 200 && status < 300; // default
                    }
                }).then((responseget_cliente) => {
                    res.render('edit_banco', {mensagem: null, idbanco: responseget.data.banco.idbanco, nomebanco: responseget.data.banco.nomebanco , tipo: responseget.data.banco.tipo, protocolo: responseget.data.banco.protocolo, ip: responseget.data.banco.ip, porta: responseget.data.banco.porta, usuario :responseget.data.banco.usuario, tls: responseget.data.banco.tls, senha: responseget.data.banco.senha, ativo: responseget.data.banco.ativo, idcliente: responseget.data.banco.idcliente, clientes: responseget_cliente.data.clientes });
                }).catch(function (error){
                    res.render('edit_banco', {mensagem: null, idbanco: responseget.data.banco.idbanco, nomebanco: responseget.data.banco.nomebanco , tipo: responseget.data.banco.tipo, protocolo: responseget.data.banco.protocolo, ip: responseget.data.banco.ip, porta: responseget.data.banco.porta, usuario :responseget.data.banco.usuario, tls: responseget.data.banco.tls, senha: responseget.data.banco.senha, ativo: responseget.data.banco.ativo, idcliente: responseget.data.banco.idcliente, clientes: null });
                });
            }).catch(function (error){
                console.log(error);
                msg = 'Erro desconhecido no Servidor!';
                index(req, res, msg, 2);
            });}
        else{
            index(req, res, null, 1)
        }
    }else{
        login(res, 'Para acessar essa opção é necessário realizar login!')
    }
});

app.post('/cad_banco',(req, res)=>{
    if(req.session.login){
        res.session = req.session;
        var ativo, tls, idcliente, msg;
        if(req.body.ativo=='on'){
            ativo = true;
        }else{
            ativo= false;
        }
        if(req.body.tls=='on'){
            tls = true;
        }else{
            tls= false;
        }
        if(req.body.idcliente=='null'){
            idcliente = null;
        }else{
            idcliente = parseInt(req.body.idcliente);
        }

        axios.post(backend + '/banco', {
            nomebanco: req.body.nomebanco,
            protocolo: req.body.protocolo,
            ip: req.body.ip,
            porta: req.body.porta,
            ativo: ativo,
            usuario: req.body.usuario,
            senha: req.body.senha,
            tls: tls,
            tipo: req.body.tipo,
            idcliente: idcliente

        },{
            headers:{
                Authorization: 'Bearer ' + res.session.token,
                ContentType: 'application/json'
            },
            validateStatus: function (status) {
                return status >= 200 && status < 300; // default
            }
        }).then((response) => {
            index(req, res, 'Banco ' + req.body.nomebanco + '. Cadastrado com Sucesso!', 1);
        }).catch(function (error){
            msg = 'Erro desconhecido no Servidor!';
            res.render('erro_cad_banco', {mensagem: msg, nomebanco: req.body.nomebanco , tipo: req.body.tipo, protocolo: req.body.protocolo, ip: req.body.ip, porta: req.body.porta, usuario: req.body.usuario, tls: req.body.tls, ativo: req.body.ativo});
        });
    }else{
        login(res, 'Para acessar essa opção é necessário realizar login!')
    }
});
app.post('/cad_banco/:id',(req, res)=>{
    if(req.session.login){
        res.session = req.session;
        var ativo, tls, idcliente, msg;
        if(req.body.ativo=='on'){
            ativo = true;
        }else{
            ativo= false;
        }
        if(req.body.tls=='on'){
            tls = true;
        }else{
            tls= false;
        }
        if(req.body.idcliente=='null'){
            idcliente = null;
        }else{
            idcliente= parseInt(req.body.idcliente);
        }

        axios.put(backend + '/banco/' + req.params.id, {
            idbanco: req.params.id,
            nomebanco: req.body.nomebanco,
            protocolo: req.body.protocolo,
            ip: req.body.ip,
            porta: req.body.porta,
            ativo: ativo,
            usuario: req.body.usuario,
            senha: req.body.senha,
            tls: tls,
            tipo: req.body.tipo,
            idcliente: idcliente

        },{
            headers:{
                Authorization: 'Bearer ' + res.session.token,
                ContentType: 'application/json'
            },
            validateStatus: function (status) {
                return status >= 200 && status < 300; // default
            }
        }).then((response) => {
            index(req, res, 'Banco ' + req.body.nomebanco + '. Atualizado com Sucesso!', 1);
        }).catch(function (error){
            msg = 'Erro desconhecido no Servidor!';
            index(req, res, msg, 2);
        });
    }else{
        login(res, 'Para acessar essa opção é necessário realizar login!')
    }
});
//-------------------ALOCAR
app.get('/alocar/:id',(req, res)=>{
    if(req.session.login){
        res.session = req.session;
        if(req.params.id !='index'){
            var msg;
            axios.put(backend + '/monitoramento/' + req.params.id, {
                idusuarioalocado: parseInt(res.session.idusuario)
            },{
                headers:{
                    Authorization: 'Bearer ' + res.session.token,
                    ContentType: 'application/json'
                },
                validateStatus: function (status) {
                    return status >= 200 && status < 300; // default
                }
            }).then((response) => {
                index(req, res, null, 1);
            }).catch(function (error){
                msg = 'Erro desconhecido no Servidor!';
                index(req, res, msg, 2);
            });
        }else{
            index(req, res, null, 1)
        }

    }else{
        login(res, 'Para acessar essa opção é necessário realizar login!')
    }
});

app.get('/historico',(req, res)=>{
    if(req.session.login){
        res.session = req.session;
        axios.get(backend + '/historico_banco', {
            headers:{
                Authorization: 'Bearer ' + res.session.token,
                ContentType: 'application/json'
            },
            validateStatus: function (status) {
                return status >= 200 && status < 300; // default
            }
        }).then((response) => {
            console.log(response.data.bancos);
            res.render('historico', {bancos: response.data.bancos });
        }).catch(function (error){
            index(req, res, 'Erro desconhecido no servidor', 2);
        });
    }else{
        login(res, 'Para acessar essa opção é necessário realizar login!')
    }

});

//-------------------- HOME
app.get('/',(req, res)=>{
    if(req.session.login){
        index(req, res, null, 1);
    }else{
        res.render('login', {mensagem: null});
    }

});

app.get('/meus_dados',(req, res)=>{
    if(req.session.login){
        res.session = req.session;
        axios.get(backend + '/usuario/' + res.session.idusuario, {
            headers:{
                Authorization: 'Bearer ' + res.session.token,
                ContentType: 'application/json'
            },
            validateStatus: function (status) {
                return status >= 200 && status < 300; // default
            }
        }).then((responseget) => {
            var ativo;
            if(responseget.data.usuario.ativo){
                ativo = 'on';
            }else{
                ativo= 'off';
            };
            res.render('edit_usuario', {idusuario: responseget.data.usuario.idusuario, nomeusuario: responseget.data.usuario.nomeusuario, login: responseget.data.usuario.login, telefone: responseget.data.usuario.telefone, email: responseget.data.usuario.email, ativo: ativo});
        }).catch(function (error){
            var msg;
            msg = 'Erro desconhecido no Servidor!';
            res.session.idusuario = null
            res.session.login = null
            res.session.token = null
            res.render('login', {mensagem: msg});
        });
    }else{
        login(res, 'Para acessar essa opção é necessário realizar login!')
    }
});

//------------LOGOUT
app.get('/sair',(req, res)=>{
    req.session.idusuario = null
    req.session.login = null
    req.session.token = null
    res.render('login', {mensagem: null});

});

//------------MENU
app.get('/menu',(req, res)=>{
    res.render('menu', {mensagem: null});

});

//------------INDEX
app.get('/index',(req, res)=>{
    index(req, res, null, 1);
});

app.listen(port,()=>{
    console.log('Servidor em Execução');
});
