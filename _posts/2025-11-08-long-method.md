---
layout: post
title: Long method
categories: articles
series: code-smells
tags: code-smells refactoring typescript
---

Un code smell en el que es fácil caer es _Long Method_. Añades línes y más líneas a una función o método hasta que empieza a ser difícil de leer y de intervenir. Y un método largo, requiere un artículo largo.

## Definición

Un método en una clase es muy largo. Tiene muchas líneas de código posiblemente está haciendo muchas cosas diferentes.
Seguramente están mezclados distintos niveles de abstracción o distintas responsabilidades.

## Ejemplo

Es muy habitual que los ejemplos de este tipo de _smell_ no sean tan largos como para resultar realistas, pero en esta
ocasión he forzado un poco a la IA a fin de generar este bonito código que, sin ser un ejemplo real, ilustra
perfectamente el problema. El código incluye un par de funciones auxiliares, así como algunos tipos.

El método `process` tiene unas 380 líneas.

```typescript
class OrderService {
    process(order: Order) {
        // Validar el pedido
        if (!order.items || order.items.length === 0) {
            console.log('El pedido no tiene productos')
            return
        }

        // Validar precios y cantidades
        for (const item of order.items) {
            if (item.price < 0 || item.quantity <= 0) {
                console.log('Producto inválido en el pedido')
                return
            }
        }

        // Constantes de negocio (simples por ahora)
        const TAX_RATE = 0.21 // 21% IVA
        const FREE_SHIPPING_THRESHOLD = 50
        const SHIPPING_FLAT = 5

        // Calcular subtotal
        let subtotal = 0
        for (const item of order.items) {
            subtotal += item.price * item.quantity
        }

        // Descuento por cliente VIP (10% del subtotal)
        let discount = 0
        if (order.customerType === 'VIP') {
            discount = roundMoney(subtotal * 0.1)
            console.log('Descuento VIP aplicado')
        }

        // Base imponible
        const taxable = Math.max(0, subtotal - discount)

        // Impuestos
        const tax = roundMoney(taxable * TAX_RATE)

        // Envío
        const shipping = taxable >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT

        // Total
        const total = roundMoney(taxable + tax + shipping)

        // Actualizar el pedido (side-effects requeridos)
        order.subtotal = roundMoney(subtotal)
        order.discount = discount
        order.tax = tax
        order.shipping = shipping
        order.total = total

        // Registrar en la base de datos (simulado)
        // Bloque gigantesco y sobrecargado para simular persistencia con múltiples pasos innecesarios
        const dbConnectionString = 'Server=fake.db.local;Database=orders;User=demo;Password=demo'
        const dbConnected = true // pretendemos que ya está conectado
        const dbRetriesMax = 3
        let dbRetries = 0
        const dbNow = new Date()
        const dbRecordId = Math.floor(Math.random() * 1000000)

        // Preparar registro a guardar
        const dbRecord = {
            id: dbRecordId,
            customerEmail: order.customerEmail,
            customerType: order.customerType,
            items: order.items.map(i => ({name: i.name, price: i.price, quantity: i.quantity})),
            amounts: {
                subtotal: order.subtotal,
                discount: order.discount,
                tax: order.tax,
                shipping: order.shipping,
                total: order.total,
            },
            status: 'PENDING',
            createdAt: dbNow.toISOString(),
            updatedAt: dbNow.toISOString(),
            currency: 'USD',
        }

        // Validaciones redundantes antes de guardar
        const hasItems = Array.isArray(dbRecord.items) && dbRecord.items.length > 0
        const totalsConsistent = typeof dbRecord.amounts.total === 'number' && dbRecord.amounts.total >= 0
        if (!hasItems) {
            console.warn('[DB] No se puede guardar: el pedido no tiene items')
        }
        if (!totalsConsistent) {
            console.warn('[DB] No se puede guardar: total inconsistente')
        }

        // Simular transformación/serialización pesada
        const serialized = JSON.stringify(dbRecord, null, 2)
        const payloadBytes = Buffer.byteLength(serialized, 'utf8')
        console.log(`[DB] Serializando registro ${dbRecord.id} (${payloadBytes} bytes) para ${dbConnectionString}`)

        // Simular reintentos de escritura
        let dbSaved = false
        while (!dbSaved && dbRetries < dbRetriesMax) {
            dbRetries++
            if (!dbConnected) {
                console.log(`[DB] Intento ${dbRetries}/${dbRetriesMax}: reconectando a la base de datos...`)
            } else {
                console.log(`[DB] Intento ${dbRetries}/${dbRetriesMax}: guardando pedido ${dbRecord.id} con total ${formatMoney(total)}`)
            }
            // Resultado aleatorio simulado, pero aquí siempre "exitoso" para no complicar flujos de prueba
            dbSaved = true
        }

        if (dbSaved) {
            console.log(`[DB] Pedido ${dbRecord.id} guardado correctamente`)
        } else {
            console.error(`[DB] No se pudo guardar el pedido ${dbRecord.id} tras ${dbRetriesMax} intentos`)
        }

        // Auditoría/bitácora adicional innecesaria
        const auditLogEntry = {
            type: 'ORDER_SAVED',
            orderId: dbRecord.id,
            actor: 'system',
            at: new Date().toISOString(),
            metadata: {
                ip: '127.0.0.1',
                userAgent: 'OrderService/1.0',
            }
        }
        console.log('[AUDIT] Registro:', JSON.stringify(auditLogEntry))

        // Enviar correo de confirmación
        // Bloque gigantesco para simular el envío de un correo con plantillas, adjuntos, y seguimiento
        const smtpConfig = {
            host: 'smtp.fake.local',
            port: 587,
            secure: false,
            auth: {user: 'notifier', pass: 'notifier'},
            tls: {rejectUnauthorized: false}
        }
        const emailTemplate = `
      Hola,
      Gracias por tu pedido. Aquí tienes el resumen:\n
      Subtotal: ${formatMoney(order.subtotal)}\n
      Descuento: ${order.discount && order.discount > 0 ? '-' + formatMoney(order.discount) : formatMoney(0)}\n
      Impuestos: ${formatMoney(order.tax)}\n
      Envío: ${formatMoney(order.shipping)}\n
      Total: ${formatMoney(order.total)}\n

      Nº de pedido: ${dbRecord.id}\n
      Fecha: ${new Date().toLocaleString()}\n

      Saludos,
      Equipo Demo
    `
        const trackingPixelUrl = `https://tracker.fake.local/pixel?orderId=${dbRecord.id}&t=${Date.now()}`
        const emailBodyHtml = `
      <html>
        <body>
          <p>Hola,</p>
          <p>Gracias por tu pedido. Aquí tienes el resumen:</p>
          <ul>
            <li>Subtotal: <strong>${formatMoney(order.subtotal)}</strong></li>
            <li>Descuento: <strong>${order.discount && order.discount > 0 ? '-' + formatMoney(order.discount) : formatMoney(0)}</strong></li>
            <li>Impuestos: <strong>${formatMoney(order.tax)}</strong></li>
            <li>Envío: <strong>${formatMoney(order.shipping)}</strong></li>
            <li>Total: <strong>${formatMoney(order.total)}</strong></li>
          </ul>
          <p>Nº de pedido: <code>${dbRecord.id}</code></p>
          <p>Fecha: ${new Date().toLocaleString()}</p>
          <img src="${trackingPixelUrl}" width="1" height="1" alt=""/>
        </body>
      </html>
    `

        const attachments = [
            {filename: `pedido-${dbRecord.id}.json`, content: serialized, contentType: 'application/json'},
            {filename: 'terminos.txt', content: 'Términos y condiciones...', contentType: 'text/plain'}
        ]

        // Simular cálculo de tamaño del correo
        const emailSize = Buffer.byteLength(emailBodyHtml, 'utf8') + attachments.reduce((acc, a) => acc + Buffer.byteLength(a.content, 'utf8'), 0)
        console.log(`[MAIL] Preparando correo (${emailSize} bytes) vía ${smtpConfig.host}:${smtpConfig.port}`)

        // Simular colas de envío y priorización
        const emailPriority = order.customerType === 'VIP' ? 'HIGH' : 'NORMAL'
        console.log(`[MAIL] Encolando correo (${emailPriority}) para ${order.customerEmail}`)

        // Simular envío con reintentos
        let mailAttempts = 0
        const mailAttemptsMax = 2
        let mailSent = false
        while (!mailSent && mailAttempts < mailAttemptsMax) {
            mailAttempts++
            console.log(`[MAIL] Intento ${mailAttempts}/${mailAttemptsMax}: enviando correo a ${order.customerEmail}`)
            // Simulación simple de éxito
            mailSent = true
        }

        const messageId = `msg-${dbRecord.id}-${Date.now()}`
        if (mailSent) {
            console.log(`[MAIL] Correo enviado a ${order.customerEmail} (messageId=${messageId})`)
        } else {
            console.error(`[MAIL] Fallo al enviar correo a ${order.customerEmail} tras ${mailAttemptsMax} intentos`)
        }

        // Imprimir resumen -> enviar a impresora
        const printJob: PrintJob = {
            title: 'Resumen del pedido',
            items: order.items.map(i => ({
                name: i.name,
                quantity: i.quantity,
                lineTotal: roundMoney(i.price * i.quantity),
                lineTotalFormatted: formatMoney(i.price * i.quantity),
            })),
            subtotal: order.subtotal ?? 0,
            discount: order.discount ?? 0,
            tax: order.tax ?? 0,
            shipping: order.shipping ?? 0,
            total: order.total ?? 0,
            currency: 'USD',
            formatted: {
                subtotal: formatMoney(order.subtotal),
                discount: order.discount && order.discount > 0 ? `-${formatMoney(order.discount)}` : formatMoney(0),
                tax: formatMoney(order.tax),
                shipping: formatMoney(order.shipping),
                total: formatMoney(order.total),
            },
            metadata: {
                customerEmail: order.customerEmail,
                createdAt: new Date().toISOString(),
            }
        }

        // Simulación de envío a impresora: bloque deliberadamente grande y sobrecargado
        // Configuración de impresora (ficticia)
        const printerConfig = {
            name: 'Demo Thermal Printer TP-80',
            model: 'TP-80',
            dpi: 203,
            widthMm: 80,
            maxCharsPerLine: 42, // típico en papel de 80mm con fuente estándar
            interface: 'USB',
            driver: 'ESC/POS',
            location: 'Front Desk',
        }

        // Capabilities detectadas (simuladas)
        const printerCaps = {
            supportsBold: true,
            supportsUnderline: true,
            supportsQr: true,
            supportsBarcode: true,
            supportsImages: false,
            codepage: 'cp437'
        }

        // Conexión (simulada)
        const printerConn = {connected: true, retries: 0, maxRetries: 2}
        console.log(`[PRN] Preparando conexión a impresora ${printerConfig.name} (${printerConfig.interface}/${printerConfig.driver})`)

        // Crear contenido del recibo
        const now = new Date()
        const lineWidth = printerConfig.maxCharsPerLine

        const padRight = (text: string, len: number) => text.length >= len ? text.slice(0, len) : text + ' '.repeat(len - text.length)
        const padLeft = (text: string, len: number) => text.length >= len ? text.slice(0, len) : ' '.repeat(len - text.length) + text
        const repeat = (ch: string, n: number) => new Array(n + 1).join(ch)

        const formatLine = (left: string, right: string) => {
            const leftTrim = left ?? ''
            const rightTrim = right ?? ''
            const space = Math.max(1, lineWidth - leftTrim.length - rightTrim.length)
            const spaces = repeat(' ', space)
            const tooLong = leftTrim.length + rightTrim.length > lineWidth
            if (tooLong) {
                // Si no cabe, forzamos salto para la izquierda y mantenemos derecha alineada
                return leftTrim + '\n' + padLeft(rightTrim, lineWidth)
            }
            return leftTrim + spaces + rightTrim
        }

        // Cabecera
        const receiptLines: string[] = []
        receiptLines.push(repeat('=', lineWidth))
        receiptLines.push(padRight('RESUMEN DEL PEDIDO', lineWidth))
        receiptLines.push(padRight(now.toLocaleString(), lineWidth))
        receiptLines.push(padRight(`Cliente: ${order.customerEmail}`, lineWidth))
        receiptLines.push(repeat('-', lineWidth))

        // Items
        for (const it of printJob.items) {
            const left = `${it.quantity} x ${it.name}`
            const right = it.lineTotalFormatted
            receiptLines.push(formatLine(left, right))
        }

        // Totales
        receiptLines.push(repeat('-', lineWidth))
        receiptLines.push(formatLine('Subtotal', printJob.formatted.subtotal))
        if ((printJob.discount ?? 0) > 0) {
            receiptLines.push(formatLine('Descuento', `-${formatMoney(printJob.discount)}`))
        } else {
            receiptLines.push(formatLine('Descuento', printJob.formatted.discount))
        }
        receiptLines.push(formatLine('Impuestos', printJob.formatted.tax))
        receiptLines.push(formatLine('Envío', printJob.formatted.shipping))
        receiptLines.push(formatLine('TOTAL', printJob.formatted.total))
        receiptLines.push(repeat('=', lineWidth))

        // Pie con metadatos
        receiptLines.push(padRight(`Nº pedido: ${Math.abs((order.total ?? 0) * 1000) | 0}`, lineWidth))
        receiptLines.push(padRight(`Moneda: ${printJob.currency}`, lineWidth))
        receiptLines.push(padRight(`Creado: ${printJob.metadata.createdAt}`, lineWidth))

        // Comandos ESC/POS simulados (no operativos, solo logging)
        const escposCommands = [
            '[INIT]',
            '[ALIGN LEFT]',
            '[FONT A]',
            printerCaps.supportsBold ? '[BOLD ON]' : '[BOLD N/A]',
            '[PRINT LINES]',
            '[BOLD OFF]',
            '[CUT PARTIAL]'
        ]

        // Montar payload a imprimir
        const textPayload = receiptLines.join('\n') + '\n' + repeat('-', lineWidth) + '\n'
        const commandSection = escposCommands.join(' ')
        const printable = `\n${commandSection}\n${textPayload}`
        const spoolBuffer = Buffer.from(printable, 'utf8')
        const spoolBytes = Buffer.byteLength(printable, 'utf8')

        // Simulación de QR/barcode en el ticket (solo registro)
        const qrData = `ORDER|${order.customerEmail}|${printJob.total}|${now.getTime()}`
        if (printerCaps.supportsQr) {
            console.log(`[PRN] Agregando QR con datos: ${qrData}`)
        } else if (printerCaps.supportsBarcode) {
            console.log(`[PRN] Agregando BARCODE con datos: ${qrData.slice(0, 12)}`)
        } else {
            console.log('[PRN] Sin soporte para QR/BARCODE')
        }

        // Vista previa ASCII (limitada para no saturar logs)
        const preview = textPayload.split('\n').slice(0, 12).join('\n')
        console.log('[PRN] Vista previa del recibo:\n' + preview + (receiptLines.length > 12 ? `\n...(${receiptLines.length - 12} líneas más)` : ''))

        // Encolado de trabajo de impresión
        const printPriority = order.customerType === 'VIP' ? 'HIGH' : 'NORMAL'
        const printJobId = `prn-${Date.now()}-${Math.floor(Math.random() * 1000)}`
        console.log(`[PRN] Encolando trabajo ${printJobId} (${spoolBytes} bytes, prioridad=${printPriority}) en ${printerConfig.location}`)

        // Envío en trozos (chunking) para simular buffer limitado de la impresora
        const chunkSize = 256 // bytes
        let sentBytes = 0
        let chunkIndex = 0
        let sentOk = true
        while (sentBytes < spoolBytes) {
            const remaining = spoolBytes - sentBytes
            const size = Math.min(chunkSize, remaining)
            const chunk = spoolBuffer.subarray(sentBytes, sentBytes + size)
            // Simular reintentos por chunk
            let attempts = 0
            let delivered = false
            while (!delivered && attempts < 2) {
                attempts++
                console.log(`[PRN] Enviando chunk #${chunkIndex} (${size} bytes) intento ${attempts}/2`)
                // Éxito simulado
                delivered = true
            }
            if (!delivered) {
                console.error(`[PRN] Fallo al enviar chunk #${chunkIndex}`)
                sentOk = false
                break
            }
            sentBytes += size
            chunkIndex++
        }

        // Resultado final de impresión
        if (printerConn.connected && sentOk) {
            console.log(`[PRN] Trabajo ${printJobId} impreso correctamente. Total enviado: ${sentBytes} bytes`)
        } else {
            console.error(`[PRN] Error al imprimir trabajo ${printJobId}. Enviado: ${sentBytes}/${spoolBytes} bytes`)
        }
    }
}

