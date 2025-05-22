let dataActual = null; // nueva variable global

fetch('data.json')
  .then(res => res.json())
  .then(data => {
    dataActual = data; renderChecklist(data); configurarEditables();
  });

function renderChecklist(data) {
  limpiarEstructura(data);
  dataActual = data;

  document.getElementById('datosAutor').innerHTML = `
  <p>
    <strong>Hecho por</strong> 
    <span id="editableAutor" contenteditable="true">${data.autor || '—'}</span>
  </p>
  <p>
    <strong>Para jugar con</strong> 
    <span id="editableDestinatarios" contenteditable="true">${data.destinatarios || '—'}</span>
  </p>
`;


  const container = document.getElementById('checklist');
  container.innerHTML = '';

  // Si no hay juegos cargados, mostrar mensaje
  const tieneJuegos = data.grupos.some(grupo =>
    grupo.categorias.some(cat => cat.juegos.length > 0)
  );

  if (!tieneJuegos) {
    const mensaje = document.createElement('p');
    mensaje.textContent = '🕳️ Todavía no hay ningún juego en tu lista.';
    mensaje.style.fontStyle = 'italic';
    mensaje.style.color = '#666';
    mensaje.style.padding = '1rem';
    mensaje.style.background = 'rgba(255, 255, 255, 0.5)';
    mensaje.style.borderRadius = '8px';
    mensaje.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
    mensaje.style.textAlign = 'center';
    mensaje.style.animation = 'fadeIn 0.6s ease';
    container.appendChild(mensaje);
    return;
  }

  data.grupos.forEach(grupo => {
    // Para grupos
    const grupoTitulo = document.createElement('h2');
    grupoTitulo.innerHTML = `<span contenteditable="true" class="editable editableGrupo">${grupo.nombre}</span>`;
    container.appendChild(grupoTitulo);

    grupo.categorias.forEach(cat => {
      const details = document.createElement('details');
      details.open = true;

      const summary = document.createElement('summary');
      summary.innerHTML = `<span contenteditable="true" class="editable editableCategoria">${cat.nombre}</span>`;
      details.appendChild(summary);

      cat.juegos.forEach(juego => {
        const div = document.createElement('div');
        div.className = `juego ${estadoClase(juego.estado)}`;

        const header = document.createElement('div');
        header.className = 'juego-header';
        // 🔻 Sacamos el onclick de acá

        const title = document.createElement('span');
        title.textContent = juego.nombre;
        title.classList.add('titulo-juego');

        title.contentEditable = true;
        title.classList.add('editable');

        title.addEventListener('input', () => {
          juego.nombre = title.textContent.trim();
        });

        title.addEventListener('keydown', e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            title.blur();
          }
        });

        title.addEventListener('blur', () => {
          if (title.textContent.trim() === '') {
            title.textContent = '—';
            juego.nombre = '—';
          }
        });



        const iconoBtn = document.createElement('span');
        iconoBtn.textContent = juego.icono || '🎮';
        iconoBtn.className = 'juego-icono';
        iconoBtn.title = 'Ver detalle';
        iconoBtn.style.cursor = 'pointer';
        iconoBtn.onclick = e => {
          e.stopPropagation();
          toggleVideo(header);
        };
        header.appendChild(iconoBtn);
        header.appendChild(title);



        ['✔️', '🐭', '❌'].forEach(opcion => {
          const btn = document.createElement('button');
          btn.textContent = opcion;
          btn.onclick = e => {
            e.stopPropagation(); // ← Esto evita que el botón dispare el click en el header
            toggle(btn, opcion); // o eliminarJuego, según el caso
          };
          header.appendChild(btn);
        });

        const video = document.createElement('div');
        video.className = 'video';
        video.style.display = 'none';

        let embedHTML = '';
        if (juego.video) {
          const url = juego.video;

          if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const embedUrl = url.includes('watch?v=')
              ? url.replace('watch?v=', 'embed/')
              : url.includes('youtu.be/')
                ? `https://www.youtube.com/embed/${url.split('youtu.be/')[1]}`
                : url;
            embedHTML = `<iframe src="${embedUrl}" allowfullscreen></iframe>`;
          } else if (url.match(/\.(gif|jpe?g|png|webp)$/)) {
            embedHTML = `<img src="${url}" alt="Imagen o GIF" />`;
          } else {
            embedHTML = `<iframe src="${url}" allowfullscreen></iframe>`;
          }
        }

        video.innerHTML = `
  <iframe src="${juego.video}" allowfullscreen style="
    margin-bottom: 1rem;
"></iframe>
  <div class="info">
  <p>📝 <span contenteditable="true" class="editable">${juego.sinopsis || '—'}</span></p>
  <p>💬 <span contenteditable="true" class="editable">${juego.comentario || '—'}</span></p>
  <p>💸 <span contenteditable="true" class="editable">${juego.precio || '—'}</span></p>
  ${juego.enlace ? `<p>🛒 <a href="${juego.enlace}" target="_blank" class="link-externo">🌐 Ver</a></p>` : ''}
</div>

`;



        div.appendChild(header);
        div.appendChild(video);
        details.appendChild(div);
      });

      // Hacer la lista de juegos sortable
      const juegosEnCategoria = details.querySelectorAll('.juego');
      const sortableContainer = document.createElement('div');
      sortableContainer.classList.add('sortable-juegos');

      juegosEnCategoria.forEach(j => sortableContainer.appendChild(j));
      details.appendChild(sortableContainer);

      Sortable.create(sortableContainer, {
        group: {
          name: 'juegos',
          pull: true,
          put: true
        },
        onEnd: evt => {
          const item = evt.item;
          const destino = evt.to;
          const origen = evt.from;

          const nombreJuego = item.querySelector('.titulo-juego')?.textContent.trim();

          const categoriaOrigenEl = origen.closest('details');
          const categoriaDestinoEl = destino.closest('details');

          const nombreCategoriaOrigen = categoriaOrigenEl?.querySelector('summary span')?.textContent.trim();
          const nombreGrupoOrigen = categoriaOrigenEl?.previousElementSibling?.querySelector('span')?.textContent.trim();

          const nombreCategoriaDestino = categoriaDestinoEl?.querySelector('summary span')?.textContent.trim();
          const nombreGrupoDestino = categoriaDestinoEl?.previousElementSibling?.querySelector('span')?.textContent.trim();

          // Si se soltó fuera de todo (por ejemplo, arrastrado al vacío), borramos
          const seSoltoFuera = !categoriaDestinoEl || !categoriaDestinoEl.closest('#checklist');
          if (seSoltoFuera) {
            item.classList.add('borrable');
            setTimeout(() => {
              eliminarJuego(dataActual, nombreGrupoOrigen, nombreCategoriaOrigen, nombreJuego);
              renderChecklist(dataActual);
              configurarEditables();
            }, 250);
            return;
          }

          // Si se movió, actualizar la estructura
          if (nombreGrupoOrigen !== nombreGrupoDestino || nombreCategoriaOrigen !== nombreCategoriaDestino) {
            const grupoOrigen = dataActual.grupos.find(g => g.nombre === nombreGrupoOrigen);
            const categoriaOrigen = grupoOrigen?.categorias.find(c => c.nombre === nombreCategoriaOrigen);
            const juego = categoriaOrigen?.juegos.find(j => j.nombre === nombreJuego);

            if (!juego) return;

            // Eliminar del lugar original
            categoriaOrigen.juegos = categoriaOrigen.juegos.filter(j => j.nombre !== nombreJuego);

            // Agregar al destino
            const grupoDestino = dataActual.grupos.find(g => g.nombre === nombreGrupoDestino);
            const categoriaDestino = grupoDestino?.categorias.find(c => c.nombre === nombreCategoriaDestino);

            if (categoriaDestino) {
              categoriaDestino.juegos.splice(evt.newIndex, 0, juego);
            }
          } else {
            // Solo reordenamiento dentro de la misma categoría
            const grupo = dataActual.grupos.find(g => g.nombre === nombreGrupoDestino);
            const categoria = grupo?.categorias.find(c => c.nombre === nombreCategoriaDestino);

            if (categoria) {
              const nuevosJuegos = [];
              destino.querySelectorAll('.juego').forEach(div => {
                const nombre = div.querySelector('.titulo-juego')?.textContent.trim();
                const juego = categoria.juegos.find(j => j.nombre === nombre);
                if (juego) nuevosJuegos.push(juego);
              });
              categoria.juegos = nuevosJuegos;
            }
          }

          // Finalmente, actualizar visualmente
          limpiarEstructura(dataActual);
          renderChecklist(dataActual);
          configurarEditables();
        }





      });




      container.appendChild(details);
    });
  });

  // Escuchar cambios en campos editables
  const autorSpan = document.getElementById('editableAutor');
  const destinatariosSpan = document.getElementById('editableDestinatarios');

  autorSpan.addEventListener('input', () => {
    dataActual.autor = autorSpan.textContent.trim();
  });

  destinatariosSpan.addEventListener('input', () => {
    dataActual.destinatarios = destinatariosSpan.textContent.trim();
  });

}

