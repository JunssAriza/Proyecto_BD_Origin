const API_URL = "https://proyecto-bd-2.onrender.com";

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

// 1. Función para consultar los productos y mostrarlos en el DOM (READ)
async function cargarProductos() {
  if (!listaProductos) return;

  try {
    const respuesta = await fetch(`${API_URL}/productos`);
    const productos = await respuesta.json();

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

// 5. Enviar un mensaje de contacto
if (formContacto) {
  const estadoContacto = document.getElementById("estadoContacto");
  const btnEnviarContacto = document.getElementById("btnEnviarContacto");

  formContacto.addEventListener("submit", async (event) => {
    event.preventDefault();

    const datos = Object.fromEntries(new FormData(formContacto).entries());
    const mostrarEstado = (mensaje, tipo) => {
      if (!estadoContacto) return;
      estadoContacto.textContent = mensaje;
      estadoContacto.className = `estado-contacto ${tipo}`;
    };

    btnEnviarContacto.disabled = true;
    mostrarEstado("Enviando tu mensaje...", "cargando");

    try {
      const respuesta = await fetch(`${API_URL}/contacto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });
      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(resultado.mensaje || "No se pudo enviar el mensaje");
      }

      mostrarEstado(resultado.mensaje, "exito");
      formContacto.reset();
      if (document.getElementById("listaMensajesContacto")) {
        await cargarMensajesContacto();
      }
    } catch (error) {
      console.error("Error al enviar el mensaje de contacto:", error);
      mostrarEstado(
        error instanceof Error && !(error instanceof TypeError)
          ? error.message
          : "No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.",
        "error"
      );
    } finally {
      btnEnviarContacto.disabled = false;
    }
  });
}

async function cargarMensajesContacto() {
  const estado = document.getElementById("estadoHistorialContacto");
  const lista = document.getElementById("listaMensajesContacto");
  if (!estado || !lista) return;

  estado.textContent = "Cargando mensajes...";
  estado.className = "estado-contacto cargando";

  try {
    const respuesta = await fetch(`${API_URL}/contacto/mensajes`);
    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.mensaje || "No se pudieron cargar los mensajes");
    }

    lista.replaceChildren();
    if (resultado.length === 0) {
      estado.textContent = "Todavía no hay mensajes recibidos.";
      estado.className = "estado-contacto";
      return;
    }

    resultado.forEach((mensaje) => {
      const tarjeta = document.createElement("article");
      tarjeta.className = "mensaje-contacto";

      const titulo = document.createElement("h3");
      titulo.textContent = mensaje.asunto;

      const meta = document.createElement("p");
      meta.className = "mensaje-meta";
      const fecha = new Date(mensaje.fecha_creacion);
      const fechaTexto = Number.isNaN(fecha.getTime())
        ? "Fecha no disponible"
        : fecha.toLocaleString("es");
      meta.textContent = `${mensaje.nombre} · ${fechaTexto}`;

      const cuerpo = document.createElement("p");
      cuerpo.className = "mensaje-contenido";
      cuerpo.textContent = mensaje.mensaje;

      const botonEliminar = document.createElement("button");
      botonEliminar.type = "button";
      botonEliminar.className = "btn-eliminar-mensaje";
      botonEliminar.textContent = "Eliminar mensaje";
      botonEliminar.addEventListener("click", () => eliminarMensajeContacto(mensaje.id));

      tarjeta.append(titulo, meta, cuerpo, botonEliminar);
      lista.appendChild(tarjeta);
    });

    estado.textContent = `${resultado.length} mensaje${resultado.length === 1 ? "" : "s"}.`;
    estado.className = "estado-contacto exito";
  } catch (error) {
    console.error("Error al cargar los mensajes de contacto:", error);
    estado.textContent =
      error instanceof Error && !(error instanceof TypeError)
        ? error.message
        : "No se pudo conectar con el servidor. Inténtalo de nuevo.";
    estado.className = "estado-contacto error";
  }
}

async function eliminarMensajeContacto(id) {
  if (!confirm("¿Deseas eliminar este mensaje de forma permanente?")) return;

  try {
    const respuesta = await fetch(`${API_URL}/contacto/mensajes/${id}`, {
      method: "DELETE",
    });
    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.mensaje || "No se pudo eliminar el mensaje");
    }

    await cargarMensajesContacto();
  } catch (error) {
    console.error("Error al eliminar el mensaje de contacto:", error);
    const estado = document.getElementById("estadoHistorialContacto");
    estado.textContent =
      error instanceof Error && !(error instanceof TypeError)
        ? error.message
        : "No se pudo conectar con el servidor. Inténtalo de nuevo.";
    estado.className = "estado-contacto error";
  }
}

// Llamado inicial al cargar la página
cargarProductos();
cargarMensajesContacto();