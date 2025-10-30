---
layout: post
title: Large Class
categories: articles
series: code-smells
tags: code-smells refactoring typescript
---

Otro _code smell_ bastante habitual es tener clases muy grandes, que van acumulando muchas responsabilidades no relacionadas.

## Definición

**Large Class** (Clase Grande) ocurre cuando una clase acumula muchas propiedades, muchos métodos o muchas líneas de código, lo que normalmente supone que está intentando manejar muchas responsabilidades no relacionadas o que pueden responder a necesidades diferentes.

Esto ocurre porque muchas veces resulta más fácil colocar nuevas funcionalidades en una clase existente que introducir una nueva. Especialmente cuando se trata de funcionalidades más o menos relacionadas.

Una clase que acumula muchas responsabilidades acaba convirtiéndose en un _God Object_, otro smell en el que una clase se ocupa de prácticamente todo.

## Ejemplo

La clase `UserAccount` se encarga de un montón de tareas relacionadas entre sí por aplicarse, de algún modo, a un usuario.

```typescript
class UserAccount {
  private name: string
  private email: string
  private password: string
  private lastLogin: Date
  private loginAttempts: number = 0
  private notifications: string[] = []
  private isAdmin: boolean

  constructor(name: string, email: string, password: string, isAdmin: boolean = false) {
    this.name = name
    this.email = email
    this.password = password
    this.lastLogin = new Date()
    this.isAdmin = isAdmin
  }

  login(password: string): boolean {
    if (this.password === password) {
      this.lastLogin = new Date()
      this.loginAttempts = 0
      console.log('Inicio de sesión exitoso')
      return true
    } else {
      this.loginAttempts++
      console.log('Contraseña incorrecta')
      return false
    }
  }

  resetPassword(newPassword: string): void {
    this.password = newPassword
    console.log('Contraseña actualizada')
  }

  updateEmail(newEmail: string): void {
    this.email = newEmail
    console.log('Correo actualizado')
  }

  updateName(newName: string): void {
    this.name = newName
    console.log('Nombre actualizado')
  }

  addNotification(message: string): void {
    this.notifications.push(message)
  }

  getNotifications(): string[] {
    return this.notifications
  }

  clearNotifications(): void {
    this.notifications = []
  }

  promoteToAdmin(): void {
    this.isAdmin = true
  }

  revokeAdmin(): void {
    this.isAdmin = false
  }
}
```

## Ejercicio

Queremos añadir soporte para autenticación de dos factores (2FA) y preferencias de notificación.

## Problemas que encontrarás

Para resolver el ejercicio encontrarás el problema de tener que añadir propiedades y métodos dispares a la clase, esto genera problemas de cohesión y de mantenimiento. Si bien, puede ser una forma cómoda de abordar el desarrollo en el corto plazo, el coste de cambio se multiplica en el largo.

Observarás que hay propiedades que están implicadas solo en algunos métodos, siendo innecesarias en otros.

También resulta difícil recordar todo lo que hace la clase, lo que complica intervenir en ella en caso de necesitar aplicar algún cambio.

Se incrementa el riesgo de que los cambios requeridos por una responsabilidad afecten a otras, introduciendo bugs, ya que hay consumidores interesados en distintos comportamientos que posiblemente ignoren las necesidades de otros.

Todos estos problemas empeoran a medida que añadimos funcionalidades.

## Solución

### Sin resolver el _smell_

Con la situación actual, implementar autenticación de dos factores y preferencias de notificación implicaría añadir dos o tres métodos por funcionalidad a la clase `UserAccount`. Así, por ejemplo, para gestionar la autenticación de dos factores, `UserAccount` tendría que incorporar:

* Generar el código de un solo uso
* Enviar el código al usuario
* Validar el código

Para habilitar preferencias de notificaciones, habría que implementar:

* Registrar un identificador por cada posible medio de notificación
* Dar soporte a un medio de notificación para enviar notificaciones

No voy a intentar implementarlo aquí porque creo que se aprecia fácilmente cuál es la dificultad de hacerlo: `UserAccount` seguirá creciendo en cantidad de código y métodos, haciéndose más difícil de mantener a cada paso.

### Resolviendo el _smell_

Para resolver el _smell_, debemos separar las funcionalidades de `UserAccount` en distintas clases que atiendan a las necesidades de distintos consumidores.

Examinando la clase, podemos identificar las distintas responsabilidades que tiene:

```typescript
class UserAccount {
  private name: string
  private email: string
  private password: string
  private lastLogin: Date
  private loginAttempts: number = 0
  private notifications: string[] = []
  private isAdmin: boolean

  constructor(name: string, email: string, password: string, isAdmin: boolean = false) {
    this.name = name
    this.email = email
    this.password = password
    this.lastLogin = new Date()
    this.isAdmin = isAdmin
  }

  // --- Autenticación ---
  login(password: string): boolean {
    if (this.password === password) {
      this.lastLogin = new Date()
      this.loginAttempts = 0
      console.log('Inicio de sesión exitoso')
      return true
    } else {
      this.loginAttempts++
      console.log('Contraseña incorrecta')
      return false
    }
  }

  resetPassword(newPassword: string): void {
    this.password = newPassword
    console.log('Contraseña actualizada')
  }

  // --- Perfil ---
  updateEmail(newEmail: string): void {
    this.email = newEmail
    console.log('Correo actualizado')
  }

  updateName(newName: string): void {
    this.name = newName
    console.log('Nombre actualizado')
  }

  // --- Notificaciones ---
  addNotification(message: string): void {
    this.notifications.push(message)
  }

  getNotifications(): string[] {
    return this.notifications
  }

  clearNotifications(): void {
    this.notifications = []
  }

  // --- Administración ---
  promoteToAdmin(): void {
    this.isAdmin = true
  }

  revokeAdmin(): void {
    this.isAdmin = false
  }
}
```

Es decir, tenemos:

* Autenticación
* Gestión del perfil
* Notificaciones
* Administración de permisos

Como se puede ver, los cambios que se nos piden afectan cada uno a un área distinta:

* Doble factor: autenticación
* Preferencias de notificaciones: notificaciones

El refactor adecuado para resolver el smell es _Extraer clase_, es decir, crear una nueva clase por cada grupo de funcionalidad. Esto no implica la desaparición de `UserAccount`, que proporciona un punto de entrada para los consumidores. 

Por otro lado, también puede ser interesante usar _Extraer Interface_, ya que, en un momento dado, podríamos querer exponer interfaces estrechas orientadas a las necesidades de los consumidores, aplicando el principio de _Segregación de Interfaces_, de modo que en algún momento se pudiesen cambiar las implementaciones sin afectar a los consumidores.

#### Autenticación

Este test describe el comportamiento actual de la clase `UserAccount` en la responsabilidad de autenticación.

```typescript
describe('Authentication', () => {
    describe('When user tries to authenticate', () => {
        const user = new UserAccount(
            'John Doe', 
            'john@example.com', 
            'secret', 
            false
        )

        it('should authenticate with the correct password', () => {
            expect(user.login('secret')).toEqual(true)
        })

        it('should not authenticate with the wrong password', () => {
            expect(user.login('another')).toEqual(false)
        })
    })

    describe('Reset password', () => {
        describe('When the user resets the password', () => {
            const user = new UserAccount(
                'John Doe', 
                'john@example.com', 
                'secret', 
                false
            )
            user.resetPassword('new-secret')
            it('should not authenticate with the old one', () => {
                expect(user.login('secret')).toEqual(false)
            })

            it('should authenticate with the new one', () => {
                expect(user.login('new-secret')).toEqual(true)
            })
        })
    })
})
```

Por supuesto, mirando el código de `UserAccount` podríamos identificar varias cuestiones. Aunque se lleva cuenta de los intentos de login, no se están usando en el comportamiento examinado. Por ejemplo, más de tres intentos podrían provocar que el usuario se bloquee y se vea obligado a resetear la contraseña. No vamos a abordar eso en este ejercicio, al menos por el momento.

Lo que sí podemos ver es que la funcionalidad de autenticación se describe mediante dos métodos: `login` y `resetPassword`. Esto nos lleva a la posibilidad de aplicar _Extraer Interface_:

```typescript
interface ManagesAuthentication {
    login(password: string): boolean;

    resetPassword(newPassword: string): void;
}
```

De modo que `UserAccount` se convierte en una clase capaz de ejercer el rol `ManagesAuthentication`. Esto último no es estrictamente necesario. Dependiendo del contexto, nos puede interesar hacer desaparecer `UserAccount` y reemplazarlo por una clase que implemente esta y las demás interfaces que vamos a extraer.

```typescript
export class UserAccount implements ManagesAuthentication {
    // Code removed for clarity
}
```

Una consecuencia de haber introducido esta interfaz es que el test anterior se puede aplicar a cualquier clase que la implemente. Y una clase que podría hacerlo es una que extraigamos de `UserAccount`. Por ejemplo, `AuthenticateUser`. Básicamente, no tenemos más que copiar los métodos y propiedades necesarios de `UserAccount` en `AuthenticateUser`.

```typescript
export class AuthenticateUser implements ManagesAuthentication {
    private password: string
    private lastLogin: Date | undefined
    private loginAttempts: number = 0

    constructor(password: string) {
        this.password = password;
    }

    login(password: string): boolean {
        if (this.password === password) {
            this.lastLogin = new Date()
            this.loginAttempts = 0
            console.log('Inicio de sesión exitoso')
            return true
        } else {
            this.loginAttempts++
            console.log('Contraseña incorrecta')
            return false
        }
    }

    resetPassword(newPassword: string): void {
        this.password = newPassword
        console.log('Contraseña actualizada')
    }
}
```

Si usamos esta clase en lugar de `UserAccount`, cambiando lo que corresponda, el test sigue pasando:

```typescript
describe('ManagesAuthentication', () => {
    describe('When the user tries to authenticate', () => {
        const user = new AuthenticateUser('secret')

        it('should authenticate with the correct password', () => {
            expect(user.login('secret')).toEqual(true)
        })

        it('should not authenticate with the wrong password', () => {
            expect(user.login('another')).toEqual(false)
        })
    })

    describe('Reset password', () => {
        describe('When the user resets the password', () => {
            const user = new AuthenticateUser('secret')
            user.resetPassword('new-secret')
            it('should not authenticate with the old one', () => {
                expect(user.login('secret')).toEqual(false)
            })

            it('should authenticate with the new one', () => {
                expect(user.login('new-secret')).toEqual(true)
            })
        })
    })
})
```

Nuestro siguiente paso es usar esta clase en `UserAccount`, que delega en ella todo lo que tenga que ver con autenticación. De paso, nos libramos de todas las propiedades que correspondan a esta responsabilidad.

```typescript
export class UserAccount implements ManagesAuthentication {
    private name: string
    private email: string
    private notifications: string[] = []
    private isAdmin: boolean
    private authenticator: ManagesAuthentication

    constructor(name: string, email: string, password: string, isAdmin: boolean = false) {
        this.name = name
        this.email = email
        this.isAdmin = isAdmin
        this.authenticator = new AuthenticateUser(password)
    }

    // --- Autenticación ---
    login(password: string): boolean {
        return this.authenticator.login(password)
    }

    resetPassword(newPassword: string): void {
        this.authenticator.resetPassword(newPassword)
    }

    // Code removed for clarity
}
```

Lo interesante aquí es que, aunque `UserAccount` sigue siendo la clase con la que habla el resto de la aplicación, delega todo ese conocimiento de autenticación. Si hay que aplicar cambios en esa responsabilidad, solo tendremos que hacerlo en `AuthenticateUser`, que es la fuente de verdad.

No tenemos más que hacer lo mismo con el resto de las funcionalidades de `UserAccount`.

#### Perfil de usuario

Siguiendo el mismo procedimiento, podemos extraer una interfaz para gestionar el perfil de usuario:

```typescript
interface ManagesProfile {
    updateEmail(newEmail: string): void
    updateName(newName: string): void
}
```

La aplicamos a `UserAccount`:

```typescript
export class UserAccount implements ManagesAuthentication, ManagesProfile {
    // Code removed for clarity
}
```

También escribimos un test para caracterizar el comportamiento de la clase en lo que respecta al perfil. Para ello, introduzco un método `profile`, que me permita ver el perfil del usuario y lo añado a la interfaz:

```typescript
profile(): string {
    return `${this.name} <${this.email}>`
}
```

```typescript
interface ManagesProfile {
    updateEmail(newEmail: string): void
    updateName(newName: string): void
    profile(): string
}
```

```typescript
describe('Manages Profile', () => {
    describe('When the user wants to update their profile', () => {
        const user = new UserAccount('John Doe', 'john@example.com', 'secret', false)

        it('should be able to change the name', () => {
            user.updateName('Mark Bezos')
            expect(user.profile()).toEqual('Mark Bezos <john@example.com>')
        })

        it('should be able to change the email', () => {
            user.updateEmail('mark@example.com')
            expect(user.profile()).toEqual('Mark Bezos <mark@example.com>')
        })
    })
})
```

Con esto, ya tenemos los elementos necesarios para extraer la clase `UserProfile`.

```typescript
export class UserProfile implements ManagesProfile {
    private name: string
    private email: string

    constructor(name: string, email: string) {
        this.name = name
        this.email = email
    }

    updateEmail(newEmail: string): void {
        this.email = newEmail
        console.log('Correo actualizado')
    }

    updateName(newName: string): void {
        this.name = newName
        console.log('Nombre actualizado')
    }

    profile(): string {
        return `${this.name} <${this.email}>`
    }
}
```

Y no nos queda más que hacer que `UserAccount` delegue en `UserProfile`:

```typescript
export class UserAccount implements ManagesAuthentication, ManagesProfile {
    private notifications: string[] = []
    private isAdmin: boolean
    private authenticator: ManagesAuthentication
    private userProfile: ManagesProfile

    constructor(name: string, email: string, password: string, isAdmin: boolean = false) {
        this.isAdmin = isAdmin
        this.authenticator = new AuthenticateUser(password)
        this.userProfile = new UserProfile(name, email)
    }
    
    updateEmail(newEmail: string): void {
        this.userProfile.updateEmail(newEmail)
    }

    updateName(newName: string): void {
        this.userProfile.updateName(newName)
    }

    profile(): string {
        return this.userProfile.profile()
    }
    
    // Code removed for clarity
}
```

#### Notificaciones

El procedimiento es exactamente el mismo que hemos hecho para las otras dos responsabilidades. Empezamos por extraer una interfaz:

```typescript
interface ManagesNotifications {
    addNotification(message: string): void
    getNotifications(): string[]
    clearNotifications(): void
}
```

Y la aplicamos a `UserAccount`:

```typescript
export class UserAccount implements ManagesAuthentication, ManagesProfile, ManagesNotifications {
    // Code removed for clarity
}
```

Escribimos un test para caracterizar el comportamiento de la clase en lo que respecta a las notificaciones:

```typescript
describe('Manages notifications', () => {
    describe('When a notification is sent to the user', () => {
        const user = new UserAccount('John Doe', 'john@example.com', 'secret', false)

        it('should be registered', () => {
            user.addNotification('This is a notification')
            const expected = ['This is a notification']
            expect(user.getNotifications()).toEqual(expected)
        });

        it('should disappear on clear', () => {
            user.clearNotifications()
            expect(user.getNotifications()).toEqual([])
        });
    })
})
```

Y podemos extraer la clase `UserNotifications`, copiando los métodos y propiedades necesarios:

```typescript
export class UserNotifications implements ManagesNotifications {
  private notifications: string[]

  constructor() {
    this.notifications = []
  }

  addNotification(message: string): void {
    this.notifications.push(message)
  }

  getNotifications(): string[] {
    return this.notifications
  }

  clearNotifications(): void {
    this.notifications = []
  }
}
```

Para, finalmente, delegar en esta última:

```typescript
export class UserAccount implements ManagesAuthentication, ManagesProfile, ManagesNotifications {
    private isAdmin: boolean
    private authenticator: ManagesAuthentication
    private userProfile: ManagesProfile
    private userNotifications: ManagesNotifications

    constructor(name: string, email: string, password: string, isAdmin: boolean = false) {
        this.isAdmin = isAdmin
        this.authenticator = new AuthenticateUser(password)
        this.userProfile = new UserProfile(name, email)
        this.userNotifications = new UserNotifications()
    }

    // code removed for clarity
    addNotification(message: string): void {
        this.userNotifications.addNotification(message)
    }

    getNotifications(): string[] {
        return this.userNotifications.getNotifications()
    }

    clearNotifications(): void {
        this.userNotifications.clearNotifications()
    }

    // Code removed for clarity
}
```

Como se puede apreciar, `UserAccount` se va haciendo cada vez más pequeña. Aunque mantiene sus responsabilidades, sus métodos se limitan a delegar en las clases que las implementan.

#### Roles y permisos

Seguimos el mismo procedimiento para extraer la clase `UserRoles`.

```typescript
interface ManagesRoles {
    promoteToAdmin(): void
    revokeAdmin(): void
    canDoAnything(): boolean
}
```

```typescript
export class UserAccount implements ManagesAuthentication, ManagesProfile, ManagesNotifications, ManagesRoles {
    // Code removed for clarity
}
```

```typescript
describe('Manages roles', () => {
    describe('When a user is a common user', () => {
        const user = new UserAccount('John Doe', 'john@example.com', 'secret', false)

        it('should be able to be promoted', () => {
            user.promoteToAdmin()
            expect(user.canDoAnything()).toEqual(true)
        })

        it('should be able to be revoked', () => {
            user.revokeAdmin()
            expect(user.canDoAnything()).toEqual(false)
        });

    })
})
```

```typescript
export class UserRoles implements ManagesRoles {
    private isAdmin: boolean

    constructor(isAdmin: boolean) {
        this.isAdmin = isAdmin
    }

    promoteToAdmin(): void {
        this.isAdmin = true
        console.log('Usuario promovido a administrador')
    }

    revokeAdmin(): void {
        this.isAdmin = false
        console.log('Usuario revocado de administrador')
    }

    canDoAnything(): boolean {
        return this.isAdmin;
    }
}
```
Una vez aplicados todos los cambios, así es como queda `UserAccount`. Podemos ver que, aunque sigue ejerciendo todas las responsabilidades, en realidad simplemente agrega varios colaboradores especializados que las ejecutan. De este modo, mantenemos el punto de entrada que usaban los consumidores de `UserAccount`. Dependiendo de nuestro caso, podemos empezar incluso a sustituir `UserAccount` por `AuthenticateUser`, `UserProfile`, `UserNotifications` o `UserRoles`, cambiando lo necesario para depender de las interfaces.

