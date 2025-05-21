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
      if (juego) categoria.juegos.push(juego);
      if (categoria) grupo.categorias.push(categoria);
      if (grupo) resultado.grupos.push(grupo);
      grupo = { nombre: line.slice(2).trim(), categorias: [] };
      categoria = null;
      juego = null;
    } else if (line.startsWith('## ')) {
      if (juego) categoria.juegos.push(juego);
      if (categoria) grupo.categorias.push(categoria);
      categoria = { nombre: line.slice(3).trim(), juegos: [] };
      juego = null;
    } else if (line.startsWith('### ')) {
      if (juego) categoria.juegos.push(juego);
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
    } else if (line.startsWith('**Tienda:**')) {
      juego.enlace = line.replace('**Tienda:**', '').trim();
    } else if (['✔️', '❌', '🐭'].includes(line.trim())) {
      juego.estado = line.trim();
    }
  }

  if (juego) categoria?.juegos.push(juego);
  if (categoria) grupo?.categorias.push(categoria);
  if (grupo) resultado.grupos.push(grupo);

  return resultado;
}