function actualizarOrdenDesdeDOM() {
  const checklist = document.getElementById('checklist');

  dataActual.grupos.forEach(grupo => {
    grupo.categorias.forEach(cat => {
      const container = Array.from(checklist.querySelectorAll('details'))
        .find(d => d.querySelector('summary')?.textContent === cat.nombre);
      if (!container) return;

      const juegosNuevos = [];
      container.querySelectorAll('.juego').forEach(div => {
        const nombre = div.querySelector('span')?.textContent;
        const juego = cat.juegos.find(j => j.nombre === nombre);
        if (juego) juegosNuevos.push(juego);
      });

      cat.juegos = juegosNuevos;
    });
  });

  limpiarEstructura(dataActual);

  // 🔁 Volver a renderizar para reflejar la limpieza
  renderChecklist(dataActual);
  configurarEditables(); // si querés mantener editables activos luego del render
}

function estadoClase(e) {
  if (e === '✔️') return 'si';
  if (e === '❌') return 'no';
  if (e === '🐭') return 'rata';
  return '';
}

function toggle(btn, tipo) {
  const contenedor = btn.closest('.juego');

  // Ver si ya tiene el estado actual
  const yaTenia = contenedor.classList.contains(estadoClase(tipo));

  // Limpiar todos los posibles estados
  contenedor.classList.remove('si', 'no', 'rata');

  // Si ya lo tenía, lo deseleccionamos (no agregamos nada)
  if (yaTenia) return;

  // Si no lo tenía, lo aplicamos
  if (tipo === '✔️') contenedor.classList.add('si');
  else if (tipo === '🐭') contenedor.classList.add('rata');
  else if (tipo === '❌') contenedor.classList.add('no');
}