```typescript
export class UserAccount implements ManagesAuthentication, ManagesProfile, ManagesNotifications, ManagesRoles {
  private authenticator: ManagesAuthentication
  private userProfile: ManagesProfile
  private userNotifications: ManagesNotifications
  private userRoles: ManagesRoles

  constructor(name: string, email: string, password: string, isAdmin: boolean = false) {
    this.authenticator = new AuthenticateUser(password)
    this.userProfile = new UserProfile(name, email)
    this.userNotifications = new UserNotifications()
    this.userRoles = new UserRoles(isAdmin)
  }

  // --- Autenticación ---
  login(password: string): boolean {
    return this.authenticator.login(password)
  }

  resetPassword(newPassword: string): void {
    this.authenticator.resetPassword(newPassword)
  }

  // --- Perfil ---
  updateEmail(newEmail: string): void {
    this.userProfile.updateEmail(newEmail)
  }

  updateName(newName: string): void {
    this.userProfile.updateName(newName)
  }

  profile(): string {
    return this.userProfile.profile()
  }
  // --- Notificaciones ---

  addNotification(message: string): void {
    this.userNotifications.addNotification(message)
  }

  getNotifications(): string[] {
    return this.userNotifications.getNotifications()
  }

  clearNotifications(): void {
    this.userNotifications.clearNotifications()
  }

  // --- Administración ---

  promoteToAdmin(): void {
    this.userRoles.promoteToAdmin()
  }

  revokeAdmin(): void {
    this.userRoles.revokeAdmin()
  }

  canDoAnything(): boolean {
    return this.userRoles.canDoAnything()
  }
}
```

### Resolviendo el ejercicio

Con todo el proceso anterior hemos eliminado, o al menos puesto bajo control, el code smell _Large Class_ que padecía `UserAccount`. Ahora sería el momento de modificar el comportamiento para introducir las nuevas prestaciones. La ventaja que tenemos ahora es que las responsabilidades están separadas y podemos intervenir en ellas de forma independiente.

#### Autenticación de doble factor

La autenticación de doble factor funciona más o menos de la siguiente manera:

* El usuario hace login, este login no es definitivo y tiene que confirmarse
* Se genera un código de un solo uso que se notifica al usuario
* El usuario envia de vuelta a este código confirmando el login

La idea es que la aplicación genera un código de un solo uso que solo el usuario real podría conocer porque se lo comunicamos por un medio que asumimos está bajo su control: ya sea con un mensaje directo o a través de una aplicación específica.

Sin entrar en muchos detalles, ya que no es el propósito del ejercicio, tenemos que tener en cuenta que si queremos introducir el segundo factor, el login no se produce cuando se detecta que la contraseña aportada coincide con la esperada, sino que se precisa una confirmación. 

Nos convendría arreglar algunas cosas en `AuthenticateUser` antes de empezar. El código está un poco sucio y, a decir verdad, el método login no debería devolver nada. En su lugar, necesitamos un método que nos permita saber si el usuario está autenticado o no.

```typescript
interface ManagesAuthentication {
    login(password: string): boolean;
    resetPassword(newPassword: string): void;
    isLoggedIn(): boolean;
}
```

Para ello, deben cambiarse los tests.

```typescript
describe('Manages Authentication', () => {
    describe('When the user tries to authenticate', () => {
        const user = new UserAccount('John Doe', 'john@example.com', 'secret', false)

        it('should authenticate with the correct password', () => {
            user.login('secret')
            expect(user.isLoggedIn()).toEqual(true)
        })

        it('should not authenticate with the wrong password', () => {
            user.login('wrong')
            expect(user.isLoggedIn()).toEqual(false)
        })
    })

    describe('Reset password', () => {
        describe('When the user resets the password', () => {
            const user = new UserAccount('John Doe', 'john@example.com', 'secret', false)
            user.resetPassword('new-secret')
            it('should not authenticate with the old one', () => {
                user.login('secret')
                expect(user.isLoggedIn()).toEqual(false)
            })

            it('should authenticate with the new one', () => {
                user.login('new-secret')
                expect(user.isLoggedIn()).toEqual(true)
            })
        })
    })
})
```

Y este es el código arreglado:

```typescript
export class AuthenticateUser implements ManagesAuthentication {
    private password: string
    private lastLogin: Date | undefined
    private loginAttempts: number = 0

    constructor(password: string) {
        this.password = password;
    }

    login(password: string): void {
        if (this.password === password) {
            this.successfullyLoggedIn();
        } else {
            this.failedLogin();
        }
    }

    isLoggedIn(): boolean {
        return this.lastLogin !== undefined
    }

    resetPassword(newPassword: string): void {
        this.password = newPassword
        console.log('Contraseña actualizada')
    }

    private successfullyLoggedIn() {
        this.lastLogin = new Date()
        this.loginAttempts = 0
        console.log('Inicio de sesión exitoso')
    }

    private failedLogin() {
        this.lastLogin = undefined
        this.loginAttempts++
        console.log('Contraseña incorrecta')
    }
}
```

Veamos ahora como introducir el segundo factor en la autenticación. Los cambios que tenemos que implementar son los siguientes:

* Si la contraseña es correcta, se debe generar una contraseña de un solo uso (OTP) y comunicarla al usuario. Para esto necesitaremos una forma de generar la OTP y de notificarla al usuario. Esto no requiere cambios de interface.
* Necesitamos un método para validar esta contraseña de un solo uso e invocaremos el método `successfullyLoggedIn` en caso de que sea correcta. Esto requiere introducir un nuevo método en la interface.

