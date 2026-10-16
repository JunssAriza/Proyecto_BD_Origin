const API_URL = "https://proyecto-bd-origin.onrender.com";

// Elementos del DOM
const listaProductos = document.getElementById("listaProductos");
const formulario = document.getElementById("formularioProducto");
const productoId = document.getElementById("productoId");
const nombreInput = document.getElementById("nombre");
const precioInput = document.getElementById("precio");
const stockInput = document.getElementById("stock");
const btnGuardar = document.getElementById("btnGuardar");
const btnCancelar = document.getElementById("btnCancelar");
const tituloFormulario = document.getElementById("tituloFormulario");
const formContacto = document.getElementById("formularioContacto");
const formularioAdministrador = document.getElementById("formularioAdministrador");
const listaMensajes = document.getElementById("listaMensajes");
const estadoMensajes = document.getElementById("estadoMensajes");
let claveAdministrador = "";

// 1. Función para consultar los productos y mostrarlos en el DOM (READ)
async function cargarProductos() {
  if (!listaProductos) return;

  try {
    const respuesta = await fetch(`${API_URL}/productos`);
    if (!respuesta.ok) {
      throw new Error(`El servidor respondió con el error ${respuesta.status}.`);
    }

    const productos = await respuesta.json();
    if (!Array.isArray(productos)) {
      throw new Error("La respuesta del servidor no contiene una lista de productos.");
    }

    listaProductos.innerHTML = "";

    if (productos.length === 0) {
      listaProductos.innerHTML = "<p style='color: #64748b;'>No hay productos registrados.</p>";
      return;
    }

    productos.forEach((producto) => {
      const elemento = document.createElement("div");
      elemento.classList.add("producto");

      elemento.innerHTML = `
        <div>
          <h3>${producto.nombre}</h3>
          <p class="producto-precio">Precio: $${producto.precio}</p>
          <p>Stock: ${producto.stock} unidades</p>
        </div>
        <div class="acciones">
          <button class="btn-editar" onclick="cargarEnFormulario(${producto.id}, '${producto.nombre}', ${producto.precio}, ${producto.stock})">Editar</button>
          <button class="btn-eliminar" onclick="eliminarProducto(${producto.id})">Eliminar</button>
        </div>
      `;

      listaProductos.appendChild(elemento);
    });
  } catch (error) {
    console.error("Error al cargar productos:", error);
    listaProductos.innerHTML = "";
    const mensaje = document.createElement("p");
    mensaje.style.color = "#b91c1c";
    mensaje.textContent = `No se pudieron cargar los productos. ${error.message} Revisa que el backend esté activo y la conexión a MySQL.`;
    listaProductos.appendChild(mensaje);
  }
}

// 2. Cargar datos del producto en el formulario para editar (UPDATE - Paso 1)
function cargarEnFormulario(id, nombre, precio, stock) {
  productoId.value = id;
  nombreInput.value = nombre;
  precioInput.value = precio;
  stockInput.value = stock;

  tituloFormulario.textContent = "Editar Producto";
  btnGuardar.textContent = "Actualizar Producto";
  btnCancelar.style.display = "block";
  nombreInput.focus();
}

// Cancelar edición y restaurar formulario
function cancelarEdicion() {
  formulario.reset();
  productoId.value = "";
  tituloFormulario.textContent = "Registrar Producto";
  btnGuardar.textContent = "Guardar Producto";
  btnCancelar.style.display = "none";
}

if (btnCancelar) {
  btnCancelar.addEventListener("click", cancelarEdicion);
}

// 3. Guardar o Actualizar según si hay un ID seleccionado (CREATE o UPDATE)
if (formulario) {
  formulario.addEventListener("submit", async (event) => {
    event.preventDefault(); // Evitar que la página se recargue

    const id = productoId.value;
    const nombre = nombreInput.value;
    const precio = precioInput.value;
    const stock = stockInput.value;

    try {
      if (id) {
        // MODO ACTUALIZAR (PUT)
        await fetch(`${API_URL}/productos/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre, precio, stock }),
        });
      } else {
        // MODO CREAR (POST)
        await fetch(`${API_URL}/productos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre, precio, stock }),
        });
      }

      cancelarEdicion(); // Limpiar formulario y restaurar botones
      cargarProductos(); // Refrescar la lista en pantalla
    } catch (error) {
      console.error("Error al guardar el producto:", error);
    }
  });
}