function toggleVideo(header) {
  const videoDiv = header.parentElement.querySelector('.video');
  if (videoDiv.style.display === 'flex') {
    videoDiv.style.display = 'none';
  } else {
    videoDiv.style.display = 'flex';
  }
}

function capturarPagina() {
  const target = document.getElementById("capturable");
  if (!target) {
    alert("No se encontró el contenido a capturar.");
    return;
  }

  // Quitar padding y animaciones
  document.body.classList.add("no-animaciones", "sin-padding");

  // Reemplazar iframes
  const iframes = target.querySelectorAll('iframe');
  const reemplazos = [];

  iframes.forEach(iframe => {
    const placeholder = document.createElement('div');
    placeholder.style.width = iframe.offsetWidth + 'px';
    placeholder.style.height = iframe.offsetHeight + 'px';
    placeholder.style.background = '#ccc';
    placeholder.style.display = 'flex';
    placeholder.style.alignItems = 'center';
    placeholder.style.justifyContent = 'center';
    placeholder.style.borderRadius = '4px';
    placeholder.innerText = '🎥 Video oculto';
    iframe.parentNode.replaceChild(placeholder, iframe);
    reemplazos.push({ iframe, placeholder });
  });

  // Ocultar botones no seleccionados
  // Ocultar botones no seleccionados y el tacho
  const juegos = document.querySelectorAll(".juego");
  const ocultos = [];

  juegos.forEach(juego => {
    const estado = juego.classList.contains('si') ? '✔️'
      : juego.classList.contains('no') ? '❌'
        : juego.classList.contains('rata') ? '🐭'
          : null;

    const botones = juego.querySelectorAll('button');
    botones.forEach(btn => {
      const esEstadoActual = btn.textContent === estado;
      const esTacho = btn.classList.contains('btn-eliminar');

      if (!esEstadoActual || esTacho) {
        ocultos.push(btn);
        btn.style.display = 'none';
      }
    });
  });

  // Esperar al próximo frame + una pausa mínima para asegurar render completo
  requestAnimationFrame(() => {
    setTimeout(() => {
      html2canvas(target, {
        backgroundColor: "#ffffff",
        useCORS: true
      }).then(canvas => {
        // Restaurar botones
        ocultos.forEach(btn => btn.style.display = '');

        // Restaurar iframes
        reemplazos.forEach(({ iframe, placeholder }) => {
          placeholder.parentNode.replaceChild(iframe, placeholder);
        });

        // Restaurar clases del body
        document.body.classList.remove("no-animaciones", "sin-padding");

        // Descargar imagen
        const link = document.createElement('a');
        link.download = 'mi-checklist.png';
        link.href = canvas.toDataURL("image/png");
        link.click();
      }).catch(err => {
        document.body.classList.remove("no-animaciones", "sin-padding");
        console.error("Error al capturar:", err);
        alert("Ocurrió un error al capturar.");
      });
    }, 60); // tiempo de espera en ms
  });

}