function roundMoney(n: number): number {
    return Math.round(n * 100) / 100
}

function formatMoney(n: number | undefined): string {
    const v = typeof n === 'number' ? n : 0
    return `$${v.toFixed(2)}`
}

interface Order {
    customerEmail: string
    customerType: 'NORMAL' | 'VIP'
    items: { name: string; price: number; quantity: number }[]
    subtotal?: number
    discount?: number
    tax?: number
    shipping?: number
    total?: number
}


interface PrintJob {
    title: string
    items: { name: string; quantity: number; lineTotal: number; lineTotalFormatted: string }[]
    subtotal: number
    discount: number
    tax: number
    shipping: number
    total: number
    currency: string
    formatted: {
        subtotal: string
        discount: string
        tax: string
        shipping: string
        total: string
    }
    metadata: {
        customerEmail: string
        createdAt: string
    }
}

```

## Ejercicio

Nos gustaría añadir soporte de cupones con expiración y multi‑moneda (USD/EUR), así como diferentes reglas de redondeo
de precios.

## Problemas que encontrarás

381 líneas son muchas líneas y complican tanto entender, como mantener el código. Para poder introducir los cambios
deseados tenemos que desentrañar todos los lugares de este código que podrían verse afectados, que pueden ocultarse
entre los distintos niveles de abstracción y detalle que están entremezclados. Un cambio puede tener efectos no deseados
o simplemente no funcionar como esperamos porque debemos aplicarlo en varios lugares.

Hay varios problemas relacionados con la longitud del método:

En primer lugar, tenemos la mezcla de distintas responsabilidades. Además del procesamiento del pedido como tal, nos
encontramos:

* Persistencia de Base de datos, incluyendo detalles de muy bajo nivel, mezclados con otros como validaciones,
  serializaciones, etc.
* Envío de notificaciones por email, incluyendo también detalles de implementación del servicio de correo.
* Impresión del pedido, con detalles irrelevantes para el procesamiento del pedido.

Pero incluso dentro de lo que consideraríamos el procesamiento del pedido, tenemos varias responsabilidades:

* Validación de que el pedido está listo para procesar
* Cálculo de totales
* Aplicación de impuestos y descuentos

## Solución

## Sin resolver el _smell_

Al igual que hicimos con [Large Class](/large-class/), no vamos a intentar resolver el ejercicio con el código en su
estado actual. ¿Se podría? Sí, el transpilador lo aguanta todo, y si puede compilar, puede incluso funcionar. Otra cosa
es entender el código o mantenerlo.

Veamos por ejemplo el introducir cupones de descuento. Tenemos un código similar aquí:

```typescript
// Descuento por cliente VIP (10% del subtotal)
let discount = 0
if (order.customerType === 'VIP') {
    discount = roundMoney(subtotal * 0.1)
    console.log('Descuento VIP aplicado')
}
```

Así que podríamos introducir soporte para otros cupones justo después de este bloque, añadiendo otra condicional que
señale la circunstancia a la vez que añadimos complejidad ciclomática, por si no teníamos suficiente:

```typescript
// Descuento por cliente VIP (10% del subtotal)
let discount = 0
if (order.customerType === 'VIP') {
    discount = roundMoney(subtotal * 0.1)
    console.log('Descuento VIP aplicado')
}

