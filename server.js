require('dotenv').config();

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const csrf = require('csurf');
const path = require("path");
const helmet = require('helmet');
const routes = require("./routes");
const { middlewareGlobal, checkCsrfError, csrfMiddleware } = require("./src/middlewares/middleware");

// Conexão com MongoDB (tratando erro para não quebrar função serverless)
(async () => {
  try {
    await mongoose.connect(process.env.CONNECTIONSTRING);
    console.log('✅ Base de Dados Conectada!');
    app.emit("pronto");
  } catch (err) {
    console.error('❌ Erro ao conectar ao MongoDB:', err.message);
  }
})();

// Segurança
app.use(helmet());

// Body parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Arquivos estáticos
app.use(express.static(path.resolve(__dirname, "public")));

// Sessão + Store no Mongo
const sessionOptions = session({
  secret: 'dcvgbhjbhnujimkol',
  store: MongoStore.create({ mongoUrl: process.env.CONNECTIONSTRING }),
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 dias
    httpOnly: true
  }
});
app.use(sessionOptions);

// Flash messages
app.use(flash());

// Views
app.set("views", path.resolve(__dirname, "src", "views"));
app.set("view engine", "ejs");

// CSRF
app.use(csrf());

// Middlewares globais
app.use(middlewareGlobal, checkCsrfError, csrfMiddleware);

// Rotas
app.use(routes);

// Apenas loga quando o app está pronto
app.on("pronto", () => {
  console.log("🚀 Servidor pronto e conectado ao banco de dados.");
});

// Exporta para Vercel
module.exports = app;