// 4. Eliminar un producto (DELETE)
async function eliminarProducto(id) {
  const confirmar = confirm("¿Deseas eliminar este producto de la base de datos?");
  if (!confirmar) return;

  try {
    await fetch(`${API_URL}/productos/${id}`, {
      method: "DELETE",
    });

    // Si estábamos editando ese mismo producto, cancelamos la edición
    if (productoId.value == id) {
      cancelarEdicion();
    }

    cargarProductos(); // Refrescar la lista en pantalla
  } catch (error) {
    console.error("Error al eliminar producto:", error);
  }
}

// 5. Formulario de contacto (demostrativo en contacto.html)
if (formContacto) {
  formContacto.addEventListener("submit", async (e) => {
    e.preventDefault();

    const datos = {
      nombre: document.getElementById("nombre").value.trim(),
      correo: document.getElementById("email").value.trim(),
      asunto: document.getElementById("asunto").value.trim(),
      mensaje: document.getElementById("mensaje").value.trim()
    };

    try {
      const respuesta = await fetch(`${API_URL}/contactanos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(datos)
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(resultado.mensaje || "Error al guardar el mensaje");
      }

      alert("¡Mensaje enviado correctamente!");
      formContacto.reset();

    } catch (error) {
      console.error("Error al enviar contacto:", error);
      const detalle = error instanceof Error ? error.message : "Error desconocido";
      alert(`No se pudo enviar el mensaje. ${detalle}`);
    }
  });
}

async function cargarMensajes() {
  estadoMensajes.textContent = "Cargando mensajes...";
  listaMensajes.replaceChildren();

  try {
    const respuesta = await fetch(`${API_URL}/contactanos`, {
      headers: { "X-Admin-Password": claveAdministrador }
    });
    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.mensaje || "No se pudieron cargar los mensajes.");
    }
    if (!Array.isArray(resultado)) {
      throw new Error("La respuesta del servidor no contiene una lista de mensajes.");
    }

    if (resultado.length === 0) {
      estadoMensajes.textContent = "No hay mensajes recibidos.";
      return;
    }

    estadoMensajes.textContent = "";
    resultado.forEach((mensaje) => {
      const tarjetaMensaje = document.createElement("article");
      tarjetaMensaje.className = "mensaje-contacto";

      const titulo = document.createElement("h3");
      titulo.textContent = mensaje.asunto;

      const remitente = document.createElement("p");
      remitente.textContent = mensaje.nombre;

      const correo = document.createElement("p");
      correo.className = "correo-mensaje";
      correo.textContent = mensaje.correo;

      const contenido = document.createElement("p");
      contenido.className = "detalle-mensaje";
      contenido.textContent = mensaje.mensaje;

      const botonEliminar = document.createElement("button");
      botonEliminar.type = "button";
      botonEliminar.className = "btn btn-eliminar-mensaje";
      botonEliminar.textContent = "Eliminar mensaje";
      botonEliminar.addEventListener("click", () => eliminarMensaje(mensaje.id));

      tarjetaMensaje.append(titulo, remitente, correo, contenido, botonEliminar);
      listaMensajes.appendChild(tarjetaMensaje);
    });
  } catch (error) {
    console.error("Error al cargar mensajes de contacto:", error);
    estadoMensajes.textContent = error.message;
  }
}

async function eliminarMensaje(id) {
  if (!confirm("¿Deseas eliminar este mensaje?")) return;

  try {
    const respuesta = await fetch(`${API_URL}/contactanos/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { "X-Admin-Password": claveAdministrador }
    });
    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.mensaje || "No se pudo eliminar el mensaje.");
    }

    await cargarMensajes();
  } catch (error) {
    console.error("Error al eliminar mensaje de contacto:", error);
    estadoMensajes.textContent = error.message;
  }
}

if (formularioAdministrador) {
  formularioAdministrador.addEventListener("submit", async (event) => {
    event.preventDefault();
    claveAdministrador = document.getElementById("claveAdministrador").value;
    await cargarMensajes();
  });
}

// Llamado inicial al cargar la página
cargarProductos();