function descargarPlantilla() {
  if (!dataActual) {
    alert("Todavía no hay una checklist cargada.");
    return;
  }

  // Actualizar dataActual desde el DOM
  const gruposDOM = document.querySelectorAll('#checklist > h2');
  gruposDOM.forEach((grupoH2, gIndex) => {
    const grupoNombre = grupoH2.querySelector('span')?.textContent.trim();
    if (grupoNombre) dataActual.grupos[gIndex].nombre = grupoNombre;

    const categoriasDOM = [];
    let current = grupoH2.nextElementSibling;
    while (current && current.tagName !== 'H2') {
      if (current.tagName === 'DETAILS') {
        categoriasDOM.push(current);
      }
      current = current.nextElementSibling;
    }

    categoriasDOM?.forEach((detailsEl, cIndex) => {
      const catNombre = detailsEl.querySelector('summary span')?.textContent.trim();
      if (catNombre) dataActual.grupos[gIndex].categorias[cIndex].nombre = catNombre;

      const juegosDOM = detailsEl.querySelectorAll('.juego');
      juegosDOM.forEach((juegoDiv, jIndex) => {
        const info = juegoDiv.querySelector('.info');
        const sinopsis = info?.querySelector('p:nth-child(1) span')?.textContent.trim();
        const comentario = info?.querySelector('p:nth-child(2) span')?.textContent.trim();
        const precio = info?.querySelector('p:nth-child(3) span')?.textContent.trim();

        const juego = dataActual.grupos[gIndex].categorias[cIndex].juegos[jIndex];
        if (sinopsis) juego.sinopsis = sinopsis;
        if (comentario) juego.comentario = comentario;
        if (precio) juego.precio = precio;
      });
    });
  });

  // Ahora sí generar el .md con la data actualizada
  let md = `# ${dataActual.titulo || 'Checklist de jueguitos'}\n\n`;
  md += `Autor: ${dataActual.autor || '—'}\n`;
  md += `Con quien juego: ${dataActual.destinatarios || '—'}\n\n`;

  dataActual.grupos.forEach(grupo => {
    md += `# ${grupo.nombre || '—'}\n\n`;

    grupo.categorias.forEach(cat => {
      md += `## ${cat.nombre || '—'}\n\n`;

      cat.juegos.forEach(juego => {
        md += `### ${juego.nombre || '—'}\n`;
        md += `${juego.estado || ''}\n`;
        if (juego.icono) md += `**Icono:** ${juego.icono}\n`;
        if (juego.sinopsis) md += `**Sinopsis:** ${juego.sinopsis}\n`;
        if (juego.comentario) md += `**Comentario:** ${juego.comentario}\n`;
        if (juego.precio) md += `**Precio:** ${juego.precio}\n`;
        if (juego.video) md += `**Video:** ${juego.video}\n`;
        if (juego.enlace) md += `**Tienda:** ${juego.enlace}\n`;
        md += `\n`;
      });
    });
  });

  const blob = new Blob([md], { type: 'text/markdown' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  const hoy = new Date().toISOString().split('T')[0];
  link.download = `checklist-${hoy}.md`;
  link.click();
}




function parsearMarkdown(md) {
  const lines = md.split('\n');
  const resultado = { autor: '', destinatarios: '', grupos: [] };

  let grupo = null;
  let categoria = null;
  let juego = null;

  resultado.autor = lines[0]?.startsWith('Autor:') ? lines[0].split(':')[1].trim() : '';
  resultado.destinatarios = lines[1]?.startsWith('Con quien juego:') ? lines[1].split(':')[1].trim() : '';

  for (let line of lines.slice(2)) {
    if (line.startsWith('# ') && !line.startsWith('##')) {
      if (juego) categoria?.juegos.push(juego);
      if (categoria) grupo?.categorias.push(categoria);
      if (grupo) resultado.grupos.push(grupo);
      grupo = { nombre: line.slice(2).trim(), categorias: [] };
      categoria = null;
      juego = null;
    } else if (line.startsWith('## ')) {
      if (juego) categoria?.juegos.push(juego);
      if (categoria) grupo?.categorias.push(categoria);
      categoria = { nombre: line.slice(3).trim(), juegos: [] };
      juego = null;
    } else if (line.startsWith('### ')) {
      if (juego) categoria?.juegos.push(juego);
      juego = { nombre: line.slice(4).trim() };
    } else if (line.startsWith('**Sinopsis:**')) {
      juego.sinopsis = line.replace('**Sinopsis:**', '').trim();
    } else if (line.startsWith('**Comentario:**')) {
      juego.comentario = line.replace('**Comentario:**', '').trim();
    } else if (line.startsWith('**Precio:**')) {
      juego.precio = line.replace('**Precio:**', '').trim();
    } else if (line.startsWith('**Video:**')) {
      let url = line.replace('**Video:**', '').trim();
      if (url.includes('watch?v=')) url = url.replace('watch?v=', 'embed/');
      else if (url.includes('youtu.be/')) url = `https://www.youtube.com/embed/${url.split('youtu.be/')[1]}`;
      juego.video = url;
    } else if (['✔️', '❌', '🐭'].includes(line.trim())) {
      juego.estado = line.trim();
    } else if (line.startsWith('**Icono:**')) {
      juego.icono = line.replace('**Icono:**', '').trim();
    }
  }

  if (juego) categoria?.juegos.push(juego);
  if (categoria) grupo?.categorias.push(categoria);
  if (grupo) resultado.grupos.push(grupo);

  return resultado;
}

function eliminarJuego(data, grupoNombre, categoriaNombre, juegoNombre) {
  const grupo = data.grupos.find(g => g.nombre === grupoNombre);
  if (!grupo) return;

  const categoria = grupo.categorias.find(c => c.nombre === categoriaNombre);
  if (!categoria) return;

  categoria.juegos = categoria.juegos.filter(j => j.nombre !== juegoNombre);

  // Si la categoría queda vacía, opcionalmente la borramos
  if (categoria.juegos.length === 0) {
    grupo.categorias = grupo.categorias.filter(c => c.nombre !== categoriaNombre);
  }

  // Si el grupo queda vacío, también se puede eliminar (opcional)
  if (grupo.categorias.length === 0) {
    data.grupos = data.grupos.filter(g => g.nombre !== grupoNombre);
  }
}



function obtenerThumbnail(videoURL) {
  try {
    // Extraer el ID del video
    let videoID = '';
    if (videoURL.includes('youtube.com/embed/')) {
      videoID = videoURL.split('/embed/')[1];
    } else if (videoURL.includes('youtu.be/')) {
      videoID = videoURL.split('youtu.be/')[1];
    } else {
      return null;
    }

    // URL del thumbnail en alta resolución
    return `https://img.youtube.com/vi/${videoID}/hqdefault.jpg`;
  } catch {
    return null;
  }
}

document.getElementById('btnImportar').addEventListener('click', () => {
  document.getElementById('importarArchivo').click();
});

document.getElementById('importarArchivo').addEventListener('change', function (event) {
  const archivo = event.target.files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    const contenido = e.target.result;
    const data = parsearMarkdown(contenido);

    // Vaciar el contenedor actual
    document.getElementById('checklist').innerHTML = '';

    // Renderizar el nuevo contenido
    renderChecklist(data);
  };

  if (archivo) reader.readAsText(archivo);
});

document.getElementById('btnExportarJson').addEventListener('click', () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.md';
  input.style.display = 'none';

  input.addEventListener('change', function (event) {
    const archivo = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
      const contenidoMd = e.target.result;
      const dataJson = parsearMarkdown(contenidoMd);
      const blob = new Blob([JSON.stringify(dataJson, null, 2)], { type: 'application/json' });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'data-generado.json';
      link.click();
    };

    if (archivo) reader.readAsText(archivo);
  });

  document.body.appendChild(input);
  input.click();

});