if (order.coupon === 'DESC15' && order.couponExpiration > new Date() {
    discount = discount + roundMoney(subtotal * 0.15)
    console.log('Descuento cupón aplicado')
}
```

Para dar soporte a diversas monedas, tendremos que añadirlo en la interface `Order` y reemplazar algunos lugares en los
que se usa `USD` como moneda.

```typescript
interface Order {
    customerEmail: string
    customerType: 'NORMAL' | 'VIP'
    items: { name: string; price: number; quantity: number }[]
    currency: 'USD' | 'EUR'
    subtotal?: number
    discount?: number
    tax?: number
    shipping?: number
    total?: number
    coupon?: string
    couponExpiration?: Date
}
```

Aquí tenemos un ejemplo, pero hay alguno más:

```typescript
    // Preparar registro a guardar
const dbRecord = {
    id: dbRecordId,
    customerEmail: order.customerEmail,
    customerType: order.customerType,
    items: order.items.map(i => ({name: i.name, price: i.price, quantity: i.quantity})),
    amounts: {
        subtotal: order.subtotal,
        discount: order.discount,
        tax: order.tax,
        shipping: order.shipping,
        total: order.total,
    },
    status: 'PENDING',
    createdAt: dbNow.toISOString(),
    updatedAt: dbNow.toISOString(),
    currency: order.currency,
}
```

Al respecto del redondeo la cosa se hace más complicada. Tenemos unas funciones auxiliares que se usan para esta
función, pero el problema está en poder configurar reglas diferentes que podrían aplicarse en distintas circunstancias o
incluso a distintos componentes del precio. Por ejemplo, en el sector de la energía eléctrica, los precios unitarios de
la energía requieren hasta seis decimales, mientras que el importe de la factura se expresa con dos.

Podríamos cambiar `roundMoney` para admitir una precisión opcional:

```typescript
function roundMoney(n: number, precision: number = 2): number {
    const factor = Math.pow(10, precision)
    return Math.round(n * factor) / factor
}
```

Y luego revisar sus cinco usos para averiguar si tendríamos que cambiar alguno de ellos y hacerlo de manera consistente.

## Resolviendo el _smell_

### Testing

Nos vendría bien tener un test de caracterización para poder empezar refactorizar este método largo y convertirlo en un
código manejable. Tenemos algunos desafíos para escribir este test, pero vamos a ver cómo lo hacemos.

Para empezar, este es un ejemplo del output que obtenemos en la consola.

```text
[DB] Serializando registro 235133 (518 bytes) para Server=fake.db.local;Database=orders;User=demo;Password=demo
[DB] Intento 1/3: guardando pedido 235133 con total $155.18
[DB] Pedido 235133 guardado correctamente
[AUDIT] Registro: {"type":"ORDER_SAVED","orderId":235133,"actor":"system","at":"2025-11-03T16:50:26.107Z","metadata":{"ip":"127.0.0.1","userAgent":"OrderService/1.0"}}
[MAIL] Preparando correo (1211 bytes) vía smtp.fake.local:587
[MAIL] Encolando correo (NORMAL) para customer@example.com
[MAIL] Intento 1/2: enviando correo a customer@example.com
[MAIL] Correo enviado a customer@example.com (messageId=msg-235133-1762188626115)
[PRN] Preparando conexión a impresora Demo Thermal Printer TP-80 (USB/ESC/POS)
[PRN] Agregando QR con datos: ORDER|customer@example.com|155.18|1762188626115
[PRN] Vista previa del recibo:
==========================================
RESUMEN DEL PEDIDO                        
11/3/2025, 5:50:26 PM                     
Cliente: customer@example.com             
------------------------------------------
3 x Product 1                       $36.15
6 x Another                         $92.10
------------------------------------------
Subtotal                           $128.25
Descuento                            $0.00
Impuestos                           $26.93
Envío                                $0.00
...(5 líneas más)
[PRN] Encolando trabajo prn-1762188626115-939 (855 bytes, prioridad=NORMAL) en Front Desk
[PRN] Enviando chunk #0 (256 bytes) intento 1/2
[PRN] Enviando chunk #1 (256 bytes) intento 1/2
[PRN] Enviando chunk #2 (256 bytes) intento 1/2
[PRN] Enviando chunk #3 (87 bytes) intento 1/2
[PRN] Trabajo prn-1762188626115-939 impreso correctamente. Total enviado: 855 bytes
```

Esto nos dice que la mejor forma de poner el código bajo test es mediante _snapshot testing_, pero eso aún nos deja con
el problema de capturar el output de la consola.

Para esto, debemos recurrir a crear un espía de la consola con las facilidades provistas por `vitest`. Este método
funciona bien cuando no podemos crear nuestros propios dobles o espías.

Este es el test inicial que creamos:

```typescript
describe('long method', () => {
    it('simple order with NORMAL customer', () => {
        const logSpy = vi.spyOn(console, 'log')

        const order = {
            customerEmail: 'customer@example.com',
            customerType: 'NORMAL',
            items: [
                {
                    name: 'Product 1',
                    price: 12.05,
                    quantity: 3
                },
                {
                    name: 'Another',
                    price: 15.35,
                    quantity: 6
                }
            ]
        } as Order

        const orderService = new OrderService();
        orderService.process(order)

        let output = formatConsoleCalls(logSpy)
        expect(output).toMatchSnapshot()

        logSpy.mockRestore()
    });
})
```

Nos falta una función auxiliar para poder unir todos los logs que se han producido en la consola y poder usarlos con el
snapshot:

```typescript
function formatConsoleCalls(spy: ReturnType<typeof vi.spyOn>) {
    return spy.mock.calls.map(call => call.join(' ')).join('\n')
}
```

#### Controlando datos no deterministas

Si ejecutamos el test una vez, se generará el snapshot y el test aparecerá como pasado. Pero al ejecutarlo por segunda
vez, veremos que el test falla. Esto es debido a que hay algunos datos no deterministas:

* Identificadores
* Timestamps
* Fechas
* Identificadores de trabajo de impresión

Tenemos dos formas principales de resolver esto:

* Reemplazar los datos no deterministas antes de generar el snapshot, mediante técnicas buscar y reemplazar patrones.
  Esto se denomina _scrubbing_, pero suele ser tedioso y propenso a generar problems.
* Introducir _seams_ en el código para tener bajo control la generación datos no deterministas.

Esta segunda opción es la que vamos a usar y forma parte del arsenal de técnicas de test. Además, nos va a permitir
empezar a entender cómo funciona el código y a introducir algunos colaboradores iniciales.

Básicamente, tenemos que identificar qué datos no deterministas tenemos y aislar su creación en métodos protegidos de la
clase bajo test. Una vez hecho esto, extendemos la clase `OrderService` y sobreescribimos esos métodos para que
devuelvan datos fijos.

Así por ejemplo, la primera línea del snapshot en la que podemos encontrar un dato no determinista es:

```text
[DB] Serializando registro 755049 (518 bytes) para Server=fake.db.local;Database=orders;User=demo;Password=demo
```

El número del registro se genera en esta línea que usa la librería `Math` para generar un número aleatorio entre 0 y
999999.

```typescript
const dbRecordId = Math.floor(Math.random() * 1000000)
```

Aplicamos el refactor _Extract Method_ para crear el _seam_. Un seam es un punto del código que podemos cambiar si
afectar a la funcionalidad del programa.

```typescript
protected
generateDbRecordId()
{
    return Math.floor(Math.random() * 1000000);
}
```

Vamos a ver ahora cómo usaremos este _seam_ en el test. Primero, extendemos la clase `OrderService` y declaramos una
clase derivada `TestableOrderService` en la que sobreescribimos el método `generateDbRecordId` para que devuelva un
valor fijo. De este modo, `OrderService` sigue trabajando exactamente igual que antes, pero en el test hay una pequeña
parte de la misma que podemos manipular. Eso es cómo funciona el _seam_.

```typescript
class TestableOrderService extends OrderService {
    protected generateDbRecordId(): number {
        return 67234;
    }
}
```

Y empezamos a usar `TestableOrderService` en el test:

```typescript
const orderService = new TestableOrderService();
orderService.process(order)
```

Ahora, tenemos que actualizar el _snapshot_ para que coincida con el nuevo valor de `dbRecordId`. Lo podemos hacer
borrando el archivo de _snapshot_, o usando las facilidades que nos ofrezca la librería de testing.

Si ejecutamos el test por primera vez (o hemos actualizado el _snapshot_), veremos que pasa. Al ejecutarlo de nuevo, en
cambio, veremos que falla. Sin embargo, ya falla de forma diferente, puesto que la línea

```text
[DB] Serializando registro 67234 (517 bytes) para Server=fake.db.local;Database=orders;User=demo;Password=demo
[DB] Intento 1/3: guardando pedido 67234 con total $155.18
```

No solo refleja el valor de `dbRecordId` que hemos incrustado en la clase _testable_, sino que esa línea ya no muestra
diferencias entre el _snapshot_ y el resultado obtenido. Obviamente, otras líneas muestran diferencias:

```text
[AUDIT] Registro: {"type":"ORDER_SAVED","orderId":67234,"actor":"system","at":"2025-11-03T17:21:31.140Z","metadata":{"ip":"127.0.0.1","userAgent":"OrderService/1.0"}}
```

Aquí la diferencia está en la marca de tiempo, que es un valor no determinista, que obtenemos del reloj del sistema.
Este valor es obtenido aquí, concretamente al instanciar un objeto `Date`.

```typescript
const auditLogEntry = {
    type: 'ORDER_SAVED',
    orderId: dbRecord.id,
    actor: 'system',
    at: new Date().toISOString(),
    metadata: {
        ip: '127.0.0.1',
        userAgent: 'OrderService/1.0',
    }
}
```

Tiene sentido extraer solamente la instanciación de `Date`. Esto hace que sea más reutilizable y que la intervención sea
minimalista.

```typescript
protected
getCurrentDate()
:
Date
{
    return new Date();
}
```

Por supuesto, ahora tendremos que sobreescribir el método en `TestableOrderService` para que devuelva un valor de fecha
fijo.

```typescript
class TestableOrderService extends OrderService {
    protected generateDbRecordId(): number {
        return 67234;
    }

    protected getCurrentDate(): Date {
        return new Date('2023-05-21T13:35');
    }
}
```

Una vez que hemos hecho esto, podemos actualizar el snapshot y hacer fallar el test de nuevo ejecutándolo dos veces.
Veremos que la fecha del log ya se mantiene constante:

```text
[AUDIT] Registro: {"type":"ORDER_SAVED","orderId":67234,"actor":"system","at":"2023-05-21T11:35:00.000Z","metadata":{"ip":"127.0.0.1","userAgent":"OrderService/1.0"}}
```

Se puede observar una diferencia en la hora, porque no hemos tenido en cuenta la zona horaria al definir la fecha. Sin
embargo, para el propósito del test nos da igual.

La siguiente diferencia que se puede observar está en messageId durante el envío de email, que tiene pinta de ser un
timestamp.

```text
[MAIL] Correo enviado a customer@example.com (messageId=msg-67234-1762191156326)
```

Veamos en el código:

```typescript
const messageId = `msg-${dbRecord.id}-${Date.now()}`
if (mailSent) {
    console.log(`[MAIL] Correo enviado a ${order.customerEmail} (messageId=${messageId})`)
} else {
    console.error(`[MAIL] Fallo al enviar correo a ${order.customerEmail} tras ${mailAttemptsMax} intentos`)
}
```

Esto ya lo tenemos cubierto con el _seam_ `getCurrentDate`.

```typescript
const messageId = `msg-${dbRecord.id}-${this.getCurrentDate().getTime()}`
```

Y, efectivamente, ahora conseguimos que esta línea se genere con los mismos datos cada vez que ejecutemos el test. Lo
que nos lleva a la siguiente diferencia:

```text
[PRN] Agregando QR con datos: ORDER|customer@example.com|155.18|1762191531739
```

Se trata de otro timestamp que se obtiene de la variable `now`, la cual se puebla en esta línea.

```typescript
// Crear contenido del recibo
const now = new Date()
```

Aplicamos la misma solución que antes:

```typescript
const now = this.getCurrentDate()
```

Y volvemos a actualizar el snapshot. Por cierto, que en esta ocasión nos encontramos con que se han solucionado dos
diferencias. Primero, la que esperábamos:

```text
[PRN] Agregando QR con datos: ORDER|customer@example.com|155.18|1684668900000
```

Pero el resumen del pedido usa también `now` para pintar la fecha del recibo:

```text
RESUMEN DEL PEDIDO                        
5/21/2023, 1:35:00 PM                     
Cliente: customer@example.com
```

Solo nos queda la siguiente diferencia, al generar el identificador del trabajo de impresión:

```text
[PRN] Encolando trabajo prn-1762191760615-90 (855 bytes, prioridad=NORMAL) en Front Desk
```

El `printJobId` combina dos datos no deterministas:

```typescript
const printJobId = `prn-${Date.now()}-${Math.floor(Math.random() * 1000)}`
```

Así que lo extraemos a un método protegido para tener un nuevo _seam_.

```typescript
protected
generatePrintJobId()
{
    return `prn-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}
```

En este caso, voy a sobreescribir el método usando un valor fijo obtenido del snapshot actual, para simular un
identificador realista.

```typescript
class TestableOrderService extends OrderService {
    protected generateDbRecordId(): number {
        return 67234;
    }


    protected getCurrentDate(): Date {
        return new Date('2023-05-21T13:35');
    }


    protected generatePrintJobId(): string {
        return 'prn-1762191762553-125';
    }
}
```

Una vez introducido este cambio y actualizado el snapshot, podemos ver que el test pasa repetidamente. Hemos logrado
eliminar todas las fuentes no deterministas y ya tenemos una buena base con la que trabajar.

#### Golden Master

Una cuestión interesante es que nuestro código tiene varios flujos de ejecución posibles. Por ejemplo, sie el cliente es
Normal o VIP el cálculo será diferente porque los clientes VIP tienen un descuento. También hay un coste de envío si el
total del pedido es inferior a 50, mientras que es gratis a partir de ese importe. Se hacen también algunas validaciones
para ver si el pedido es procesable, etc.

Por otro lado, los pedidos pueden tener uno o más productos, los cuales se pueden pedir en cualquier número de unidades,
lo que genera la necesidad de cubrir con tests un número de casos representativo.

Aparte de eso, hay una casuística relativa al funcionamiento del sistema de persistencia, de envío de emails y de
impresión, que complica las cosas. En este ejemplo, lo vamos a ignorar y nos vamos a quedar en el happy path. Se trata
de código que estaría funcionando en producción, pero que no vamos a querer tocar en este ejercicio salvo para
extraerlo.

Dado que no conocemos exactamente como funciona el código, nuestra estrategia de testing es generar muchos inputs,
cuantos más mejor, y ver qué genera en cada combinación de ellos. Esta técnica de bombardeo con test nos generará un
Golden Master, es decir, una descripción de como funciona el código en este momento. El objetivo no es hacer un test de
como debería funcionar o para buscar errores.

En su lugar, este test nos va a permitir mantener el comportamiento actual a la vez que refactorizamos poco a poco a un
diseño mejor. Cuando tengamos ese diseño mejor en tanto que más mantenible y fácil de modificar, podremos preparar otros
tests e intervenir en el código para introducir nuevas prestaciones.

Existen algunas librerías para ayudarnos a generar el Golden Master, pero en Typescript con ViTest es bastante fácil.
Podemos usar dos aproximaciones:

* Generar combinaciones mediante bucles anidados.
* Generar combinaciones mediante `each` anidados, que nos permite proveer datos a los tests.

Hay algunas diferencias entre una y otra aproximación. La segunda, nos permite una gran resolución para detectar qué
valores se ven afectados por los cambios, puesto que cada test se ejecuta de forma individual. De la otra forma, se
ejecuta un único test masivo con todas las combinaciones posibles.

Veamos el test aplicando la variación según el tipo de cliente:

```typescript
describe('long method', () => {
    describe.each(['NORMAL', 'VIP'])('Given a %s customer', (customerType: string) => {
        it('should process the order', () => {
            const logSpy = vi.spyOn(console, 'log')

            const order = {
                customerEmail: 'customer@example.com',
                customerType: customerType,
                items: [
                    {
                        name: 'Product 1',
                        price: 12.05,
                        quantity: 3
                    },
                    {
                        name: 'Another',
                        price: 15.35,
                        quantity: 6
                    }
                ]
            } as Order

            const orderService = new TestableOrderService();
            orderService.process(order)

            let output = formatConsoleCalls(logSpy)
            expect(output).toMatchSnapshot()

            logSpy.mockRestore()
        });
    })
})
```

Para obtener pedidos con gastos de envío o no, debemos simular pedidos por importe menor o mayor de 50 euros. Esto viene
dado por los items, su precio y las cantidades de producto.

Aquí tenemos un par de ejemplos:

```typescript
const hasShippingCosts = [
    {
        name: 'Product 1',
        price: 12.05,
        quantity: 1
    },
    {
        name: 'Another',
        price: 15.35,
        quantity: 1
    }
]

const hasFreeShipping = [
    {
        name: 'Product 1',
        price: 12.05,
        quantity: 3
    },
    {
        name: 'Another',
        price: 15.35,
        quantity: 6
    }
]
```

Creo que sería más fácil gestionar los ejemplos si introduzco algunos tipos:

```typescript
export interface Item {
    name: string
    price: number
    quantity: number
}

export type ItemCollection = Item[]
```

Quedaría más o menos así:

```typescript
describe('long method', () => {
    describe.for(['NORMAL', 'VIP'])('Given a %s customer', (customerType: string) => {
        describe.for([
            {name: 'shipping costs', items: hasShippingCosts},
            {name: 'free shipping', items: hasFreeShipping}
        ])('When the order has $name', (example: { name: string; items: ItemCollection }) => {
            it('should process the order', () => {
                const logSpy = vi.spyOn(console, 'log')

                const order = {
                    customerEmail: 'customer@example.com',
                    customerType: customerType,
                    items: example.items,
                } as Order

                const orderService = new TestableOrderService();
                orderService.process(order)

                let output = formatConsoleCalls(logSpy)
                expect(output).toMatchSnapshot()

                logSpy.mockRestore()
            });
        })
    })
})
```

Hay otros casos que nos podría interesar cubrir, como pedidos no válidos. Nos quedaría algo así:

```typescript
const hasShippingCosts: ItemCollection = [
    {
        name: 'Product 1',
        price: 12.05,
        quantity: 1
    },
    {
        name: 'Another',
        price: 15.35,
        quantity: 1
    }
]


const hasFreeShipping: ItemCollection = [
    {
        name: 'Product 1',
        price: 12.05,
        quantity: 3
    },
    {
        name: 'Another',
        price: 15.35,
        quantity: 6
    }
]

const hasNoItems: ItemCollection = []

const hasInvalidPrice: ItemCollection = [
    {
        name: 'Invalid',
        price: 0,
        quantity: 2
    }
]

const hasInvalidQuantity: ItemCollection = [
    {
        name: 'Invalid',
        price: 5.45,
        quantity: 0
    }
]


describe('long method', () => {
    describe.for(['NORMAL', 'VIP'])('Given a %s customer', (customerType: string) => {
        describe.for([
            {name: 'shipping costs', items: hasShippingCosts},
            {name: 'free shipping', items: hasFreeShipping},
            {name: 'no items', items: hasNoItems},
            {name: 'invalid price', items: hasInvalidPrice},
            {name: 'invalid quantity', items: hasInvalidQuantity},
        ])('When the order has $name', (example: { name: string; items: ItemCollection }) => {
            it('should process the order', () => {
                const logSpy = vi.spyOn(console, 'log')

                const order = {
                    customerEmail: 'customer@example.com',
                    customerType: customerType,
                    items: example.items,
                } as Order

                const orderService = new TestableOrderService();
                orderService.process(order)

                let output = formatConsoleCalls(logSpy)
                expect(output).toMatchSnapshot()

                logSpy.mockRestore()
            });
        })
    })
})
```

Podríamos ampliar la lista de ejemplos con otros casos de pedidos, como podrían ser pedidos con muchos productos o cuyo
importe total sea muy alto, superior a 1000 euros para ver el formato de salida. Sin embargo, para el ejercicio creo que
nos llega con esto.

Esta combinación nos genera 10 tests que, sin ser mucho, ejercita buena parte del código que queremos tratar. Quedan
fuera del coverage algunas líneas cuando hay problemas en la persistencia, la impresión o el envío del correo. Pero,
como hemos señalado antes, no nos interesa cubrir esas partes en este momento.

### Aislar responsabilidades en métodos privados

Ahora que tenemos un test que cubre todo el código que nos interesa, vamos con el refactoring en sí.

Para el smell _Long Method_, el refactor básico que usaremos es _Extract Method_. El objetivo es separar las distintas
responsabilidades de las que se hace cargo el método en métodos privados separados. Esto nos ayudará también a descubrir
posibles colaboradores para encargarse de ellas. Además, nos servirá para ocultar detalles en el método principal.

Esa primera fase nos despejará el camino para _Extract Class_. Una vez que hayamos aislado responsabilidades, veremos
que algunas de ellas estarían mejor en clases independientes. _Extract Class_ es el refactor para mover la lógica a
clases nuevas y habilitar la inyección de dependencias, que hará que nuestra clase `OrderService` sea más fácil de
entender y probar. Pero seguramente también veremos que son aplicables refactors como `Introduce Value Object` y otros.

Nuestro primer paso será identificar las diversas responsabilidades. Para ello, intentaremos agrupar las líneas de
código que son cohesivas, es decir, que colaboran entre ellas para lograr un propósito. Cuando se gestionan varias
responsabilidades en un único método la cohesión total es muy baja, pero hay grupos de líneas que son muy cohesivos. Eso
es lo que tenemos que buscar.

En este ejemplo, buena parte del trabajo está hecho y viene marcado por líneas de comentarios. Esto es algo
relativamente habitual en muchos proyectos. Vamos a ver algunos ejemplos.

#### Validación del pedido

Nada más empezar el método se hace una validación del pedido, dependiendo de si tiene items o no, y si estos tienen
valores válidos de precio y cantidad.

```typescript
    // Validar el pedido
if (!order.items || order.items.length === 0) {
    console.log('El pedido no tiene productos')
    return
}

// Validar precios y cantidades
for (const item of order.items) {
    if (item.price < 0 || item.quantity <= 0) {
        console.log('Producto inválido en el pedido')
        return
    }
}
```

Podemos extraer esto a un método, pero necesitamos algo de ayuda para ello. Actualmente, si el pedido no es válido, se
hace un log y no se ejecuta nada. Pero para extraer el método tendríamos que introducir un flag o algo. Con esto, los
tests pasan:

```typescript
    // Validar el pedido

let validOrder = true
if (!order.items || order.items.length === 0) {
    console.log('El pedido no tiene productos')
    validOrder = false
}

// Validar precios y cantidades
for (const item of order.items) {
    if (item.price < 0 || item.quantity <= 0) {
        console.log('Producto inválido en el pedido')
        validOrder = false
    }
}

if (!validOrder) {
    return
}
```

Y ahora podríamos extraer el método:

```typescript
private
validateOrder(order
:
Order
)
{
    // Validar el pedido

    let validOrder = true
    if (!order.items || order.items.length === 0) {
        console.log('El pedido no tiene productos')
        validOrder = false
    }

    // Validar precios y cantidades
    for (const item of order.items) {
        if (item.price < 0 || item.quantity <= 0) {
            console.log('Producto inválido en el pedido')
            validOrder = false
        }
    }
    return validOrder;
}
```

Este se usa así:

```typescript
let validOrder = this.validateOrder(order);

if (!validOrder) {
    return
}
```

Todo sigue funcionando como es debido, así que también podríamos refactorizar un poco aquí, librándonos de comentarios y
de una variable temporal:

```typescript
private
validateOrder(order
:
Order
)
{
    if (!order.items || order.items.length === 0) {
        console.log('El pedido no tiene productos')
        return false
    }

    for (const item of order.items) {
        if (item.price < 0 || item.quantity <= 0) {
            console.log('Producto inválido en el pedido')
            return false
        }
    }
    return true;
}
```

Y podemos hacer lo mismo en el método principal:

```typescript
if (!this.validateOrder(order)) {
    return
}
```

Un método al que le pasamos un objeto y solo opera con ese objeto ya nos estaría indicando que ese comportamiento
pertenece al objeto en cuestión. En otras palabras, `Order` bien puede tener un método `validate` o`readyForProcessing`.
Algo así:

```typescript
export interface Order {
    customerEmail: string
    customerType: 'NORMAL' | 'VIP'
    items: { name: string; price: number; quantity: number }[]
    subtotal?: number
    discount?: number
    tax?: number
    shipping?: number
    total?: number

    isReadyForProcessing(): boolean;
}
```

Claro que `Order` es una interfaz y necesitaríamos una clase para poder implementarle comportamientos. Esto nos desvía
un poco de nuestro propósito ahora, por lo que vamos a posponer esta intervención para otro momento más propicio.

#### Más comportamientos en Order

A continuación, tenemos un bloque que realiza varios cálculos que se aplican a Order. De hecho, se calculan y asignan
algunas de sus propiedades.

```typescript
// Calcular subtotal
let subtotal = 0
for (const item of order.items) {
    subtotal += item.price * item.quantity
}

// Descuento por cliente VIP (10% del subtotal)
let discount = 0
if (order.customerType === 'VIP') {
    discount = roundMoney(subtotal * 0.1)
    console.log('Descuento VIP aplicado')
}

// Base imponible
const taxable = Math.max(0, subtotal - discount)

// Impuestos
const tax = roundMoney(taxable * TAX_RATE)

// Envío
const shipping = taxable >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT

// Total
const total = roundMoney(taxable + tax + shipping)

// Actualizar el pedido (side-effects requeridos)
order.subtotal = roundMoney(subtotal)
order.discount = discount
order.tax = tax
order.shipping = shipping
order.total = total
```

Estamos en las mismas: operamos con las propiedades de un objeto. Podemos extraer este bloque a un método y así
mantenerlo aislado hasta que nos veamos en condiciones de refactorizarlo y moverlo a la clase `Order`.

Al aplicar el refactor automático obtengo lo siguiente:

```typescript
private
calculateOrderTotal(order
:
Order, TAX_RATE
:
number, FREE_SHIPPING_THRESHOLD
:
number, SHIPPING_FLAT
:
number
)
{
    // Calcular subtotal
    let subtotal = 0
    for (const item of order.items) {
        subtotal += item.price * item.quantity
    }

    // Descuento por cliente VIP (10% del subtotal)
    let discount = 0
    if (order.customerType === 'VIP') {
        discount = roundMoney(subtotal * 0.1)
        console.log('Descuento VIP aplicado')
    }

    // Base imponible
    const taxable = Math.max(0, subtotal - discount)

    // Impuestos
    const tax = roundMoney(taxable * TAX_RATE)

    // Envío
    const shipping = taxable >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT

    // Total
    const total = roundMoney(taxable + tax + shipping)

    // Actualizar el pedido (side-effects requeridos)
    order.subtotal = roundMoney(subtotal)
    order.discount = discount
    order.tax = tax
    order.shipping = shipping
    order.total = total
    return total;
}
```

`total` se devuelve porque se va a utilizar en otros lugares del código, concretamente en una línea que pertenece al
bloque de persistencia:

```typescript
// Simular reintentos de escritura
let dbSaved = false
while (!dbSaved && dbRetries < dbRetriesMax) {
    dbRetries++
    if (!dbConnected) {
        console.log(`[DB] Intento ${dbRetries}/${dbRetriesMax}: reconectando a la base de datos...`)
    } else {
        console.log(`[DB] Intento ${dbRetries}/${dbRetriesMax}: guardando pedido ${dbRecord.id} con total ${formatMoney(total)}`)
    }
    // Resultado aleatorio simulado, pero aquí siempre "exitoso" para no complicar flujos de prueba
    dbSaved = true
}
```

Esto ilustra bastante bien un problema que nos podemos encontrar en muchas ocasiones: el código entrelazado aquí y allá
y que hace que grupos de líneas mantengan dependencias que nos impiden separarlos fácilmente.

Así, por ejemplo, `order` se usa en este mismo bloque de persistencia, con toda la razón porque estamos procesándola.
Por tanto, cuando intentemos extraer este bloque, necesitaremos pasárselo como parámetro. En principio, deberíamos hacer
lo mismo con `total`, pero es fácil ver que no es necesario ya que `total` puede ser sustituido por `order.total`.

Esto implica básicamente que podríamos dejar de retornar total en esa llamada y reemplazar su uso por `order.total` en
donde corresponda, cambio que no afecta al testing:

```typescript
// Simular reintentos de escritura
let dbSaved = false
while (!dbSaved && dbRetries < dbRetriesMax) {
    dbRetries++
    if (!dbConnected) {
        console.log(`[DB] Intento ${dbRetries}/${dbRetriesMax}: reconectando a la base de datos...`)
    } else {
        console.log(`[DB] Intento ${dbRetries}/${dbRetriesMax}: guardando pedido ${dbRecord.id} con total ${formatMoney(order.total)}`)
    }
    // Resultado aleatorio simulado, pero aquí siempre "exitoso" para no complicar flujos de prueba
    dbSaved = true
}
```

Por otra parte, las constantes de negocio:

```typescript
    // Constantes de negocio (simples por ahora)
const TAX_RATE = 0.21 // 21% IVA
const FREE_SHIPPING_THRESHOLD = 50
const SHIPPING_FLAT = 5

const total = this.calculateOrderTotal(order, TAX_RATE, FREE_SHIPPING_THRESHOLD, SHIPPING_FLAT);
```

Se pasan a `calculateOrderTotal` y solo se usan allí. La pregunta que me hago es: ¿pertenecen a `OrderService` o
pertenecen a `Order`?

Por lo general, si las variables se definen y asignan en un lugar y solo se usan una vez es probable que simplemente
podamos aplicar un _Inline Variable_. O sea: reemplazar la variable por su valor y eliminar la variable temporal. Pero,
en este caso, hacerlo nos conduce a un smell _Magic Number_, un valor arbitrario en el código cuyo significado de
negocio no es explícito.

Sin embargo, podríamos incluir estas constantes en el método `calculateOrderTotal`, que es donde se usan y ya veremos
más adelante como seguir.

```typescript
private
calculateOrderTotal(order
:
Order
):
void {
    // Constantes de negocio (simples por ahora)
    const TAX_RATE = 0.21 // 21% IVA
    const FREE_SHIPPING_THRESHOLD = 50
    const SHIPPING_FLAT = 5

    // Calcular subtotal
    let subtotal = 0
    for(const item of order.items
)
{
    subtotal += item.price * item.quantity
}

// Descuento por cliente VIP (10% del subtotal)
let discount = 0
if (order.customerType === 'VIP') {
    discount = roundMoney(subtotal * 0.1)
    console.log('Descuento VIP aplicado')
}

// Base imponible
const taxable = Math.max(0, subtotal - discount)

// Impuestos
const tax = roundMoney(taxable * TAX_RATE)

// Envío
const shipping = taxable >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT

// Total
const total = roundMoney(taxable + tax + shipping)

// Actualizar el pedido (side-effects requeridos)
order.subtotal = roundMoney(subtotal)
order.discount = discount
order.tax = tax
order.shipping = shipping
order.total = total
}
```

Esto nos deja el inicio del método `process` así:

```typescript
export class OrderService {
    process(order: Order) {
        if (!this.validateOrder(order)) {
            return
        }

        this.calculateOrderTotal(order);

        // Code removed for clarity
    }
}
```

Vemos claramente que estamos introduciendo métodos que realmente pertenecen a `Order`.

#### Persistencia

El bloque que sigue nos indica que vamos a guardar el pedido en la base de datos. Y es un buen pedazo de bloque con
cerca de 70 líneas.

```typescript
// Registrar en la base de datos (simulado)
// Bloque gigantesco y sobrecargado para simular persistencia con múltiples pasos innecesarios
const dbConnectionString = 'Server=fake.db.local;Database=orders;User=demo;Password=demo'
const dbConnected = true // pretendemos que ya está conectado
const dbRetriesMax = 3
let dbRetries = 0
const dbNow = new Date()
const dbRecordId = this.generateDbRecordId();

// Preparar registro a guardar
const dbRecord = {
    id: dbRecordId,
    customerEmail: order.customerEmail,
    customerType: order.customerType,
    items: order.items.map(i => ({name: i.name, price: i.price, quantity: i.quantity})),
    amounts: {
        subtotal: order.subtotal,
        discount: order.discount,
        tax: order.tax,
        shipping: order.shipping,
        total: order.total,
    },
    status: 'PENDING',
    createdAt: dbNow.toISOString(),
    updatedAt: dbNow.toISOString(),
    currency: 'USD',
}

// Validaciones redundantes antes de guardar
const hasItems = Array.isArray(dbRecord.items) && dbRecord.items.length > 0
const totalsConsistent = typeof dbRecord.amounts.total === 'number' && dbRecord.amounts.total >= 0
if (!hasItems) {
    console.warn('[DB] No se puede guardar: el pedido no tiene items')
}
if (!totalsConsistent) {
    console.warn('[DB] No se puede guardar: total inconsistente')
}

// Simular transformación/serialización pesada
const serialized = JSON.stringify(dbRecord, null, 2)
const payloadBytes = Buffer.byteLength(serialized, 'utf8')
console.log(`[DB] Serializando registro ${dbRecord.id} (${payloadBytes} bytes) para ${dbConnectionString}`)

// Simular reintentos de escritura
let dbSaved = false
while (!dbSaved && dbRetries < dbRetriesMax) {
    dbRetries++
    if (!dbConnected) {
        console.log(`[DB] Intento ${dbRetries}/${dbRetriesMax}: reconectando a la base de datos...`)
    } else {
        console.log(`[DB] Intento ${dbRetries}/${dbRetriesMax}: guardando pedido ${dbRecord.id} con total ${formatMoney(order.total)}`)
    }
    // Resultado aleatorio simulado, pero aquí siempre "exitoso" para no complicar flujos de prueba
    dbSaved = true
}

if (dbSaved) {
    console.log(`[DB] Pedido ${dbRecord.id} guardado correctamente`)
} else {
    console.error(`[DB] No se pudo guardar el pedido ${dbRecord.id} tras ${dbRetriesMax} intentos`)
}

// Auditoría/bitácora adicional innecesaria
const auditLogEntry = {
    type: 'ORDER_SAVED',
    orderId: dbRecord.id,
    actor: 'system',
    at: this.getCurrentDate().toISOString(),
    metadata: {
        ip: '127.0.0.1',
        userAgent: 'OrderService/1.0',
    }
}
console.log('[AUDIT] Registro:', JSON.stringify(auditLogEntry))

```

Lo primero que vamos a hacer es extraerlo. Mi expectativa es que solo se tenga que pasar `order` y que no haya otra
dependencia entre estas líneas y el resto. Con los refactors automáticos es fácil probar este tipo de cosas.

Y esto es lo que obtenemos:

```typescript
const {dbRecord, serialized} = this.persistOrder(order)
```

El método extraído retorna el `dbRecord` y el `payload` serializado. ¿Quién más los necesita?

Pues básicamente el bloque de envío de correo. Al obtener una representación del pedido que contiene algunos datos
extra, como el `dbRecordId`, que podrían ser de utilidad en otros lugares, la persona que escribió el código del envío
de email quiso aprovecharlo. Lamentablemente, eso genera un acoplamiento entre ambos bloques. Lo ideal es deshacer ese
entrelazado antes de extraer el bloque de persistencia.

Si estudiamos el código de envío de email lo que podemos constatar es que el dato que necesitamos es el número de
pedido. Para todo lo demás se accede directamente a las propiedades de `order`. Otro _smell_ ya que `Order` ahora mismo
es una _Data Class_, pero ya nos ocuparemos de ello en otro momento.

Por su parte, el envío de email también necesita de `serialized`, otra representación de `Order` generada en el bloque
de persistencia.

Tenemos dos cuestiones que resolver:

* ¿Quién debería generar el número de pedido?
* ¿Deben usar la persistencia y el envío de email la misma serialización?

En mi opinión, la primera pregunta tiene una respuesta clara: el número de pedido debe generarse fuera de la
persistencia y debería estar en `Order` ya que le proporciona identidad. Aun asumiendo que este número de pedido no se
asigna hasta que el pedido es válido y se puede procesar. O, dicho de otra forma, la asignación de número de pedido
forma parte del procesado del mismo. Esto mueve la responsabilidad de generarlo fuera de la persistencia y permite
ponerlo a disposición de cualquier otro componente que maneje `Order`.

Mi respuesta para la segunda pregunta es que aunque usen la misma serialización no tienen que usar la misma instancia.
Es decir, cada uno de los componentes ha de serializar la instancia de `Order` que reciban, aunque en último término
usan el mismo mecanismo de serialización.

En consecuencia, el bloque de persistencia no debería devolver nada, mientras que Order debería generar su propio número
de pedido y que el bloque de Email debería depender única y exclusivamente de `Order`.

```typescript
order.id = this.generateDbRecordId()
```

Necesitamos introducir la propiedad `id` en `Order`.

```typescript
export interface Order {
    id: number;
    customerEmail: string
    customerType: 'NORMAL' | 'VIP'
    items: { name: string; price: number; quantity: number }[]
    subtotal?: number
    discount?: number
    tax?: number
    shipping?: number
    total?: number
}
```

Y empezar a usarla en lugar de `dbRecord.id` al menos fuera del bloque de persistencia. Dentro de ese bloque no tenemos
inconveniente. De hecho, lo preferiremos.

```typescript
const dbRecord = {
    id: order.id, // Replace dbRecordId with order.id
    customerEmail: order.customerEmail,
    customerType: order.customerType,
    items: order.items.map(i => ({name: i.name, price: i.price, quantity: i.quantity})),
    amounts: {
        subtotal: order.subtotal,
        discount: order.discount,
        tax: order.tax,
        shipping: order.shipping,
        total: order.total,
    },
    status: 'PENDING',
    createdAt: dbNow.toISOString(),
    updatedAt: dbNow.toISOString(),
    currency: 'USD',
}
```

Nos quedaría lidiar con la serialización. Básicamente se produce aquí:

```typescript
// Simular transformación/serialización pesada
const serialized = JSON.stringify(dbRecord, null, 2)
```

Parte del problema es que serializamos una representación de `Order` que no es exactamente `Order`, sino `dbRecord`. En
mi opinión, la serialización, o la representación que serialicemos, debería partir directamente de `Order` ya que el
envío del Email es algo totalmente ajeno a la persistencia. Pero esto provoca problemas en el test, ya que cambia el
resultado, aunque solo sea ligeramente.

Siendo estrictas, no debemos hacer este cambio todavía que estamos refactorizando, por lo que los tests deben mantenerse
pasando siempre e inalterados.

Las opciones serían:

* Que el bloque de persistencia devuelve la serialización y pasarla al bloque de envío de email.
* Separar la serialización (y la representación en forma de dbRecord) para poder reutilizarla en varios lugares
  diferentes.

La idea de esta última opción es que `Order` acabará siendo una entidad capaz de generar una representación como
`dbRecord` en forma de DTO, que podrá serializarse. Y mientras tanto, lo aislamos en métodos privados de `OrderService`.

Por una parte, queremos aislar este código, en el que tenemos otra dependencia del reloj del sistema que no se había
manifestado hasta ahora.

```typescript
const dbNow = new Date()
// Preparar registro a guardar
const dbRecord = {
    id: order.id,
    customerEmail: order.customerEmail,
    customerType: order.customerType,
    items: order.items.map(i => ({name: i.name, price: i.price, quantity: i.quantity})),
    amounts: {
        subtotal: order.subtotal,
        discount: order.discount,
        tax: order.tax,
        shipping: order.shipping,
        total: order.total,
    },
    status: 'PENDING',
    createdAt: dbNow.toISOString(),
    updatedAt: dbNow.toISOString(),
    currency: 'USD',
}
```

En principio, podemos resolverla así:

```typescript
const dbNow = this.getCurrentDate()
```

Y extraer el código a un método privado:

```typescript
const dbRecord = this.mapOrderToDto(order);
```

```typescript
private
mapOrderToDto(order
:
Order
)
{
    const dbNow = this.getCurrentDate()
    // Preparar registro a guardar
    return {
        id: order.id,
        customerEmail: order.customerEmail,
        customerType: order.customerType,
        items: order.items.map(i => ({name: i.name, price: i.price, quantity: i.quantity})),
        amounts: {
            subtotal: order.subtotal,
            discount: order.discount,
            tax: order.tax,
            shipping: order.shipping,
            total: order.total,
        },
        status: 'PENDING',
        createdAt: dbNow.toISOString(),
        updatedAt: dbNow.toISOString(),
        currency: 'USD',
    };
}
```

Lo siguiente es hacer lo mismo con la serialización:

```typescript
const serialized = this.serialize(dbRecord);
```

Esto ocurre al usar el refactor automático:

```typescript
private
serialize(dbRecord
:
{
    id: number;
    customerEmail: string;
    customerType: "NORMAL" | "VIP";
    items: {
        name: string;
        price: number;
        quantity: number
    }
    [];
    amounts: {
        subtotal: number | undefined;
        discount: number | undefined;
        tax: number | undefined;
        shipping: number | undefined;
        total: number | undefined
    }
    ;
    status: string;
    createdAt: string;
    updatedAt: string;
    currency: string
}
)
{
    // Simular transformación/serialización pesada
    return JSON.stringify(dbRecord, null, 2);
}
```

Ahora podemos usar estos mismos métodos en el bloque de envío de email y desligarlo del bloque de persistencia. Gracias
a eso, aunque repitamos el mapeado a DTO y la serialización, habremos dejado de tener dependencias entre ellos.

```typescript
const serializedForEmail = this.serialize(this.mapOrderToDto(order));
const attachments = [
    {filename: `pedido-${order.id}.json`, content: serializedForEmail, contentType: 'application/json'},
    {filename: 'terminos.txt', content: 'Términos y condiciones...', contentType: 'text/plain'}
]
```

Con esto, debería poder extraer el bloque de persistencia a un método privado sin tener que mantener variables:

```typescript
export class OrderService {
    process(order: Order) {
        if (!this.validateOrder(order)) {
            return
        }

        order.id = this.generateDbRecordId()

        this.calculateOrderTotal(order);

        this.persistOrder(order);

        // Code removed for clarity
    }

    // Code removed for clarity
}
```

#### Envío de Email

El bloque de envío de Emails debería ser algo sencillo y extraerse sin dependencias, pero vamos a comprobarlo.
Efectivamente, la extracción es limpia y no hay variables que nos impidan hacerlo.

```typescript
export class OrderService {
    process(order: Order) {
        if (!this.validateOrder(order)) {
            return
        }

        order.id = this.generateDbRecordId()

        this.calculateOrderTotal(order);

        this.persistOrder(order);
        this.sendOrderConfirmationEmail(order);
        // Code removed for clarity
    }

    // Code removed for clarity
}
```

#### Imprimir el pedido

Finalmente, solo nos queda el bloque imprime el pedido, que también resulta sencillo:

```typescript
export class OrderService {
    process(order: Order) {
        if (!this.validateOrder(order)) {
            return
        }

        order.id = this.generateDbRecordId()

        this.calculateOrderTotal(order);

        this.persistOrder(order);
        this.sendOrderConfirmationEmail(order);
        this.printOrder(order);
    }

    // Code removed for clarity
}
```

Ahora el método principal `process` es muy sencillo y limpio: nos muestra los pasos que debe seguir el proceso de un
pedido. Y al haber conseguido romper dependencias entre los tres últimos, podríamos incluso ejecutarlos en distinto
orden, una vez validado y completado el cálculo del total.

### Introducir clases colaboradoras

Lo importante ahora es que los tests siguen pasando y tenemos las responsabilidades generales separadas. El trabajo no
está terminado aún, pero ya podemos empezar a introducir clases colaboradoras que se hagan cargo de cada una de ellas.

Para ello introduciremos nuevas clases y nos llevaremos el código necesario.

#### Persistencia

Voy a llamar a esta clase `OrderDatabase` para no crear falsas expectativas con conceptos como `OrderRepository`.
Simplemente, `OrderDatabase` es una clase que se encarga de persistir un pedido en la base de datos.

Inicialmente, voy a crearla y copiar el método `persistOrder`, aunque no lo voy a usar todavía, pero sí inyectarla en el
constructor de `OrderService`. Tengo que llevarme algunos métodos auxiliares, como `mapOrderToDto`, `getCurrentDate` y
`serialize`.

```typescript
class OrderDatabase {
    public persist(order: Order) {
        // Registrar en la base de datos (simulado)
        // Bloque gigantesco y sobrecargado para simular persistencia con múltiples pasos innecesarios
        const dbConnectionString = 'Server=fake.db.local;Database=orders;User=demo;Password=demo'
        const dbConnected = true // pretendemos que ya está conectado
        const dbRetriesMax = 3
        let dbRetries = 0

        const dbRecord = this.mapOrderToDto(order);

        // Validaciones redundantes antes de guardar
        const hasItems = Array.isArray(dbRecord.items) && dbRecord.items.length > 0
        const totalsConsistent = typeof dbRecord.amounts.total === 'number' && dbRecord.amounts.total >= 0
        if (!hasItems) {
            console.warn('[DB] No se puede guardar: el pedido no tiene items')
        }
        if (!totalsConsistent) {
            console.warn('[DB] No se puede guardar: total inconsistente')
        }
        const serialized = this.serialize(dbRecord);
        const payloadBytes = Buffer.byteLength(serialized, 'utf8')
        console.log(`[DB] Serializando registro ${dbRecord.id} (${payloadBytes} bytes) para ${dbConnectionString}`)

        // Simular reintentos de escritura
        let dbSaved = false
        while (!dbSaved && dbRetries < dbRetriesMax) {
            dbRetries++
            if (!dbConnected) {
                console.log(`[DB] Intento ${dbRetries}/${dbRetriesMax}: reconectando a la base de datos...`)
            } else {
                console.log(`[DB] Intento ${dbRetries}/${dbRetriesMax}: guardando pedido ${dbRecord.id} con total ${formatMoney(order.total)}`)
            }
            // Resultado aleatorio simulado, pero aquí siempre "exitoso" para no complicar flujos de prueba
            dbSaved = true
        }

        if (dbSaved) {
            console.log(`[DB] Pedido ${dbRecord.id} guardado correctamente`)
        } else {
            console.error(`[DB] No se pudo guardar el pedido ${dbRecord.id} tras ${dbRetriesMax} intentos`)
        }

        // Auditoría/bitácora adicional innecesaria
        const auditLogEntry = {
            type: 'ORDER_SAVED',
            orderId: dbRecord.id,
            actor: 'system',
            at: this.getCurrentDate().toISOString(),
            metadata: {
                ip: '127.0.0.1',
                userAgent: 'OrderService/1.0',
            }
        }
        console.log('[AUDIT] Registro:', JSON.stringify(auditLogEntry))
    }

    protected getCurrentDate(): Date {
        return new Date();
    }

    private serialize(dbRecord: {
        id: number;
        customerEmail: string;
        customerType: "NORMAL" | "VIP";
        items: { name: string; price: number; quantity: number }[];
        amounts: {
            subtotal: number | undefined;
            discount: number | undefined;
            tax: number | undefined;
            shipping: number | undefined;
            total: number | undefined
        };
        status: string;
        createdAt: string;
        updatedAt: string;
        currency: string
    }) {
        // Simular transformación/serialización pesada
        return JSON.stringify(dbRecord, null, 2);
    }

    private mapOrderToDto(order: Order) {
        const dbNow = this.getCurrentDate()
        // Preparar registro a guardar
        return {
            id: order.id,
            customerEmail: order.customerEmail,
            customerType: order.customerType,
            items: order.items.map(i => ({name: i.name, price: i.price, quantity: i.quantity})),
            amounts: {
                subtotal: order.subtotal,
                discount: order.discount,
                tax: order.tax,
                shipping: order.shipping,
                total: order.total,
            },
            status: 'PENDING',
            createdAt: dbNow.toISOString(),
            updatedAt: dbNow.toISOString(),
            currency: 'USD',
        };
    }
} 
```

Y ahora tenemos que usarlo en `OrderService`:

```typescript
export class OrderService {
  private readonly orderDatabase: OrderDatabase

  constructor(orderDatabase: OrderDatabase = new OrderDatabase()) {
    this.orderDatabase = orderDatabase;
  }
  
  // Code removed for clarity
}
```

Y, reemplazamos el contenido del método `persistOrder` por el siguiente:

```typescript
private persistOrder(order: Order) {
    this.orderDatabase.persist(order)
}
```

Esto me genera un problema por las fechas. La nueva clase genera su propia fecha, necesitamos controlar eso. Podríamos aplicar un _seam_, como hicimos con `OrderService`, pero en este caso podemos introducir otra clase colaboradora que se encargue de proporcionar la fecha actual. Así que introducimos la interfaz `Clock` y una clase `SystemClock` que se encarga de proporcionar la fecha del sistema, más una clase `ClockStub` para tests.

```typescript
interface Clock {
    getCurrentDate(): Date;
}

class SystemClock implements Clock {
    getCurrentDate(): Date {
        return new Date();
    }
}

class ClockStub implements Clock {
    private readonly currentDate: Date;

    constructor(currentDate: Date) {
        this.currentDate = currentDate;
    }

    getCurrentDate(): Date {
        return this.currentDate;
    }
}
```

Ahora cambiamos el test para montar `OrderService` con todo lo que necsitamos:

```typescript
describe('long method', () => {
    describe.for(['NORMAL', 'VIP'])('Given a %s customer', (customerType: string) => {
        describe.for([
            {name: 'shipping costs', items: hasShippingCosts},
            {name: 'free shipping', items: hasFreeShipping},
            {name: 'no items', items: hasNoItems},
            {name: 'invalid price', items: hasInvalidPrice},
            {name: 'invalid quantity', items: hasInvalidQuantity},
        ])('When the order has $name', (example: { name: string; items: ItemCollection }) => {
            it('should process the order', () => {
                const logSpy = vi.spyOn(console, 'log')

                const order = {
                    customerEmail: 'customer@example.com',
                    customerType: customerType,
                    items: example.items,
                } as Order

                const clock = new ClockStub(new Date('2023-05-21T13:35'))
                const db = new OrderDatabase(clock)
                const orderService = new TestableOrderService(db);
                orderService.process(order)

                let output = formatConsoleCalls(logSpy)
                expect(output).toMatchSnapshot()

                logSpy.mockRestore()
            });
        })
    })
})
```

Ciertamente, podríamos cambiar OrderService para aceptar también un `Clock` y usarlo en lugar de sobreescribir el método `getCurrentDate`. Es un paso para eliminar la clase `TestableOrderService`.

```typescript
export class OrderService {
    private readonly orderDatabase: OrderDatabase
    private readonly clock: Clock

    constructor(orderDatabase: OrderDatabase, clock: Clock) {
        this.orderDatabase = orderDatabase;
        this.clock = clock;
    }

    private getCurrentDate(): Date {
        return this.clock.getCurrentDate();
    }
}
```

Y ya no necesitamos ese override:

```typescript
class TestableOrderService extends OrderService {
    protected generateDbRecordId(): number {
        return 67234;
    }

    protected generatePrintJobId(): string {
        return 'prn-1762191762553-125';
    }
}
```

El test queda así:

```typescript
describe('long method', () => {
    describe.for(['NORMAL', 'VIP'])('Given a %s customer', (customerType: string) => {
        describe.for([
            {name: 'shipping costs', items: hasShippingCosts},
            {name: 'free shipping', items: hasFreeShipping},
            {name: 'no items', items: hasNoItems},
            {name: 'invalid price', items: hasInvalidPrice},
            {name: 'invalid quantity', items: hasInvalidQuantity},
        ])('When the order has $name', (example: { name: string; items: ItemCollection }) => {
            it('should process the order', () => {
                const logSpy = vi.spyOn(console, 'log')

                const order = {
                    customerEmail: 'customer@example.com',
                    customerType: customerType,
                    items: example.items,
                } as Order

                const clock = new ClockStub(new Date('2023-05-21T13:35'))
                const db = new OrderDatabase(clock)
                const orderService = new TestableOrderService(db, clock);
                orderService.process(order)

                let output = formatConsoleCalls(logSpy)
                expect(output).toMatchSnapshot()

                logSpy.mockRestore()
            });
        })
    })
})
```

Y sigue pasando correctamente.

Para extraer las otras clases que tenemos pendientes haremos un proceso similar. Crear la nueva clase, copiar en ella el método que vamos a sustituir, darle visibilidad pública y cambiar lo necesario para que funcione. Finalmente, la inyectamos en el constructor de `OrderService`.

#### Envío de emails

Aquí tendríamos la clase extraída:

```typescript
class EmailSender {
    private readonly clock: Clock

    constructor(clock: Clock) {
        this.clock = clock;
    }

    public sendOrderConfirmationEmail(order: Order) {
        // Enviar correo de confirmación
        // Bloque gigantesco para simular el envío de un correo con plantillas, adjuntos, y seguimiento
        const smtpConfig = {
            host: 'smtp.fake.local',
            port: 587,
            secure: false,
            auth: {user: 'notifier', pass: 'notifier'},
            tls: {rejectUnauthorized: false}
        }
        const emailTemplate = `
      Hola,
      Gracias por tu pedido. Aquí tienes el resumen:\n
      Subtotal: ${formatMoney(order.subtotal)}\n
      Descuento: ${order.discount && order.discount > 0 ? '-' + formatMoney(order.discount) : formatMoney(0)}\n
      Impuestos: ${formatMoney(order.tax)}\n
      Envío: ${formatMoney(order.shipping)}\n
      Total: ${formatMoney(order.total)}\n

      Nº de pedido: ${order.id}\n
      Fecha: ${new Date().toLocaleString()}\n

      Saludos,
      Equipo Demo
    `
        const trackingPixelUrl = `https://tracker.fake.local/pixel?orderId=${order.id}&t=${Date.now()}`
        const emailBodyHtml = `
      <html>
        <body>
          <p>Hola,</p>
          <p>Gracias por tu pedido. Aquí tienes el resumen:</p>
          <ul>
            <li>Subtotal: <strong>${formatMoney(order.subtotal)}</strong></li>
            <li>Descuento: <strong>${order.discount && order.discount > 0 ? '-' + formatMoney(order.discount) : formatMoney(0)}</strong></li>
            <li>Impuestos: <strong>${formatMoney(order.tax)}</strong></li>
            <li>Envío: <strong>${formatMoney(order.shipping)}</strong></li>
            <li>Total: <strong>${formatMoney(order.total)}</strong></li>
          </ul>
          <p>Nº de pedido: <code>${order.id}</code></p>
          <p>Fecha: ${new Date().toLocaleString()}</p>
          <img src="${trackingPixelUrl}" width="1" height="1" alt=""/>
        </body>
      </html>
    `
        const serializedForEmail = this.serialize(this.mapOrderToDto(order));
        const attachments = [
            {filename: `pedido-${order.id}.json`, content: serializedForEmail, contentType: 'application/json'},
            {filename: 'terminos.txt', content: 'Términos y condiciones...', contentType: 'text/plain'}
        ]

        // Simular cálculo de tamaño del correo
        const emailSize = Buffer.byteLength(emailBodyHtml, 'utf8') + attachments.reduce((acc, a) => acc + Buffer.byteLength(a.content, 'utf8'), 0)
        console.log(`[MAIL] Preparando correo (${emailSize} bytes) vía ${smtpConfig.host}:${smtpConfig.port}`)

        // Simular colas de envío y priorización
        const emailPriority = order.customerType === 'VIP' ? 'HIGH' : 'NORMAL'
        console.log(`[MAIL] Encolando correo (${emailPriority}) para ${order.customerEmail}`)

        // Simular envío con reintentos
        let mailAttempts = 0
        const mailAttemptsMax = 2
        let mailSent = false
        while (!mailSent && mailAttempts < mailAttemptsMax) {
            mailAttempts++
            console.log(`[MAIL] Intento ${mailAttempts}/${mailAttemptsMax}: enviando correo a ${order.customerEmail}`)
            // Simulación simple de éxito
            mailSent = true
        }

        const messageId = `msg-${order.id}-${this.getCurrentDate().getTime()}`
        if (mailSent) {
            console.log(`[MAIL] Correo enviado a ${order.customerEmail} (messageId=${messageId})`)
        } else {
            console.error(`[MAIL] Fallo al enviar correo a ${order.customerEmail} tras ${mailAttemptsMax} intentos`)
        }
    }

    private serialize(dbRecord: { id: number; customerEmail: string; customerType: "NORMAL" | "VIP"; items: { name: string; price: number; quantity: number }[]; amounts: { subtotal: number | undefined; discount: number | undefined; tax: number | undefined; shipping: number | undefined; total: number | undefined }; status: string; createdAt: string; updatedAt: string; currency: string }) {
        // Simular transformación/serialización pesada
        return JSON.stringify(dbRecord, null, 2);
    }

    private mapOrderToDto(order: Order) {
        const dbNow = this.getCurrentDate()
        // Preparar registro a guardar
        return {
            id: order.id,
            customerEmail: order.customerEmail,
            customerType: order.customerType,
            items: order.items.map(i => ({name: i.name, price: i.price, quantity: i.quantity})),
            amounts: {
                subtotal: order.subtotal,
                discount: order.discount,
                tax: order.tax,
                shipping: order.shipping,
                total: order.total,
            },
            status: 'PENDING',
            createdAt: dbNow.toISOString(),
            updatedAt: dbNow.toISOString(),
            currency: 'USD',
        };
    }


    private getCurrentDate() {
        return this.clock.getCurrentDate()
    }
}
```

Podemos ver que hay código que se repite. De momento, no nos vamos a preocupar por eso. Nuestro objetivo a corto plazo es extraer toda esta funcionalidad a clases especializadas. Posteriormente, cada uno requerirá su propio tratamiento.

```typescript
export class OrderService {
    private readonly orderDatabase: OrderDatabase
    private readonly clock: Clock
    private readonly emailSender: EmailSender

