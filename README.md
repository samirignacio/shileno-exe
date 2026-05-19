# 🇨🇱 Sobrevive el Día - simulador de desempleo corporativo

Un juego interactivo de toma de decisiones ambientado en la cruda realidad del desempleo urbano en Chile. El jugador debe gestionar sus recursos para sobrevivir a cuatro etapas críticas del día: Mañana, Mediodía, Tarde y Noche, enfrentando eventos aleatorios cargados de burocracia, fallas domésticas y crisis existenciales.

## 🛠️ Arquitectura y Tecnologías

- **Frontend:** HTML5 plano, CSS3 con estética responsiva y variables dinámicas, JavaScript (`vanilla JS`) asíncrono.
- **Backend & Base de Datos:** [Supabase](https://supabase.com/) (PostgreSQL).
- **Seguridad:** Row Level Security (`RLS`) habilitado con políticas de acceso público exclusivo para lectura (`SELECT`).

## 📊 Sistema de Atributos (Stats)

El jugador inicia la partida con un estado base y cada decisión afecta directamente cuatro medidores críticos:

| Atributo | Rango | Descripción |
| :--- | :--- | :--- |
| **Plata** | Gastos variables | Tu liquidez en la Cuenta RUT. Si llega a niveles críticos, colapsas. |
| **Cordura** | `0` a `100` | Tu estabilidad mental. Llegar a `0` gatilla el fin del juego por colapso psicológico. |
| **Delirio** | `0` a `100` | Qué tan desconectado de la realidad estás. Superar el `100` activa un final alternativo. |
| **Vulnerable** | `0` a `100` | Tu nivel de desprotección ante el entorno social y burocrático. |

## 🗄️ Esquema de la Base de Datos

La base de datos en Supabase está modularizada en 4 jornadas independientes para evitar colisiones de IDs y optimizar las consultas aleatorias:

- `morning_events` / `morning_options` (07:00 AM - 12:00 PM)
- `midday_events` / `midday_options` (12:00 PM - 16:00 PM)
- `afternoon_events` / `afternoon_options` (16:00 PM - 20:00 PM)
- `night_events` / `night_options` (20:00 PM - 06:00 AM)

### Estructura de Tablas de Eventos (`*_events`)
- `id` (serial, Primary Key)
- `texto` (text, Not Null) - Descripción del dilema.
- `letra_chica` (text, Optional) - Subtexto de contexto o ironía.

### Estructura de Tablas de Opciones (`*_options`)
- `id` (serial, Primary Key)
- `evento_id` (integer, Foreign Key vinculada a su respectivo evento)
- `texto_opcion` (text, Not Null)
- `efecto_plata` (integer)
- `efecto_cordura` (integer)
- `efecto_delirio` (integer)
- `efecto_vulnerable` (integer)

## 🚀 Instalación y Despliegue Local

1. Clona este repositorio:
   ```bash
   git clone https://github.com/samirignacio/shileno-exe.git
   cd shileno-exe
   ```

2. Configura las credenciales de Supabase:
   - Crea un archivo `.env.local` en la raíz del proyecto
   - Añade tus credenciales de Supabase:
     ```
     VITE_SUPABASE_URL=https://your-project.supabase.co
     VITE_SUPABASE_ANON_KEY=your_anon_key_here
     ```

3. Inicia el servidor local:
   ```bash
   python -m http.server 8000
   # O usa Live Server si trabajas con VSCode
   ```

4. Abre en tu navegador:
   ```
   http://localhost:8000
   ```

## 📋 Cómo Jugar

1. **Inicia tu jornada** con estadísticas base de supervivencia
2. **Atraviesa cuatro períodos del día**, cada uno con eventos únicos y decisiones críticas
3. **Gestiona tus recursos:** Plata, Cordura, Delirio y Vulnerabilidad
4. **Alcanza el final:** Sobrevive la noche o experimenta uno de los múltiples finales alternativos

### Finales Posibles
- ✅ **Sobreviviste:** Completaste el día sin colapsar
- 💔 **Colapso Mental:** Tu cordura llegó a 0
- 👁️ **Desconexión Total:** Tu delirio superó 100
- 💸 **Quiebra Financiera:** Tu plata se agotó
- 📍 **Final Alternativo:** Combinaciones especiales de stats

## 📁 Estructura del Proyecto

```
shileno-exe/
├── index.html           # Interfaz principal del juego
├── style.css            # Estilos responsivos y variables CSS
├── script.js            # Lógica del juego y conexión a Supabase
├── README.md            # Este archivo
└── assets/              # Recursos gráficos (opcional)
    └── sprites/
    └── sounds/
```

## 🔐 Políticas de Seguridad en Supabase

Todas las tablas de eventos y opciones tienen `RLS` habilitado con la política:

```sql
CREATE POLICY "Allow public read access"
ON public.*_events FOR SELECT
USING (true);

CREATE POLICY "Allow public read access"
ON public.*_options FOR SELECT
USING (true);
```

Esto garantiza que los jugadores **solo pueden leer** los datos, sin posibilidad de modificar eventos o opciones.

## 🎮 Características Principales

- ✨ **Decisiones Significativas:** Cada elección impacta directamente tu experiencia
- 🎲 **Eventos Aleatorios:** Variabilidad en cada partida gracias a la modularización de jornadas
- 📱 **Responsivo:** Funciona en desktop, tablet y móvil
- ⚡ **Sin Dependencias Externas:** Vanilla JS + Supabase
- 🏴 **Temática Chilena:** Humor negro y referencias locales

## 💡 Próximas Mejoras

- [ ] Sistema de logros y estadísticas persistentes
- [ ] Guardado automático de partidas
- [ ] Modo Dark/Light personalizable
- [ ] Sonidos y música ambiental
- [ ] Sistema de dificultad graduada

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo licencia MIT. Ver `LICENSE` para más detalles.

## 👤 Autor

**Samir Ignacio**  
GitHub: [@samirignacio](https://github.com/samirignacio)

---

**Hecho con 💔 en Chile** - Porque el desempleo corporativo es un arte.