```typescript
interface ManagesAuthentication {
    login(password: string): void
    otpLogin(otp: string): void
    resetPassword(newPassword: string): void
    isLoggedIn(): boolean
}
```

Esta parte me molesta un poco porque genera un caso de _Refused Bequest_, ya que en la modalidad de autenticación simple no necesitamos este nuevo método.

```typescript
export class AuthenticateUser implements ManagesAuthentication {
    private password: string
    private lastLogin: Date | undefined
    private loginAttempts: number = 0

    constructor(password: string) {
        this.password = password;
    }

    login(password: string): void {
        if (this.password === password) {
            this.successfullyLoggedIn();
        } else {
            this.failedLogin();
        }
    }

    otpLogin(_otp: string): void {
        return
    }

    isLoggedIn(): boolean {
        return this.lastLogin !== undefined
    }

    resetPassword(newPassword: string): void {
        this.password = newPassword
        console.log('Contraseña actualizada')
    }

    private successfullyLoggedIn() {
        this.lastLogin = new Date()
        this.loginAttempts = 0
        console.log('Inicio de sesión exitoso')
    }

    private failedLogin() {
        this.lastLogin = undefined
        this.loginAttempts++
        console.log('Contraseña incorrecta')
    }
}
```

En principio, creo que lo mejor sería introducir una nueva implementación de la interfaz `ManagesAuthentication`. Introduzcamos un test específico de `ManagesAuthentication` de modo que `AuthenticateUser` pueda pasarlo. Como invocar otpLogin no tiene efectos en esta implementación el test pasará.

```typescript
describe('Manages Authentication with 2nd Factor', () => {
    describe('When the user tries to authenticate', () => {
        const user = new AuthenticateUser('secret')

        it('should authenticate with the correct password', () => {
            user.login('secret')
            user.otpLogin('123456')
            expect(user.isLoggedIn()).toEqual(true)
        })

        it('should not authenticate with the wrong password', () => {
            user.login('wrong')
            expect(user.isLoggedIn()).toEqual(false)
        })
    })
})
```

Hagamos algo similar con una implementación alternativa, que sí verifica el segundo factor.

```typescript
describe('Manages Authentication with 2nd Factor', () => {
    describe('When the user tries to authenticate', () => {
        const user = new AuthenticateUserWithTwoFactor('secret')

        it('should authenticate with the correct password', () => {
            user.login('secret')
            user.otpLogin('123456')
            expect(user.isLoggedIn()).toEqual(true)
        })

        it('should not authenticate with the wrong password', () => {
            user.login('wrong')
            expect(user.isLoggedIn()).toEqual(false)
        })

        it('should not authenticate with the wrong otp', () => {
            user.login('secret')
            user.otpLogin('wrong')
            expect(user.isLoggedIn()).toEqual(false)
        })
    })
})

```

En principio, tendrá la misma funcionalidad que `AuthenticateUser`, pero con una interfaz diferente.

```typescript
export class AuthenticateUserWithTwoFactor implements ManagesAuthentication {
    private password: string
    private lastLogin: Date | undefined
    private loginAttempts: number = 0

    constructor(password: string) {
        this.password = password;
    }

    login(password: string): void {
        if (this.password === password) {
            this.successfullyLoggedIn();
        } else {
            this.failedLogin();
        }
    }

    otpLogin(_otp: string): void {
        return
    }

    isLoggedIn(): boolean {
        return this.lastLogin !== undefined
    }

    resetPassword(newPassword: string): void {
        this.password = newPassword
        console.log('Contraseña actualizada')
    }

    private successfullyLoggedIn() {
        this.lastLogin = new Date()
        this.loginAttempts = 0
        console.log('Inicio de sesión exitoso')
    }

    private failedLogin() {
        this.lastLogin = undefined
        this.loginAttempts++
        console.log('Contraseña incorrecta')
    }
}
```

Hagamos pasar el test:

```typescript
export class AuthenticateUserWithTwoFactor implements ManagesAuthentication {
    private password: string
    private otp: string
    private lastLogin: Date | undefined
    private loginAttempts: number = 0

    constructor(password: string, otp: string) {
        this.password = password;
        this.otp = otp
    }

    login(password: string): void {
        if (this.password === password) {
            this.successfullyLoggedIn();
        } else {
            this.failedLogin();
        }
    }

    otpLogin(otp: string): void {
        if (this.otp === otp) {
            this.successfullyLoggedIn();
        } else {
            this.failedLogin();
        }
    }

    isLoggedIn(): boolean {
        return this.lastLogin !== undefined
    }

    resetPassword(newPassword: string): void {
        this.password = newPassword
        console.log('Contraseña actualizada')
    }

    private successfullyLoggedIn() {
        this.lastLogin = new Date()
        this.loginAttempts = 0
        console.log('Inicio de sesión exitoso')
    }

    private failedLogin() {
        this.lastLogin = undefined
        this.loginAttempts++
        console.log('Contraseña incorrecta')
    }
}
```