    constructor(orderDatabase: OrderDatabase, clock: Clock, emailSender: EmailSender) {
        this.orderDatabase = orderDatabase;
        this.clock = clock;
        this.emailSender = emailSender;
    }

    process(order: Order) {
        if (!this.validateOrder(order)) {
            return
        }

        order.id = this.generateDbRecordId()

        this.calculateOrderTotal(order);

        this.persistOrder(order);
        this.sendOrderConfirmationEmail(order);
        this.printOrder(order);
    }

    private sendOrderConfirmationEmail(order: Order) {
        this.emailSender.sendOrderConfirmationEmail(order)
    }
    // Code removed for clarity
}
```

Y se usa así:

```typescript
const clock = new ClockStub(new Date('2023-05-21T13:35'))
const db = new OrderDatabase(clock)
const emailSender = new EmailSender(clock)
const orderService = new TestableOrderService(db, clock, emailSender);
orderService.process(order)
```

Al hacer este cambio dejan de usarse los métodos serialize y mapOrderToDto en OrderService, por lo que podemos eliminarlos.

#### Impresión del pedido

Tenemos que seguir exactamente el mismo proceso para extraer la clase `OrderPrinter`. Es decir: introducir la nueva clase, mover a ella el código necesario, hacer público el método principal y, finalmente, inyectarla como dependencia en el constructor de `OrderService`.

```typescript
export class OrderPrinter {
    private readonly clock: Clock

