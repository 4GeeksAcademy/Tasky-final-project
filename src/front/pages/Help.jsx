import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./help.css";

/* ========= CONTENIDO DEMO =========
   (pueden venir de tu API más adelante) */
const CATEGORIES = [
  {
    slug: "cuenta-y-perfil",
    icon: "👤",
    title: "Cuenta y perfil",
    blurb: "Registro, verificación, edición de datos y privacidad.",
  },
  {
    slug: "publicar-y-gestionar-tareas",
    icon: "📝",
    title: "Publicar y gestionar tareas",
    blurb: "Cómo crear, editar, cancelar y completar tareas.",
  },
  {
    slug: "ofertas-y-taskers",
    icon: "🤝",
    title: "Ofertas y Taskers",
    blurb: "Cómo funcionan las ofertas y la selección de Taskers.",
  },
  {
    slug: "pagos-y-facturacion",
    icon: "💳",
    title: "Pagos y facturación",
    blurb: "Pagos, cobros, comisiones y comprobantes.",
  },
  {
    slug: "seguridad-y-confianza",
    icon: "🛡️",
    title: "Seguridad y confianza",
    blurb: "Verificación, reportes y resolución de disputas.",
  },
  {
    slug: "buenas-practicas",
    icon: "✨",
    title: "Buenas prácticas",
    blurb: "Consejos para publicar, ofertar y comunicarse mejor.",
  },
];

const ARTICLES = [
  // Cuenta
  {
    slug: "crear-y-verificar-mi-cuenta",
    title: "Crear y verificar mi cuenta",
    body: `
Para empezar, crea una cuenta con tu email o inicia sesión con Google/Facebook. 
Recomendamos **verificar tu correo y teléfono** para aumentar la confianza.
Ve a **Cuenta → Configuración → Verificación** y sigue los pasos.`,
    category: "cuenta-y-perfil",
  },
  {
    slug: "editar-perfil-y-foto",
    title: "Editar mi perfil y foto",
    body: `
Un perfil completo ayuda a recibir mejores ofertas.
Desde **Cuenta → Perfil** actualiza tu nombre, bio, habilidades y foto.
Se aplican nuestras políticas de imágenes.`,
    category: "cuenta-y-perfil",
  },

  // Publicar tareas
  {
    slug: "como-publicar-una-tarea",
    title: "¿Cómo publicar una tarea?",
    body: `
Ve a **Post a task** y describe claramente lo que necesitas: alcance, fecha,
ubicación y presupuesto. Podrás **editarla** mientras no esté asignada.`,
    category: "publicar-y-gestionar-tareas",
  },
  {
    slug: "cancelar-o-editar-una-tarea",
    title: "Cancelar o editar una tarea",
    body: `
En **Mis tareas** abre la tarea → **Más opciones**. 
Puedes **editar** si no tiene un acuerdo en curso. 
Las cancelaciones reiteradas pueden afectar tu reputación.`,
    category: "publicar-y-gestionar-tareas",
  },

  // Ofertas
  {
    slug: "como-funcionan-las-ofertas",
    title: "¿Cómo funcionan las ofertas?",
    body: `
Los Taskers envían una oferta con **monto y mensaje**.
Puedes **chatear y comparar**; cuando elijas una, se genera el **acuerdo**.`,
    category: "ofertas-y-taskers",
  },
  {
    slug: "elegir-al-mejor-tasker",
    title: "Elegir al mejor Tasker",
    body: `
Revisa **perfil, calificaciones y verificación**. 
Aclara dudas por chat y acuerda claramente el alcance antes de aceptar.`,
    category: "ofertas-y-taskers",
  },

  // Pagos
  {
    slug: "como-se-procesan-los-pagos",
    title: "¿Cómo se procesan los pagos?",
    body: `
El pago se **reserva** al aceptar una oferta y se **libera** al completar la tarea.
Tasky aplica una **comisión** para mantenimiento de la plataforma.`,
    category: "pagos-y-facturacion",
  },
  {
    slug: "facturas-y-comprobantes",
    title: "Facturas y comprobantes",
    body: `
Encuentra tus comprobantes en **Cuenta → Facturación**. 
Puedes descargar facturas por período y actualizar tus datos de emisión.`,
    category: "pagos-y-facturacion",
  },

  // Seguridad
  {
    slug: "reportes-y-disputas",
    title: "Reportes y disputas",
    body: `
Si algo no salió bien, intenta resolverlo por chat. 
Si no hay acuerdo, abre una **disputa** desde el acuerdo. 
Nuestro equipo mediador revisará el caso.`,
    category: "seguridad-y-confianza",
  },

  // Buenas prácticas
  {
    slug: "consejos-para-publicar-mejor",
    title: "Consejos para publicar mejor",
    body: `
Sé claro con el alcance, comparte fotos si aplica y define fechas realistas.
Responde dudas rápido para recibir mejores ofertas.`,
    category: "buenas-practicas",
  },
];

/* Helpers */
const findCategory = (slug) => CATEGORIES.find((c) => c.slug === slug);
const articlesByCategory = (slug) => ARTICLES.filter((a) => a.category === slug);

/* ============ PÁGINA ============ */
export default function Help() {
  const { pathname } = useLocation();
  // Rutas soportadas:
  // /help                          -> Home
  // /help/c/:slug                  -> Categoría
  // /help/a/:slug                  -> Artículo
  const [, , type, slug] = pathname.split("/"); // ["", "help", type, slug]

  if (type === "c" && slug) return <Category slug={slug} />;
  if (type === "a" && slug) return <Article slug={slug} />;

  return <Home />;
}

