# Benito Virtual Store - Catálogo Digital

## Requisitos Previos
- Node.js v18 o superior
- npm (incluido con Node.js)

## Instalacion

1. Abre la carpeta del proyecto en Visual Studio Code
2. Abre la terminal integrada (Ctrl + `)
3. Ejecuta:

```bash
npm install
```

4. Inicia el servidor de desarrollo:

```bash
npm run dev
```

5. Abre el navegador en la URL que aparece (generalmente `http://localhost:5173`)

## Configuracion del Logo

Coloca tu imagen de logo como `logo.png` dentro de la carpeta `public/`.
La imagen se mostrara en el header y en el footer del Catálogo.

## Acceso al Panel de Administrador

El acceso al panel de administrador esta oculto para los clientes:

1. **Haz 3 clicks rapidos** en el logo del header
2. Ingresa la contrasena (por defecto: `benito2026`)
3. Accederas al panel de administracion

### Desde el panel puedes:
- **Agregar productos**: Titulo, descripción, material, chapado, precio, imagenes
- **Marcar como agotado**: Los productos mostraran "AGOTADO" elegantemente
- **Agregar categorías**: Con nombre, imagen de categoría y animacion Lottie
- **Gestionar dos tiendas**: joyería y Tienda General
- **Cambiar contrasena**: Desde el icono de candado en el panel admin

## Secciones del Catálogo (joyería)

1. **Ofertas Especiales** - Se muestra primero con etiqueta de oferta
2. **Anillos**
3. **Collares**
4. **Collares para Parejas**
5. **Pulseras**
6. **+ categorías personalizadas** que agregues desde el admin

## Tienda General

Accesible desde el boton "Explorar Tienda" al final del Catálogo de joyería,
o desde la barra de navegacion inferior. Aqui puedes agregar cualquier tipo
de producto con sus propias categorías.

## Imagenes de Productos

- Tamano recomendado: **1200 x 1200 pixeles**
- Las imagenes se almacenan en localStorage del navegador
- Puedes agregar multiples imagenes por producto

## Notas Importantes

- Los datos se guardan en **localStorage** del navegador
- Si limpias los datos del navegador, se perderan los productos
- Para una version de produccion, considera usar una base de datos
- La app esta optimizada para **dispositivos moviles**
- No incluye carrito de compras (solo Catálogo visual)

## Animaciones Lottie Incluidas

El proyecto utiliza las siguientes animaciones de LottieFiles:
- Colibri (header)
- Pareja de colibris (hero)
- Computadora (seccion Catálogo digital)
- Oferta (seccion ofertas)
- Anillo, Collar, Pulsera (categorías)
- Tienda (tienda general)

## Tecnologias

- React 18 + Vite
- Mantine UI v7
- Framer Motion
- React Router v7
- Tabler Icons
- LottieFiles (dotlottie-wc)
- Componentes personalizados: ClickSpark, RotatingText

## Despliegue

Para crear la version de produccion:

```bash
npm run build
```

Los archivos se generaran en la carpeta `dist/`. Puedes subirlos a cualquier
servicio de hosting estatico como Netlify, Vercel, Firebase Hosting, etc.