    constructor(clock: Clock) {
        this.clock = clock;
    }

    public print(order: Order) {
        // Imprimir resumen -> enviar a impresora
        const printJob: PrintJob = {
            title: 'Resumen del pedido',
            items: order.items.map(i => ({
                name: i.name,
                quantity: i.quantity,
                lineTotal: roundMoney(i.price * i.quantity),
                lineTotalFormatted: formatMoney(i.price * i.quantity),
            })),
            subtotal: order.subtotal ?? 0,
            discount: order.discount ?? 0,
            tax: order.tax ?? 0,
            shipping: order.shipping ?? 0,
            total: order.total ?? 0,
            currency: 'USD',
            formatted: {
                subtotal: formatMoney(order.subtotal),
                discount: order.discount && order.discount > 0 ? `-${formatMoney(order.discount)}` : formatMoney(0),
                tax: formatMoney(order.tax),
                shipping: formatMoney(order.shipping),
                total: formatMoney(order.total),
            },
            metadata: {
                customerEmail: order.customerEmail,
                createdAt: new Date().toISOString(),
            }
        }

        // Simulación de envío a impresora: bloque deliberadamente grande y sobrecargado
        // Configuración de impresora (ficticia)
        const printerConfig = {
            name: 'Demo Thermal Printer TP-80',
            model: 'TP-80',
            dpi: 203,
            widthMm: 80,
            maxCharsPerLine: 42, // típico en papel de 80mm con fuente estándar
            interface: 'USB',
            driver: 'ESC/POS',
            location: 'Front Desk',
        }

        // Capabilities detectadas (simuladas)
        const printerCaps = {
            supportsBold: true,
            supportsUnderline: true,
            supportsQr: true,
            supportsBarcode: true,
            supportsImages: false,
            codepage: 'cp437'
        }

        // Conexión (simulada)
        const printerConn = {connected: true, retries: 0, maxRetries: 2}
        console.log(`[PRN] Preparando conexión a impresora ${printerConfig.name} (${printerConfig.interface}/${printerConfig.driver})`)

        // Crear contenido del recibo
        const now = this.getCurrentDate()
        const lineWidth = printerConfig.maxCharsPerLine

        const padRight = (text: string, len: number) => text.length >= len ? text.slice(0, len) : text + ' '.repeat(len - text.length)
        const padLeft = (text: string, len: number) => text.length >= len ? text.slice(0, len) : ' '.repeat(len - text.length) + text
        const repeat = (ch: string, n: number) => new Array(n + 1).join(ch)

        const formatLine = (left: string, right: string) => {
            const leftTrim = left ?? ''
            const rightTrim = right ?? ''
            const space = Math.max(1, lineWidth - leftTrim.length - rightTrim.length)
            const spaces = repeat(' ', space)
            const tooLong = leftTrim.length + rightTrim.length > lineWidth
            if (tooLong) {
                // Si no cabe, forzamos salto para la izquierda y mantenemos derecha alineada
                return leftTrim + '\n' + padLeft(rightTrim, lineWidth)
            }
            return leftTrim + spaces + rightTrim
        }

        // Cabecera
        const receiptLines: string[] = []
        receiptLines.push(repeat('=', lineWidth))
        receiptLines.push(padRight('RESUMEN DEL PEDIDO', lineWidth))
        receiptLines.push(padRight(now.toLocaleString(), lineWidth))
        receiptLines.push(padRight(`Cliente: ${order.customerEmail}`, lineWidth))
        receiptLines.push(repeat('-', lineWidth))

        // Items
        for (const it of printJob.items) {
            const left = `${it.quantity} x ${it.name}`
            const right = it.lineTotalFormatted
            receiptLines.push(formatLine(left, right))
        }

        // Totales
        receiptLines.push(repeat('-', lineWidth))
        receiptLines.push(formatLine('Subtotal', printJob.formatted.subtotal))
        if ((printJob.discount ?? 0) > 0) {
            receiptLines.push(formatLine('Descuento', `-${formatMoney(printJob.discount)}`))
        } else {
            receiptLines.push(formatLine('Descuento', printJob.formatted.discount))
        }
        receiptLines.push(formatLine('Impuestos', printJob.formatted.tax))
        receiptLines.push(formatLine('Envío', printJob.formatted.shipping))
        receiptLines.push(formatLine('TOTAL', printJob.formatted.total))
        receiptLines.push(repeat('=', lineWidth))

        // Pie con metadatos
        receiptLines.push(padRight(`Nº pedido: ${Math.abs((order.total ?? 0) * 1000) | 0}`, lineWidth))
        receiptLines.push(padRight(`Moneda: ${printJob.currency}`, lineWidth))
        receiptLines.push(padRight(`Creado: ${printJob.metadata.createdAt}`, lineWidth))

        // Comandos ESC/POS simulados (no operativos, solo logging)
        const escposCommands = [
            '[INIT]',
            '[ALIGN LEFT]',
            '[FONT A]',
            printerCaps.supportsBold ? '[BOLD ON]' : '[BOLD N/A]',
            '[PRINT LINES]',
            '[BOLD OFF]',
            '[CUT PARTIAL]'
        ]

        // Montar payload a imprimir
        const textPayload = receiptLines.join('\n') + '\n' + repeat('-', lineWidth) + '\n'
        const commandSection = escposCommands.join(' ')
        const printable = `\n${commandSection}\n${textPayload}`
        const spoolBuffer = Buffer.from(printable, 'utf8')
        const spoolBytes = Buffer.byteLength(printable, 'utf8')

        // Simulación de QR/barcode en el ticket (solo registro)
        const qrData = `ORDER|${order.customerEmail}|${printJob.total}|${now.getTime()}`
        if (printerCaps.supportsQr) {
            console.log(`[PRN] Agregando QR con datos: ${qrData}`)
        } else if (printerCaps.supportsBarcode) {
            console.log(`[PRN] Agregando BARCODE con datos: ${qrData.slice(0, 12)}`)
        } else {
            console.log('[PRN] Sin soporte para QR/BARCODE')
        }

        // Vista previa ASCII (limitada para no saturar logs)
        const preview = textPayload.split('\n').slice(0, 12).join('\n')
        console.log('[PRN] Vista previa del recibo:\n' + preview + (receiptLines.length > 12 ? `\n...(${receiptLines.length - 12} líneas más)` : ''))

        // Encolado de trabajo de impresión
        const printPriority = order.customerType === 'VIP' ? 'HIGH' : 'NORMAL'
        const printJobId = this.generatePrintJobId();
        console.log(`[PRN] Encolando trabajo ${printJobId} (${spoolBytes} bytes, prioridad=${printPriority}) en ${printerConfig.location}`)

        // Envío en trozos (chunking) para simular buffer limitado de la impresora
        const chunkSize = 256 // bytes
        let sentBytes = 0
        let chunkIndex = 0
        let sentOk = true
        while (sentBytes < spoolBytes) {
            const remaining = spoolBytes - sentBytes
            const size = Math.min(chunkSize, remaining)
            const chunk = spoolBuffer.subarray(sentBytes, sentBytes + size)
            // Simular reintentos por chunk
            let attempts = 0
            let delivered = false
            while (!delivered && attempts < 2) {
                attempts++
                console.log(`[PRN] Enviando chunk #${chunkIndex} (${size} bytes) intento ${attempts}/2`)
                // Éxito simulado
                delivered = true
            }
            if (!delivered) {
                console.error(`[PRN] Fallo al enviar chunk #${chunkIndex}`)
                sentOk = false
                break
            }
            sentBytes += size
            chunkIndex++
        }

        // Resultado final de impresión
        if (printerConn.connected && sentOk) {
            console.log(`[PRN] Trabajo ${printJobId} impreso correctamente. Total enviado: ${sentBytes} bytes`)
        } else {
            console.error(`[PRN] Error al imprimir trabajo ${printJobId}. Enviado: ${sentBytes}/${spoolBytes} bytes`)
        }
    }