Esto hace pasar el test. Está claro que `AuthenticateUserWithTwoFactor` debería recibir la OTP de algún sitio. En primer lugar, esta contraseña se genera y se comunica si el usuario se ha identificado correctamente. Por otro lado, la OTP proporcionada por el usuario se recibirá en otro momento.

Una posibilidad es introducir un servicio que se encargue de generar la OTP, notificarla y guardarla hasta que el usuario la confirme.

```typescript
interface ManagesOTP {
    generate(user: string): string
    verify(user: string, otp: string): boolean
}
```

Esto me lleva a pensar que a lo mejor necesito otra forma de modelar las credenciales del usuario, ya que voy a necesitar conocer su email para obtener la OTP.

```typescript
class UserCredentials {
    private email: string
    private password: string
}
```

Así que hay que hacer algunos cambios en `UserAccount`:

```typescript
export class UserAccount
    implements ManagesAuthentication, ManagesProfile, ManagesNotifications, ManagesRoles {
    private userCredentials: UserCredentials
    private authenticator: ManagesAuthentication
    private userProfile: ManagesProfile
    private userNotifications: ManagesNotifications
    private userRoles: ManagesRoles

    constructor(name: string, email: string, password: string, isAdmin: boolean = false) {
        this.userCredentials = new UserCredentials(email, password)
        this.authenticator = new AuthenticateUser(this.userCredentials)
        this.userProfile = new UserProfile(name, email)
        this.userNotifications = new UserNotifications()
        this.userRoles = new UserRoles(isAdmin)
    }
    
    // Code removed for clarity
}
```

Y en `AuthenticateUser`

```typescript
export class AuthenticateUser implements ManagesAuthentication {
  private credentials: UserCredentials
  private lastLogin: Date | undefined
  private loginAttempts: number = 0

  constructor(credentials: UserCredentials) {
    this.credentials = credentials
  }

  login(password: string): void {
    if (this.credentials.passwordMatch(password)) {
      this.successfullyLoggedIn()
    } else {
      this.failedLogin()
    }
  }

  otpLogin(_otp: string): void {
    return
  }

  isLoggedIn(): boolean {
    return this.lastLogin !== undefined
  }

  resetPassword(newPassword: string): void {
    this.credentials = this.credentials.reset(newPassword)
    console.log('Contraseña actualizada')
  }

  private successfullyLoggedIn() {
    this.lastLogin = new Date()
    this.loginAttempts = 0
    console.log('Inicio de sesión exitoso')
  }

  private failedLogin() {
    this.lastLogin = undefined
    this.loginAttempts++
    console.log('Contraseña incorrecta')
  }
}
```

Esto va llevando comportamientos a `UserCredentials`:


```typescript
export class UserCredentials {
    private readonly email: string
    private readonly password: string

    constructor(email: string, password: string) {
        this.email = email
        this.password = password
    }

    passwordMatch(password: string): boolean {
        return this.password === password
    }

    reset(password: string): UserCredentials {
        return new UserCredentials(this.email, password)
    }
}
```

Nos hemos desviado un poco, pero ahora tenemos una forma de que el componente encargado de la autenticación pueda tener información sobre el usuario.

He aquí un test para dirigir el desarrollo de `AuthenticateUserWithTwoFactor`

```typescript
class OTPProviderStub implements ManagesOTP {
    private readonly otp: string
    private readonly otps = new Map<string, string>()

    constructor(otp: string) {
        this.otp = otp;
        this.otps = new Map<string, string>();
    }

    generate(user: string): void {
        this.otps.set(user, this.otp);
        console.log(`OTP: ${this.otp} generada para el usuario ${user}`);
    }

    verify(user: string, providedOtp: string): boolean {
        return this.otps.get(user) === providedOtp;
    }
}


describe('Manages Authentication with 2nd Factor', () => {
    describe('When the user tries to authenticate', () => {
        const credentials = new UserCredentials('me@example.com', 'secret')
        const otpProvider = new OTPProviderStub('123456')
        const user = new AuthenticateUserWithTwoFactor(credentials, otpProvider)

        it('should authenticate with the correct password', () => {
            user.login('secret')
            user.otpLogin('123456')
            expect(user.isLoggedIn()).toEqual(true)
        })

        it('should not authenticate with the wrong password', () => {
            user.login('wrong')
            expect(user.isLoggedIn()).toEqual(false)
        })

        it('should not authenticate with the wrong otp', () => {
            user.login('secret')
            user.otpLogin('wrong')
            expect(user.isLoggedIn()).toEqual(false)
        })
    })
})
```


Así que, después de darle unas vueltas, llego a esto con `AuthenticatorUserWithTwoFactor`:

```typescript
export class AuthenticateUserWithTwoFactor implements ManagesAuthentication {
    private credentials: UserCredentials
    private otpManager: ManagesOTP
    private lastLogin: Date | undefined
    private loginAttempts: number = 0

    constructor(credentials: UserCredentials, otpManager: ManagesOTP) {
        this.credentials = credentials
        this.otpManager = otpManager
    }

    login(password: string): void {
        if (this.credentials.passwordMatch(password)) {
            this.credentials.generateOTP(this.otpManager)
        } else {
            this.failedLogin()
        }
    }

    otpLogin(otp: string): void {
        if (this.credentials.verifyOTP(this.otpManager, otp)) {
            this.successfullyLoggedIn()
        } else {
            this.failedLogin()
        }
    }

    isLoggedIn(): boolean {
        return this.lastLogin !== undefined
    }

    resetPassword(newPassword: string): void {
        this.credentials = this.credentials.reset(newPassword)
        console.log('Contraseña actualizada')
    }

    private successfullyLoggedIn() {
        this.lastLogin = new Date()
        this.loginAttempts = 0
        console.log('Inicio de sesión exitoso')
    }

    private failedLogin() {
        this.lastLogin = undefined
        this.loginAttempts++
        console.log('Contraseña incorrecta')
    }
}
```

`UserCredentials` sigue atrayendo comportamiento mientras que mantiene la encapsulación gracias al _Double Dispatch_:

```typescript
export class UserCredentials {
    private readonly email: string
    private readonly password: string

    constructor(email: string, password: string) {
        this.email = email
        this.password = password
    }

    passwordMatch(password: string): boolean {
        return this.password === password
    }

    reset(password: string): UserCredentials {
        return new UserCredentials(this.email, password)
    }

    generateOTP(otp: ManagesOTP): void {
        otp.generate(this.email)
    }

    verifyOTP(otp: ManagesOTP, providedOtp: string):boolean {
        return otp.verify(this.email, providedOtp)
    }
}
```

Se pueden apreciar muchas cosas en el código que vamos generando. Por ejemplo, que resetear la contraseña ya no parece una responsabilidad de `ManagesAuthentication`, sino de `UserCredentials`. Sin embargo, tal como lo tenemos implementado nos puede generar problemas pues `UserCredentials` es inmutable y los autenticadores reciben una instancia específica que tendríamos que actualizar.

A su vez, las clases que implementan `ManagesAuthentication` tienen código muy similar y posiblemente podríamos abstraer la funcionalidad común en una clase abstracta y aplicar un patrón `template`. De este modo, aseguramos un comportamiento más consistente y eliminamos duplicación innecesaria.


```typescript
export abstract class BaseManagesAuthentication implements ManagesAuthentication {
    protected lastLogin: Date | undefined
    protected loginAttempts: number = 0
    protected credentials: UserCredentials

    protected constructor(credentials: UserCredentials) {
        this.credentials = credentials;
    }

    isLoggedIn(): boolean {
        return this.lastLogin !== undefined;
    }

    login(password: string): void {
        if (this.credentials.passwordMatch(password)) {
            this.succeedLogin()
        } else {
            this.failedLogin()
        }
    }

    abstract succeedLogin(): void

    abstract otpLogin(otp: string): void

    resetPassword(newPassword: string): void {
        this.credentials = this.credentials.reset(newPassword)
        console.log('Contraseña actualizada')
    }

    protected successfullyLoggedIn() {
        this.lastLogin = new Date()
        this.loginAttempts = 0
        console.log('Inicio de sesión exitoso')
    }

    protected failedLogin() {
        this.lastLogin = undefined
        this.loginAttempts++
        console.log('Contraseña incorrecta')
    }

}

export class AuthenticateUser extends BaseManagesAuthentication {
    constructor(credentials: UserCredentials) {
        super(credentials);
    }

    succeedLogin() {
        this.successfullyLoggedIn()
    }

    otpLogin(_otp: string): void {
        // no op
    }
}

export class AuthenticateUserWithTwoFactor extends BaseManagesAuthentication {
    private readonly otpManager: ManagesOTP

    constructor(credentials: UserCredentials, otpManager: ManagesOTP) {
        super(credentials)
        this.otpManager = otpManager
    }

    succeedLogin(): void {
        this.credentials.generateOTP(this.otpManager)
    }

    otpLogin(otp: string): void {
        if (this.credentials.verifyOTP(this.otpManager, otp)) {
            this.successfullyLoggedIn()
        } else {
            this.failedLogin()
        }
    }
}
```

En fin, podríamos seguir refinando este código pero el artículo se está haciendo más largo de lo pensando.

## Conclusiones

El _code smell Large Class_ suele venir de una falta de reflexión que nos lleva a añadir código en clases existentes en lugar de introducir otras nuevas. La consecuencia es que la clase acumula responsabilidades que responden a necesidades y stakeholders diferentes.

Esto hace que sea fácil introducir errores cruzados, mientras que el mantenimiento general se complica.

La solución del smell pasa por identificar esas responsabilidades y separarlas en clases independientes, que puedan atender a las necesidades de cada stakeholder sin interferir entre ellas.