document.getElementById('formAgregarJuego').addEventListener('submit', function (e) {
  e.preventDefault();


  const emoji = document.getElementById('emojiJuego').value.trim();
  const icono = emoji || '🎮'; // default si no se elige uno
  const nombre = document.getElementById('nombreJuego').value.trim();
  const grupo = document.getElementById('grupoJuego').value.trim();
  const categoria = document.getElementById('categoriaJuego').value.trim();
  const sinopsis = document.getElementById('sinopsisJuego').value.trim();
  const comentario = document.getElementById('comentarioJuego').value.trim();
  const precio = document.getElementById('precioJuego').value.trim();
  const videoRaw = document.getElementById('videoJuego').value.trim();
  const enlace = document.getElementById('enlaceJuego').value.trim();

  // Transformar video
  let video = videoRaw;
  if (video.includes('watch?v=')) video = video.replace('watch?v=', 'embed/');
  else if (video.includes('youtu.be/')) video = `https://www.youtube.com/embed/${video.split('youtu.be/')[1]}`;

  const nuevoJuego = {
    icono,
    nombre,
    estado: '', // o null, según cómo manejes los botones luego
    sinopsis,
    comentario,
    precio,
    video,
    enlace
  };

  // Buscar o crear grupo
  let grupoObj = dataActual.grupos.find(g => g.nombre === grupo);
  if (!grupoObj) {
    grupoObj = { nombre: grupo, categorias: [] };
    dataActual.grupos.push(grupoObj);
  }

  // Buscar o crear categoría dentro del grupo
  let categoriaObj = grupoObj.categorias.find(c => c.nombre === categoria);
  if (!categoriaObj) {
    categoriaObj = { nombre: categoria, juegos: [] };
    grupoObj.categorias.push(categoriaObj);
  }

  // Agregar juego
  categoriaObj.juegos.push(nuevoJuego);

  // Renderizar de nuevo
  renderChecklist(dataActual);

  configurarEditables();


  // Eliminar mensaje anterior si lo hubiera
  const viejoAviso = document.getElementById('avisoAgregado');
  if (viejoAviso) viejoAviso.remove();

  // Crear nuevo mensaje
  const aviso = document.createElement('p');
  aviso.id = 'avisoAgregado';
  aviso.textContent = `✅ "${nombre}" fue agregado a "${categoria}"`;

  // Insertarlo después del details (fuera del form)
  const details = document.getElementById('agregarJuego');
  details.parentNode.insertBefore(aviso, details.nextSibling);

  // Borrarlo luego de 2 segundos
  setTimeout(() => aviso.remove(), 5000);


  // Resetear form
  this.reset();

  document.getElementById('agregarJuego').removeAttribute('open');
});