    protected generatePrintJobId() {
        return `prn-${this.clock.getCurrentDate().getTime()}-${Math.floor(Math.random() * 1000)}`;
    }

    protected getCurrentDate(): Date {
        return this.clock.getCurrentDate();
    }
}
```

En principio, al introducir `OrderPrinter` se rompen los tests. Esto es debido al método `generatePrintJobId()`, el cual teníamos sobreescrito en el seam de `OrderService`, pero que ahora mantiene un comportamiento indeterminista.

```typescript
protected generatePrintJobId() {
    return `prn-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}
```

Podemos solucionarlo con la introducción de una nueva interfaz `PrintJobIdGenerator` y sus correspondientes implementaciones para producción y para test:

```typescript
interface PrintJobIdGenerator {
    generate(): string
}

export class SystemPrintJobIdGenerator implements PrintJobIdGenerator {
    generate(): string {
        return `prn-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }
}

export class PrintJobIdGeneratorStub implements PrintJobIdGenerator {
    private readonly jobId: string;

    constructor(jobId: string) {
        this.jobId = jobId;
    }

    generate(): string {
        return this.jobId;
    }
}

```

```typescript
export class OrderPrinter {
    private readonly clock: Clock
    private readonly printJobIdGenerator: PrintJobIdGenerator;

