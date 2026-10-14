const mysql = require('mysql2');

// Configuracion de la conexion a la base de datos mysql
const conexion = mysql.createConnection({
    host: 'localhost',  //Servidor local
    user: 'root',       //Usuario de MySql (Por defecto en XAMPP)
    database: 'tienda'  //Nombre de la base de datos
});

// Comprobar si la conexion fue exitosa
conexion.connect((error) => {
    if (error) {
        console.error("Error al conectar con MySql",error);
        return;
    }
    console.log("Conexion exitosa a MySql");
});
// Exportar la conexion para poder usarla en otros archivos
module.exports = conexion;