function configurarEditables() {
  const campos = [
    {
      id: 'editableTitulo',
      key: 'titulo',
      defaultValue: '[Nombre de la lista]'
    },
    {
      id: 'editableAutor',
      key: 'autor',
      defaultValue: '[Tu nombre o alias]'
    },
    {
      id: 'editableDestinatarios',
      key: 'destinatarios',
      defaultValue: '[¿Con quién/es vas a jugar?]'
    }
  ];

  campos.forEach(({ id, key, defaultValue }) => {
    const el = document.getElementById(id);
    if (!el) return;

    // Cargar valor actual desde dataActual si existe
    el.textContent = dataActual[key] || defaultValue;

    // Guardar cambios al tipear
    el.addEventListener('input', () => {
      dataActual[key] = el.textContent.trim();
    });

    // Al presionar Enter, evitar salto y salir del campo
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        el.blur();
      }
    });

    // Al salir del foco
    el.addEventListener('blur', () => {
      const texto = el.textContent.trim();
      if (texto === '') {
        el.textContent = defaultValue;
        dataActual[key] = defaultValue;
      } else {
        dataActual[key] = texto;
      }
    });

    el.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        el.blur(); // Salir del modo edición
      }
    });
  });

  document.querySelectorAll('.editable').forEach(el => {
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        el.blur(); // salir del modo edición
      }
    });

    el.addEventListener('blur', () => {
      const texto = el.textContent.trim();
      if (texto === '') {
        el.textContent = '—'; // o el valor por defecto si lo tenés guardado
      }
    });
  });
}


function limpiarEstructura(data) {
  data.grupos = data.grupos
    .map(grupo => {
      grupo.categorias = grupo.categorias
        .map(cat => {
          cat.juegos = cat.juegos.filter(juego => !!juego && Object.keys(juego).length > 0);
          return cat;
        })
        .filter(cat => cat.juegos.length > 0);
      return grupo;
    })
    .filter(grupo => grupo.categorias.length > 0);
}

const picker = document.querySelector('emoji-picker');
const inputEmoji = document.getElementById('emojiJuego');

picker.addEventListener('emoji-click', event => {
  inputEmoji.value = event.detail.unicode;
});

inputEmoji.addEventListener('input', () => {
  const emoji = [...inputEmoji.value][0] || '';
  inputEmoji.value = emoji;
});
