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

// Segurança
app.use(helmet());

// Body parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Arquivos estáticos
app.use(express.static(path.resolve(__dirname, "public")));

// Sessão + Store no Mongo
const sessionOptions = session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-key',
  store: MongoStore.create({ mongoUrl: process.env.CONNECTIONSTRING }),
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7,
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
app.use(middlewareGlobal);
app.use(csrfMiddleware);
app.use(checkCsrfError);

// Rotas
app.use(routes);

// Função para conectar ao MongoDB e iniciar servidor
async function startServer() {
  try {
    await mongoose.connect(process.env.CONNECTIONSTRING);
    console.log('✅ Base de Dados Conectada!');
    
    // Apenas inicia o servidor se não estiver em ambiente serverless
    if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
      const PORT = process.env.PORT || 3000;
      app.listen(PORT, () => {
        console.log(`🚀 Servidor rodando na porta ${PORT}`);
      });
    }
  } catch (err) {
    console.error('❌ Erro ao conectar ao MongoDB:', err.message);
    process.exit(1);
  }
}

// Inicia o servidor
startServer();

// Exporta para Vercel
module.exports = app;