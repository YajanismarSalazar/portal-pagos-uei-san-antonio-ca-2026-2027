# Portal de Pagos y Gestión Administrativa — UEI San Antonio C.A.

Sistema web desarrollado para facilitar el reporte de pagos de los representantes y el control administrativo y de solvencia estudiantil del año escolar **2026–2027** en la **Unidad Educativa Instituto San Antonio C.A.**

## Accesos en Línea

* **Panel Administrativo:** [Gestión Administrativa — UEI San Antonio C.A.](https://yajanismarsalazar.github.io/portal-pagos-uei-san-antonio-ca-2026-2027/gestion-administrativa/)
* **Portal de Representantes:** [Portal de Pagos para Representantes — UEI San Antonio C.A.](https://yajanismarsalazar.github.io/portal-pagos-uei-san-antonio-ca-2026-2027/portal-pagos-representante/)

## ¿Qué Incluye el Sistema?

### 1. Portal de Pagos para Representantes
* Búsqueda rápida de alumno o representante mediante el padrón estudiantil (`2026–2027`).
* Selección de mensualidades y cálculo automático en **USD** y su equivalente en **bolívares (Bs.)** según la tasa de referencia.
* Registro del reporte de pago con conexión a **Supabase**, respaldo local y envío rápido por **WhatsApp**.

### 2. Panel de Gestión Administrativa
* Revisión, aprobación o rechazo de pagos reportados con seguimiento de estado (`En revisión`, `Aprobado`, `Rechazado`).
* Control de solvencia y morosidad por fecha de corte y meses vencidos.
* Consulta del padrón de alumnos, carga/exportación en formato **CSV** y vista lista para imprimir.

## Arquitectura y Tecnologías

* **Frontend:** HTML5, CSS3 y JavaScript.
* **Datos y Persistencia:** Supabase, `localStorage` y padrón en CSV/JS.
* **Despliegue:** Git y GitHub Pages.