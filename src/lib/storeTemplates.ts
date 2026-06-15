// Plantillas del Store Maker. Cada una siembra una tienda demo creíble en
// segundos: categorías, productos (con fotos curadas de Unsplash — License libre,
// URLs fijas verificadas 200), colores y textos. El vendedor personaliza encima.
//
// El slug (id de la tienda) sale del nombre que escribe el vendedor; estas
// plantillas solo aportan el CONTENIDO de muestra y la identidad visual base.

const U = (id: string, w = 600) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&auto=format&fit=crop`;

export interface TemplateCategory { cat: string; title: string; img: string; sort_order: number; }
export interface TemplateProduct  { title: string; description: string; price: number; cat: string; img: string; sort_order: number; }
export interface TemplateSlide    { eyebrow: string; title: string; desc: string; img: string; cta: string; ctaLink: string; bg: string; }

export interface StoreTemplate {
  key: string;
  label: string;
  emoji: string;
  primary: string;          // color de marca por defecto
  tagline: string;
  announcement: string;
  currencySymbol: string;
  categories: TemplateCategory[];
  products: TemplateProduct[];
  slider: TemplateSlide[];
}

// ─────────────────────────────────────────────────────────────────────────────
// RESTAURANTE / COMIDA
// ─────────────────────────────────────────────────────────────────────────────
const restaurante: StoreTemplate = {
  key: "restaurante",
  label: "Restaurante / Comida",
  emoji: "🍔",
  primary: "#D4541A",
  tagline: "Cocina con sabor de casa · pedidos a domicilio",
  announcement: "🔥 Bienvenido · pide a domicilio o recoge en tienda · ¡buen provecho!",
  currencySymbol: "$",
  categories: [
    { cat: "parrilladas", title: "Parrilladas", img: U("1529193591184-b1d58069ecdd"), sort_order: 1 },
    { cat: "asados",      title: "Asados",      img: U("1600891964092-4316c288032e"), sort_order: 2 },
    { cat: "burgers",     title: "Burgers",     img: U("1568901346375-23c9450c58cd"), sort_order: 3 },
    { cat: "perros",      title: "Perros",      img: U("1571091718767-18b5b1457add"), sort_order: 4 },
    { cat: "alas",        title: "Alas",        img: U("1527477396000-e27163b481c2"), sort_order: 5 },
    { cat: "entradas",    title: "Entradas",    img: U("1576107232684-1279f390859f"), sort_order: 6 },
  ],
  products: [
    { title: "Parrillada Personal", description: "300g de pollo, cerdo, res, costilla y chicharrón a las brasas con acompañante.", price: 27000, cat: "parrilladas", img: U("1529193591184-b1d58069ecdd", 400), sort_order: 1 },
    { title: "Parrillada Para 2",   description: "600g de carnes mixtas a las brasas para compartir. Incluye acompañante.",       price: 42500, cat: "parrilladas", img: U("1555939594-58d7cb561ad1", 400), sort_order: 2 },
    { title: "Felices los 4",       description: "1200g de carnes mixtas para 4 personas. La experiencia parrillera completa.",    price: 66000, cat: "parrilladas", img: U("1544025162-d76694265947", 400), sort_order: 3 },
    { title: "Churrasco",           description: "Corte de res a las brasas con papas, yuca, mazorca asada y ensalada.",          price: 32500, cat: "asados",      img: U("1546833999-b9f581a1996d", 400), sort_order: 4 },
    { title: "Rib Eye Chop",        description: "275g de Rib Eye con papas al vapor, yuca, aguacate y ensalada.",                price: 45000, cat: "asados",      img: U("1600891964092-4316c288032e", 400), sort_order: 5 },
    { title: "Filete de Pollo",     description: "250g de pechuga a la parrilla con papas, yuca, mazorca y ensalada.",            price: 27000, cat: "asados",      img: U("1432139555190-58524dae6a55", 400), sort_order: 6 },
    { title: "Big Mac de la Casa",  description: "Res, pollo, costilla, tocineta, queso, vegetales y salsas de la casa.",         price: 31500, cat: "burgers",     img: U("1568901346375-23c9450c58cd", 400), sort_order: 7 },
    { title: "Doble Sabrosa",       description: "Doble carne, queso, tocineta, cebolla caramelizada y salsas. Incluye papas.",   price: 27500, cat: "burgers",     img: U("1550317138-10000687a72b", 400), sort_order: 8 },
    { title: "Choriperro",          description: "Chorizo santarrosano, tocineta, queso, cebolla caramelizada y salsas.",        price: 18500, cat: "perros",      img: U("1571091718767-18b5b1457add", 400), sort_order: 9 },
    { title: "Combo Alas x8",       description: "8 alitas con salsa a elegir (BBQ, miel-mostaza, búfalo) y papas fritas.",       price: 30000, cat: "alas",        img: U("1527477396000-e27163b481c2", 400), sort_order: 10 },
    { title: "Salchipapa Especial", description: "Papas, salchicha, queso, carne desmechada, maíz, plátano y salsas.",            price: 20500, cat: "entradas",    img: U("1576107232684-1279f390859f", 400), sort_order: 11 },
    { title: "Nachos con Queso",    description: "Nachos con queso fundido, maíz, pico de gallo, guacamole y carne.",            price: 21000, cat: "entradas",    img: U("1541592106381-b31e9677c0e5", 400), sort_order: 12 },
  ],
  slider: [
    { eyebrow: "Especialidad de la casa", title: "La Parrillada que te mereces", desc: "Carnes a las brasas con acompañante a elegir.", img: U("1544025162-d76694265947"), cta: "Ver Parrilladas", ctaLink: "/products/parrilladas", bg: "FEF3ED" },
    { eyebrow: "Cortes premium",          title: "Asados al carbón",            desc: "Churrasco, Rib Eye y más. Sellados a la perfección.", img: U("1546833999-b9f581a1996d"), cta: "Ver Asados", ctaLink: "/products/asados", bg: "FFF8F0" },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// TECNOLOGÍA / ELECTRÓNICA
// ─────────────────────────────────────────────────────────────────────────────
const tecnologia: StoreTemplate = {
  key: "tecnologia",
  label: "Tecnología / Electrónica",
  emoji: "💻",
  primary: "#2563EB",
  tagline: "Lo último en tecnología · envíos a todo el país",
  announcement: "⚡ Tecnología original con garantía · envíos a todo el país",
  currencySymbol: "$",
  categories: [
    { cat: "laptops",     title: "Laptops",      img: U("1496181133206-80ce9b88a853"), sort_order: 1 },
    { cat: "celulares",   title: "Celulares",    img: U("1511707171634-5f897ff02aa9"), sort_order: 2 },
    { cat: "audio",       title: "Audio",        img: U("1505740420928-5e560c06d30e"), sort_order: 3 },
    { cat: "wearables",   title: "Wearables",    img: U("1523275335684-37898b6baf30"), sort_order: 4 },
    { cat: "accesorios",  title: "Accesorios",   img: U("1541140532154-b024d705b90a"), sort_order: 5 },
    { cat: "gaming",      title: "Gaming",       img: U("1486401899868-0e435ed85128"), sort_order: 6 },
  ],
  products: [
    { title: "Laptop Pro 14\"",        description: "Portátil ultraliviano, pantalla Retina, 16GB RAM y 512GB SSD.",         price: 4200000, cat: "laptops",    img: U("1496181133206-80ce9b88a853", 400), sort_order: 1 },
    { title: "Laptop Gamer RTX",       description: "Procesador de última generación y gráfica dedicada para jugar todo.",     price: 5800000, cat: "laptops",    img: U("1527443224154-c4a3942d3acf", 400), sort_order: 2 },
    { title: "Smartphone 5G 128GB",    description: "Cámara triple, pantalla AMOLED 120Hz y batería de larga duración.",      price: 1900000, cat: "celulares",  img: U("1511707171634-5f897ff02aa9", 400), sort_order: 3 },
    { title: "Tablet 11\" Wi-Fi",      description: "Ideal para estudiar y ver contenido. 64GB y lápiz compatible.",          price: 1250000, cat: "celulares",  img: U("1544244015-0df4b3ffc6b0", 400), sort_order: 4 },
    { title: "Audífonos Inalámbricos", description: "Cancelación de ruido activa y hasta 30h de reproducción.",               price: 480000,  cat: "audio",      img: U("1505740420928-5e560c06d30e", 400), sort_order: 5 },
    { title: "Earbuds Pro",            description: "Compactos, resistentes al agua y con estuche de carga rápida.",           price: 320000,  cat: "audio",      img: U("1572569511254-d8f925fe2cbb", 400), sort_order: 6 },
    { title: "Parlante Bluetooth",     description: "Sonido envolvente, batería de 20h y resistente a salpicaduras.",          price: 290000,  cat: "audio",      img: U("1608043152269-423dbba4e7e1", 400), sort_order: 7 },
    { title: "Smartwatch Fit",         description: "Monitoreo de salud, GPS y notificaciones. Correa deportiva.",            price: 540000,  cat: "wearables",  img: U("1523275335684-37898b6baf30", 400), sort_order: 8 },
    { title: "Teclado Mecánico RGB",   description: "Switches táctiles, retroiluminación RGB y construcción premium.",         price: 260000,  cat: "accesorios", img: U("1541140532154-b024d705b90a", 400), sort_order: 9 },
    { title: "Mouse Inalámbrico",      description: "Ergonómico, silencioso y con sensor de alta precisión.",                  price: 130000,  cat: "accesorios", img: U("1527814050087-3793815479db", 400), sort_order: 10 },
    { title: "Consola Next-Gen",       description: "Juega en 4K con tiempos de carga ultrarrápidos. Incluye control.",        price: 2600000, cat: "gaming",     img: U("1486401899868-0e435ed85128", 400), sort_order: 11 },
    { title: "Cámara Mirrorless",      description: "Sensor APS-C, video 4K y lente intercambiable. Para creadores.",          price: 3100000, cat: "gaming",     img: U("1502920917128-1aa500764cbd", 400), sort_order: 12 },
  ],
  slider: [
    { eyebrow: "Recién llegado", title: "La nueva Laptop Pro",     desc: "Potencia y diseño en menos de 1.2kg.",        img: U("1496181133206-80ce9b88a853"), cta: "Ver Laptops",   ctaLink: "/products/laptops",   bg: "EFF6FF" },
    { eyebrow: "Audio premium",  title: "Escucha sin límites",     desc: "Cancelación de ruido y sonido envolvente.",   img: U("1505740420928-5e560c06d30e"), cta: "Ver Audio",     ctaLink: "/products/audio",     bg: "F0F7FF" },
  ],
};

export const TEMPLATES: StoreTemplate[] = [restaurante, tecnologia];

export const getTemplate = (key: string): StoreTemplate | undefined =>
  TEMPLATES.find((t) => t.key === key);