/* ============ HOME ============ */
function Home() {
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return ARTICLES.filter(
      (a) =>
        a.title.toLowerCase().includes(s) ||
        a.body.toLowerCase().includes(s)
    ).slice(0, 6);
  }, [q]);

  return (
    <div className="help">
      {/* HERO */}
      <section className="help__hero">
        <div className="brand brand--glow">
          <span className="brand__mark" />
          <span className="brand__word">Tas</span>
          <span className="brand__accent">ky</span>
        </div>
        <h1 className="help__title">¿Cómo podemos ayudarte?</h1>
        <p className="help__subtitle">
          Busca respuestas o navega por las categorías.
        </p>

        <div className="help__search">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Busca: pagos, ofertas, cancelar tarea…"
            aria-label="Buscar en la ayuda"
          />
          <span className="help__kbd">/</span>
        </div>

        {!!results.length && (
          <div className="help__results" role="listbox" aria-label="Resultados">
            {results.map((a) => (
              <Link key={a.slug} to={`/help/a/${a.slug}`} role="option" className="result">
                {a.title}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* CATEGORÍAS */}
      <section className="help__section">
        <h2>Categorías</h2>
        <div className="grid">
          {CATEGORIES.map((c) => (
            <Link key={c.slug} to={`/help/c/${c.slug}`} className="card category">
              <div className="category__icon">{c.icon}</div>
              <div className="category__body">
                <h3>{c.title}</h3>
                <p>{c.blurb}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* POPULARES */}
      <section className="help__section">
        <h2>Artículos populares</h2>
        <div className="list">
          {ARTICLES.slice(0, 6).map((a) => (
            <Link key={a.slug} to={`/help/a/${a.slug}`} className="list__item">
              {a.title}
            </Link>
          ))}
        </div>
      </section>

      {/* CTA CONTACTO */}
      <Callout />
    </div>
  );
}

/* ============ CATEGORÍA ============ */
function Category({ slug }) {
  const cat = findCategory(slug);
  const items = articlesByCategory(slug);

  if (!cat) return <NotFound />;

  return (
    <div className="help">
      <Breadcrumbs items={[
        { to: "/help", label: "Ayuda" },
        { label: cat.title }
      ]} />

      <header className="cat__header">
        <div className="cat__icon">{cat.icon}</div>
        <div>
          <h1 className="cat__title">{cat.title}</h1>
          <p className="cat__blurb">{cat.blurb}</p>
        </div>
      </header>

      <div className="grid grid--articles">
        {items.map((a) => (
          <Link key={a.slug} to={`/help/a/${a.slug}`} className="card article">
            <h3>{a.title}</h3>
            <p>{short(a.body, 140)}</p>
          </Link>
        ))}
      </div>

      <Callout />
    </div>
  );
}

/* ============ ARTÍCULO ============ */
function Article({ slug }) {
  const art = ARTICLES.find((a) => a.slug === slug);
  const cat = art && findCategory(art.category);
  if (!art) return <NotFound />;

  return (
    <div className="help">
      <Breadcrumbs items={[
        { to: "/help", label: "Ayuda" },
        cat ? { to: `/help/c/${cat.slug}`, label: cat.title } : null,
        { label: art.title }
      ].filter(Boolean)} />

      <article className="article__layout">
        <aside className="article__aside">
          <div className="aside__box">
            <h4>En esta sección</h4>
            <ul>
              {articlesByCategory(art.category).map((a) => (
                <li key={a.slug}>
                  <Link to={`/help/a/${a.slug}`}>{a.title}</Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="article__content">
          <h1 className="article__title">{art.title}</h1>
          {art.body.split("\n").map((p, i) => (
            <p key={i}>{p.trim()}</p>
          ))}

          <div className="article__feedback">
            <span>¿Te fue útil este artículo?</span>
            <div className="article__actions">
              <button className="btn btn-ghost" type="button">Sí</button>
              <button className="btn btn-ghost" type="button">No</button>
            </div>
          </div>

          <Callout compact />
        </div>
      </article>
    </div>
  );
}

/* ============ PIEZAS UI ============ */
function Breadcrumbs({ items = [] }) {
  return (
    <nav className="breadcrumbs" aria-label="breadcrumb">
      {items.map((it, i) => (
        <span key={i} className="crumb">
          {it.to ? <Link to={it.to} className="link">{it.label}</Link> : <span>{it.label}</span>}
          {i < items.length - 1 && <span className="sep">/</span>}
        </span>
      ))}
    </nav>
  );
}

function Callout({ compact = false }) {
  return (
    <div className={`callout ${compact ? "callout--compact" : ""}`}>
      <div>
        <h3>¿Aún necesitas ayuda?</h3>
        <p>Escríbenos y nuestro equipo te responderá lo antes posible.</p>
      </div>
      <Link to="/post" className="btn btn-primary">Contactar soporte</Link>
    </div>
  );
}

function NotFound() {
  return (
    <div className="help">
      <div className="empty">
        <h1>Contenido no encontrado</h1>
        <p>Vuelve a la <Link to="/help" className="link">Ayuda</Link> para buscar otro tema.</p>
      </div>
    </div>
  );
}

/* Utils */
function short(str, n) {
  const s = str.replace(/\s+/g, " ").trim();
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}