    constructor(clock: Clock, printJobIdGenerator: PrintJobIdGenerator) {
        this.clock = clock;
        this.printJobIdGenerator = printJobIdGenerator
    }

    public print(order: Order) {...}

    protected generatePrintJobId() {
        return this.printJobIdGenerator.generate();
    }

    protected getCurrentDate(): Date {
        return this.clock.getCurrentDate();
    }
}
```

### Descubriendo colaboradores

Ahora que hemos movido el código de impresión a `OrderPrinter`, vemos que ya no necesitamos tener un Clock en `OrderService`, lo que nos permite eliminar esa dependencia.

Tampoco necesitaremos tener un método `generatePrintJobId` en `OrderService` y podemos eliminar la sobreescritura de `TestableOrderService`.

```typescript
class TestableOrderService extends OrderService {
    protected generateDbRecordId(): number {
        return 67234;
    }
}
```

Esto nos revela otro colaborador que falta, que podría ser un `OrderIdProvider`.

```typescript
interface OrderIdProvider {
  generateId(): number
}

export class RandomOrderIdProvider implements OrderIdProvider {
  generateId(): number {
    return Math.floor(Math.random() * 1000000);
  }
}

export class OrderIdProviderStub implements OrderIdProvider {
  private readonly id: number;
  
  constructor(id: number) {
    this.id = id;
  }

  generateId(): number {
    return this.id;
  }
}
```

Ahora OrderService se construye así, sin necesidad de tener una versión _Testable_. 

```typescript
const clock = new ClockStub(new Date('2023-05-21T13:35'))
const db = new OrderDatabase(clock)
const emailSender = new EmailSender(clock)
const jobIdGenerator = new PrintJobIdGeneratorStub('prn-1762191762553-125')
const printer = new OrderPrinter(clock, jobIdGenerator)
const idProvider = new OrderIdProviderStub(67234)
const orderService = new OrderService(db, emailSender, printer, idProvider);
orderService.process(order)
```

Esto nos pone, finalmente en una situación bastante mejor que la que teníamos al principio. `OrderService` delega su trabajo en otras clases. Pero podemos ir un poco más lejos antes de empezar a aplicar las nuevas prestaciones.

El artículo está siendo largo, haciendo honor a su temática. Pero refleja una situación que nos podemos encontrar frecuentemente en el desarrollo de software.

### Resolviendo _Data Class_

En el código actual de `OrderService` es fácil ver que buena parte del comportamiento del servicio pertenece a `Order`:

```typescript
if (!this.validateOrder(order)) {
    return
}

order.id = this.generateDbRecordId()

this.calculateOrderTotal(order);
```

Los métodos simplemente acceden de forma directa a las propiedades de `Order`, para hacer cálculos con ellas e incluso asignarles valores. Este patrón es un buen ejemplo de _Data Class_. Básicamente, nos está reclamando que movamos comportamientos a `Order`.

Se trata de algo relativamente fácil de hacer. Básicamente, es copiar el método de `OrderService` en `Order` y cambiar lo necesario. Lo único que, en nuestro caso, tendremos que convertir la interfaz en clase o, en todo caso, implementar la interfaz `Order` en una clase. Esta última opción podría ofrecernos algunas posibilidades muy interesantes como poder tener clases representando diferentes estados de `Order`:

* `PendingOrder` es una `Order` que llega al servicio `OrderService` de la cual no tenemos garantía que esté preparada para ser procesada.
* `ValidatedOrder` es una `Order` con los datos validados, pero sin los cálculos realizados a la que se le ha asignado un identificador.
* `ProcessedOrder` es una `Order` con los datos procesados, incluyendo todos los cálculos y totales.

Vamos a intentarlo por ahí:

```typescript
export interface Order {
    id: number;
    customerEmail: string
    customerType: 'NORMAL' | 'VIP'
    items: { name: string; price: number; quantity: number }[]
    subtotal?: number
    discount?: number
    tax?: number
    shipping?: number
    total?: number

    validate(idProvider: OrderIdProvider): ValidatedOrder

    process(): ProcessedOrder
}
```

`PendingOrder` solo puede intentar validarse, pero no procesarse. Al validarse devuelve una intancia de `ValidatedOrder` que tiene un identificador asignado.

```typescript
export class PendingOrder implements Order {
    id: number
    customerEmail: string
    customerType: 'NORMAL' | 'VIP'
    items: { name: string; price: number; quantity: number }[]

    constructor(
        customerEmail: string,
        customerType: 'NORMAL' | 'VIP',
        items: { name: string; price: number; quantity: number }[],
    ) {
        this.id = 0
        this.customerEmail = customerEmail
        this.customerType = customerType
        this.items = items
    }

    validate(idProvider: OrderIdProvider): ValidatedOrder {
        if (!this.items || this.items.length === 0) {
            console.log('El pedido no tiene productos')
            throw new Error('El pedido no tiene productos')
        }

        for (const item of this.items) {
            if (item.price < 0 || item.quantity <= 0) {
                console.log('Producto inválido en el pedido')
                throw new Error('Producto inválido en el pedido')
            }
        }
        const id = idProvider.generateId()

        return new ValidatedOrder(id, this.customerEmail, this.customerType, this.items)
    }

    process(): ProcessedOrder {
        throw new Error('No se puede procesar un pedido pendiente')
    }
}
```

`ValidatedOrder` solo puede procesarse. Si se intenta validar devuelve su propia isntancia.

```typescript
export class ValidatedOrder implements Order {
    id: number
    customerEmail: string
    customerType: 'NORMAL' | 'VIP'
    items: { name: string; price: number; quantity: number }[]

    constructor(
        id: number,
        customerEmail: string,
        customerType: 'NORMAL' | 'VIP',
        items: { name: string; price: number; quantity: number }[],
    ) {
        this.id = id
        this.customerEmail = customerEmail
        this.customerType = customerType
        this.items = items
    }

    validate(_idProvider: OrderIdProvider): ValidatedOrder {
        return this
    }

    process(): ProcessedOrder {
        // Constantes de negocio (simples por ahora)
        const TAX_RATE = 0.21 // 21% IVA
        const FREE_SHIPPING_THRESHOLD = 50
        const SHIPPING_FLAT = 5

        // Calcular subtotal
        let subtotal = 0
        for (const item of this.items) {
            subtotal += item.price * item.quantity
        }

        // Descuento por cliente VIP (10% del subtotal)
        let discount = 0
        if (this.customerType === 'VIP') {
            discount = roundMoney(subtotal * 0.1)
            console.log('Descuento VIP aplicado')
        }

        // Base imponible
        const taxable = Math.max(0, subtotal - discount)

        // Impuestos
        const tax = roundMoney(taxable * TAX_RATE)

        // Envío
        const shipping = taxable >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT

        // Total
        const total = roundMoney(taxable + tax + shipping)

        return new ProcessedOrder(
            this.id,
            this.customerEmail,
            this.customerType,
            this.items,
            discount,
            shipping,
            roundMoney(subtotal),
            tax,
            total,
        )
    }
}
```

Finalmente, `ProcessedOrder` es la clase que representa un pedido procesado.

```typescript
export class ProcessedOrder implements Order {
  id: number
  customerEmail: string
  customerType: 'NORMAL' | 'VIP'
  items: { name: string; price: number; quantity: number }[]
  discount: number
  shipping: number
  subtotal: number
  tax: number
  total: number

  constructor(
    id: number,
    customerEmail: string,
    customerType: 'NORMAL' | 'VIP',
    items: { name: string; price: number; quantity: number }[],
    discount: number,
    shipping: number,
    subtotal: number,
    tax: number,
    total: number,
  ) {
    this.id = id
    this.customerEmail = customerEmail
    this.customerType = customerType
    this.items = items
    this.discount = discount
    this.shipping = shipping
    this.subtotal = subtotal
    this.tax = tax
    this.total = total
  }

  process(): ProcessedOrder {
    return this
  }

  validate(_idProvider: OrderIdProvider): ValidatedOrder {
    throw new Error('No se puede validar un pedido procesado')
  }
}
```

Así es como queda `OrderService` ahora:

```typescript
export class OrderService {
    private readonly orderDatabase: OrderDatabase
    private readonly emailSender: EmailSender
    private readonly printer: OrderPrinter
    private readonly idProvider: OrderIdProvider

    constructor(
        orderDatabase: OrderDatabase,
        emailSender: EmailSender,
        printer: OrderPrinter,
        idProvider: OrderIdProvider,
    ) {
        this.orderDatabase = orderDatabase
        this.emailSender = emailSender
        this.printer = printer
        this.idProvider = idProvider
    }

    process(order: Order) {
        let validatedOrder: Order | undefined
        try {
            validatedOrder = order.validate(this.idProvider)
        } catch (e) {
            console.error('Error al validar el pedido:', e)
            return
        }

        const processedOrder = validatedOrder.process()

        this.persistOrder(processedOrder)
        this.sendOrderConfirmationEmail(processedOrder)
        this.printOrder(processedOrder)
    }

    private printOrder(order: Order) {
        this.printer.print(order)
    }

    private sendOrderConfirmationEmail(order: Order) {
        this.emailSender.sendOrderConfirmationEmail(order)
    }

    private persistOrder(order: Order) {
        this.orderDatabase.persist(order)
    }
}
```

#### Generar representaciones sin exponer propiedades privadas ni _getters_

Tendríamos que seguir trabajando en `Order` para hacer privadas sus propiedades y generar representaciones en forma de DTO para su uso en otros componentes, donde justamente ese código se repite.

El mayor consumo directo de las propiedades de Order se produce al generar el DTO para persistencia, envío de email, e impresión. De hecho, el DTO que se genera para impresión es diferente de los otros. Por supuesto, esto tiene sentido: la representación que se genera de la entidad de negocio depende del uso que se le vaya a dar. Por tanto, lo usual sería que se genere un DTO para cada caso de uso.

Hacer esto sin acceder a las propiedades de Order o poblarlo de _getters_ es desafiante. El acceso a las propiedades de una clase es un caso de _Inappropriate Intimacy_, otro code smell del grupo de los acopladores. La necesidad de mantener los consumidores de `Order` en conocimiento de sus propiedades nos impide evolucionar la entidad de negocio. 

En otros artículos del blog he tratado este tema en detalle. Para esta ocasión se me ocurre lo siguiente:

* Definir un DTO genérico que represente las propiedades de `Order` con visibilidad pública y de solo lectura. Este DTO solo se usará dentro de Order y contendrá las propiedades necesarias.
* Crear clases Mapper que usen este DTO para generar su propia representación de `Order`.
* Crear una factoría que proporcione una instancia del Mapper adecuado para cada caso de uso. 
* Order expondrá un método que tome la factoría y una indicación de la estrategia de mapeo que desea usar, devolviendo la representación deseada.

Veamos, por ejemplo, el objeto que se genera para persistencia, el cual no se define de forma explícita en ningún sitio:

```typescript
{
    id: number
    customerEmail: string
    customerType: 'NORMAL' | 'VIP'
    items: { name: string; price: number; quantity: number }[]
    amounts: {
        subtotal: number | undefined
        discount: number | undefined
        tax: number | undefined
        shipping: number | undefined
        total: number | undefined
    }
    status: string
    createdAt: string
    updatedAt: string
    currency: string
}
```

Este es el código que hace el mapeo:

```typescript
private mapOrderToDto(order: Order) {
    const dbNow = this.getCurrentDate()
    // Preparar registro a guardar
    return {
        id: order.id,
        customerEmail: order.customerEmail,
        customerType: order.customerType,
        items: order.items.map((i) => ({ name: i.name, price: i.price, quantity: i.quantity })),
        amounts: {
            subtotal: order.subtotal,
            discount: order.discount,
            tax: order.tax,
            shipping: order.shipping,
            total: order.total,
        },
        status: 'PENDING',
        createdAt: dbNow.toISOString(),
        updatedAt: dbNow.toISOString(),
        currency: 'USD',
    }
}
```

En principio necesitamos definir un tipo de DTO equivalente a `Order`. Y lo más fácil sería hacerlo como interfaz (en TypeScript).

```typescript
export interface Item {
    name: string
    price: number
    quantity: number
}

export type ItemCollection = Item[]

export interface OrderDTO {
    id: number
    customerEmail: string
    customerType: 'NORMAL' | 'VIP'
    items: Item[]
    subtotal?: number
    discount?: number
    tax?: number
    shipping?: number
    total?: number
}
```

Por otro lado, definiremos un DTO para la persistencia. Ya está implícito en `OrderDataBase` y que comparte algunos elementos con `OrderDTO`, por lo que podríamos extenderlo.

```typescript
export interface OrderRecordDTO extends OrderDTO{
    amounts: {
        subtotal: number | undefined
        discount: number | undefined
        tax: number | undefined
        shipping: number | undefined
        total: number | undefined
    }
    status: string
    createdAt: string
    updatedAt: string
    currency: string
}
```

Y ahora, creamos un _Mapper_ que lo use para generar el DTO:

```typescript
export class OrderToDatabase {
    private readonly clock: Clock

    constructor(clock: Clock) {
        this.clock = clock
    }

    map(order: OrderData): OrderRecordDTO {
        const dbNow = this.getCurrentDate()

        return {
            id: order.id!,
            customerEmail: order.customerEmail!,
            customerType: order.customerType!,
            items: order.items,
            amounts: {
                subtotal: order.subtotal,
                discount: order.discount,
                tax: order.tax,
                shipping: order.shipping,
                total: order.total,
            },
            status: 'PENDING',
            createdAt: dbNow.toISOString(),
            updatedAt: dbNow.toISOString(),
            currency: 'USD',
        } as OrderRecordDTO
    }

    protected getCurrentDate(): Date {
        return this.clock.getCurrentDate()
    }
}
```

Ahora introduzcamos una factoría de Mappers:

```typescript
export class MapperFactory {
    private readonly clock: Clock

    constructor(clock: Clock) {
        this.clock = clock;
    }

    create(strategy: string) {
        if (strategy === 'database') {
            return new OrderToDatabase(this.clock)
        }
        throw new Error(`No se soporta la estrategia ${strategy}`)
    }
}

```

Así que `Order` necesita un método que genere la representación:

```typescript
representation<T>(factory: MapperFactory, strategy: string): T {
    const data = new OrderData(
        this.id,
        this.customerEmail,
        this.customerType,
        this.items,
        this.subtotal,
        this.discount,
        this.tax,
        this.shipping,
        this.total,
    )
    const mapper = factory.create(strategy)
    return mapper.map(data) as T
}
```

Hacemos lo mismo para `OrderPrinter` y para `EmailSender`: introducir su DTO, crear un Mapper y añadirlo a la factoría.

## Hasta el infinito y más allá

Podríamos seguir refinando cada pieza mucho más, pero estamos escribiendo uno de los artículos más largos del blog, así que convendría ir parando.

En esencia, todo lo que hemos hecho es mover código desde un lugar en donde estaba todo concentrado hacia clases especializadas, identificando responsabilidades y extrayéndolas. De hecho, hasta ahora hemos seguido trabajando con el test original porque todo nuestro trabajo ha consistido en refactorizar, garantizando con el test que no cambiamos ni el más mínimo aspecto del comportamiento del software.

Para mover este código hemos usado principalmente tres tipos de refactor:

* **Extract method**: para separar las responsabilidades dentro de la misma clase en métodos privados.
* **Extract class**: para llevar esas responsabilidades a clases independientes que luego podemos inyectar.
* **Introduce/Move method**: para llevar comportamientos a clases a las que pertenezcan (como entidades y value objects). De hecho, esto es algo que nos ha quedado pendiente. 

Este test tendrá que desaparecer pronto, para permitirnos introducir nuevas funcionalidades. Recuerda: es un test de caracterización que describe el comportamiento que tiene el software cuando empezamos a trabajar con él.

Este trabajo no lo vamos a hacer en este artículo, pero en este punto, la situación para hacerlo es mucho más favorable. Puede que lo veamos en otro artículo, aunque preferiría moverme a otros _smells_.