---
layout: post
title: Dobles de test en Golang usando Context
categories: articles
tags: golang testing
---

Llevo tiempo buscando como mejorar los tests que hago en Golang y estos días he descubierto algunas ideas que parecen ir por ese camino.

En esta ocasión me voy a centrar en dobles de test y en usar el contexto, cuando tiene sentido, para hacer stubs con los valores que me interesan.

## El contexto

En Golang el contexto es un objeto que nos permite pasar información en una cadena de llamadas. Un uso típico sería el recoger información cuando se recibe una _request HTTP_, que se guardaría en el objeto `context` y así estará disponible en cualquier momento. Aparte de transportar valores, `context` puede decirnos si la _request_ ha sido abandonada y otras funcionalidades. De hecho, una de las razones para usar el contexto es poder introducir cuestiones de logging y observabilidad.

Esa información, en general, sería información, por así decir, técnica, que no tiene que ver con el dominio. Así podemos pasar detalles de la request que podrían ser necesarios en algún momento del procesamiento, por ejemplo, para relacionar una operación con la request que la puso en marcha y anotar esa información en un log.

En esencia, el context es un cajón de sastre que actúa como un almacenamiento clave-valor. Puedes aprender más sobre el tema del contexto y cómo usarlo en [este artículo de Friends of Go](https://blog.friendsofgo.tech/posts/context-en-golang/).

El `context` no debe usarse para pasar parámetros a una función, sobre todo porque es inseguro en cuanto a tipos, ya que se trata de una estructura `map[interface{}]interface{}`. En muchos sentidos, es como una variable global.

Sin embargo, me he dado cuenta de que en una situación de test puede ser una forma muy limpia de programar _stubs_, ya que su uso está bien acotado y no presenta ningún tipo de riesgo. Incluso tiene sentido semántico.

## Dobles de test

Con frecuencia, sobre todo por conveniencia, usamos librerías para generar test dobles. Dependiendo del lenguaje son más o menos agradecidas. En Golang son bastante populares `mock`, del paquete `testify` o `mockery`, que se basa en ella.

Pero en realidad no necesitamos usar una librería, podemos crear nuestros dobles simplemente implementando las interfaces que necesitemos. ¿Es un poco más de trabajo? Sí. ¿Tiene beneficios? Bastantes.

Uno de los principales beneficios es que nos permite usar dobles de test sin acoplar el test a la implementación de la unidad bajo test. Esto es debido a que son implementaciones de una misma interfaz y se pasan a la función o a la unidad bajo test en lugar de las implementaciones de producción.

Para poder hacer esto, la unidad bajo test debe depender de una interfaz. Si la unidad bajo test no cumple esta condición es fácil introducirla. En Golang las interfaces se satisfacen de manera implícita, por lo que una vez que defines una, cualquier objeto que la cumpla puede ser usado como implementación de la misma. Y esto incluye librerías de terceras partes, cuyo código no controlamos. Gracias a eso, es relativamente fácil aligerar dependencias en Golang.

Una alternativa es embeber interfaces, una [técnica que he descubierto en este artículo](https://www.myhatchpad.com/insight/mocking-techniques-for-go/). En este caso, lo que se hace es crear una struct en la que se embebe el objeto del que necesitamos hacer un doble. Esto nos proporciona acceso a toda su interfaz pública. No tenemos más que sobreescribir el método que necesitamos doblar.

## Importante: No introduzcas el contexto solo por los tests

Debería quedar claro que esta técnica se basa en el hecho de que muchas librerías de terceras partes requieren un objeto `context` y nos aprovechamos de esa circunstancia para pasar información al doble durante la ejecución del test.

Pero si el objeto que queremos doblar no requiere `context` no debemos introducirlo solo porque sea cómodo para testear. En caso de tener que hacer un doble de este objeto, usaremos otras técnicas.

## Usando el contexto

La cuestión es que en muchos casos de uso vamos a tener que pasar el contexto a los diversos componentes que usemos durante una cadena de llamadas. Y, como suele ocurrir, algunos de esos componentes tendrán que ser doblados para poder testear, ya que suelen ser adaptadores de bases de datos, clientes HTTP, etc.

Puesto que reciben un `context`, yo puedo usarlo para pasarles valores que no podría pasar usando los parámetros de su signatura. Por tanto, en la implementación del doble, no tengo más que mirar si el `context` recibido trae un valor en una clave determinada. Si es así, devuelvo ese valor. Y, si no, puedo simular un error u otro comportamiento.

De hecho, es pasar un "contexto de test" en el sentido de que tal test se ejecuta con unas condiciones dadas, como que un repositorio devolverá tal entidad, o una llamada a un servicio externo devolverá tal otra, o que se leerá tal o cual mensaje de una cola.

Vamos a verlo con un ejemplo y quedará muy claro. 

Imaginemos un sistema de pagos por suscripción en el que vamos a desarrollar el caso de uso en el que un usuario actualiza un plan. Necesitaremos modelos para Usuario, Plan, repositorios para ambas entidades y el caso de uso en sí. Reducido al mínimo, quedaría algo así:

```go
type UserId struct {
	Id string
}

type User struct {
	Id       UserId
	Username string
	PlanId   PlanId
}

func (u User) UpgradePlan(plan Plan) User {
	u.PlanId = plan.Id
	return u
}

type UserRepository interface {
	ById(ctxt context.Context, userId UserId) (User, error)
	Store(ctxt context.Context, user User) error
}

type Plan struct {
	Id   PlanId
	Name string
}

type PlanId struct {
    Id string
}

type PlanRepository interface {
    ById(ctxt context.Context, planId PlanId) (Plan, error)
}
```

El caso de uso:

```go
type UpgradePlan struct {
	User    UserId
	NewPlan PlanId
}

type UpgradePlanHandler struct {
	users UserRepository
	plans PlanRepository
}

func NewUpgradePlanHandler(
	users UserRepository,
	plans PlanRepository,
) UpgradePlanHandler {
	return UpgradePlanHandler{users: users, plans: plans}
}

func (u UpgradePlanHandler) Handle(ctxt context.Context, cmd UpgradePlan) error {
	plan, err := u.plans.ById(ctxt, cmd.NewPlan)
	if err != nil {
		return fmt.Errorf("plan not found %s", err)
	}
	user, err := u.users.ById(ctxt, cmd.User)
	if err != nil {
		return fmt.Errorf("user not found %s", err)
	}
	upgraded := user.UpgradePlan(plan)
	u.users.Store(ctxt, upgraded)
	return nil
}
```

Como se puede ver, en los métodos de los repositorios se pasa el contexto, lo que nos permite, entre otras cosas, implementar trazabilidad, etc.

La cuestión es, que si queremos testear esto necesitaremos hacer dobles de esos mismos repositorios. Los métodos `UserRepository.GetById` y `PlanRepository.GetById` serán _stubs_, mientras que `UserRepository.Store` debería permitirnos, cuando menos, espiar su comportamiento.

Implementar un stub usando el `context` es sencillo. Simplemente, tenemos que mirar si en este último viene un valor en una clave arbitraria que hayamos decidido. En caso de que se haya especificado, lo devolvemos, no sin antes hacer una _type assertion_, ya que `Value` devuelve `interface{}` (o `any`).

```go
type UserRepositoryDouble struct {
}

func (u UserRepositoryDouble) ById(ctxt context.Context, userId UserId) (User, error) {
	if ctxt.Value("stubbed-user") != nil {
		return ctxt.Value("stubbed-user").(User), nil
	}
	
	return User{}, errors.New("user not found")
}

func (u UserRepositoryDouble) Store(ctxt context.Context, user User) error {
	// Code removed for clarity
}
```

El caso de `PlanRepositoryDouble` sería lo mismo:

```go
type PlanRepositoryDouble struct{}

func (PlanRepositoryDouble) ById(ctxt context.Context, planId PlanId) (Plan, error) {
	if ctxt.Value("stubbed-plan") != nil {
		return ctxt.Value("stubbed-plan").(Plan), nil
	}

	return Plan{}, errors.New("plan not found")
}
```

En el test, no tenemos más que usarlos así, añadiendo los valores necesarios al contexto. Empecemos con un boceto del test:

```go
func TestUpgradePlan(t *testing.T) {
	users := UserRepositoryDouble{}
	plans := PlanRepositoryDouble{}
	handler := NewUpgradePlanHandler(users, plans)
	
	ctxt := context.TODO()
	command := UpgradePlan{User: UserId{"usr-12321"}, NewPlan: PlanId{"family"}}
	err := handler.Handle(ctxt, command)
	assert.NoError(t, err)
}
```

Como aquí no pasamos ningún valor en el `context` el test falla porque se recibe un error no esperado ("plan not found"). Para resolver eso, tenemos que crear unos objetos `Plan` y `User` para que nuestros dobles de los repositorios los devuelvan. Y pasarlos a través del contexto, lo cual podemos hacer así:

```go
func TestUpgradePlan(t *testing.T) {
	users := UserRepositoryDouble{}
	plans := PlanRepositoryDouble{}
	handler := NewUpgradePlanHandler(users, plans)

	user := User{
		Id:       UserId{"usr-12321"},
		Username: "talkingbit",
		PlanId:   PlanId{"basic"},
	}

	plan := Plan{
		Id:   PlanId{"family"},
		Name: "Family Plan",
	}

	ctxt := context.TODO()
	ctxt = context.WithValue(ctxt, "stubbed-plan", plan)
	ctxt = context.WithValue(ctxt, "stubbed-user", user)
	
	command := UpgradePlan{User: UserId{"usr-12321"}, NewPlan: PlanId{"family"}}
	err := handler.Handle(ctxt, command)
	assert.NoError(t, err)
}
```

Para añadir valores a un `context` usamos la función `WithValue`, la cual nos devuelve una nueva instancia del contexto a la que se le ha añadido el par clave-valor indicado.

Ahora cuando ejecutamos el test vemos que pasa, ya que los dobles devuelven los objetos indicados, con lo que la ejecución del caso de uso se puede completar.

Lo cierto es que este test no es muy bueno porque tal como está no verifica el efecto que pretendemos producir y que no es otro que cambiar el plan asignado al usuario y actualizarlo en el repositorio. Puesto que estamos usando un doble, no se persiste nada en realidad, pero podemos tratar de asegurar que el objeto que se pasa al método `UserRepository.Store` es un `User` con el `Plan` "family".

¿Podríamos usar también la misma técnica, pasando a través del contexto algún objeto que me permita hacer la verificación? Podríamos hacerlo, pero personalmente no me parece buena idea, ya que llevaríamos la aserción al doble, lo que es uno de los puntos débiles de los _mocks_.

En su lugar, prefiero usar espías. Un espía es un objeto que guarda información sobre la forma en que ha sido usado. Luego no tengo más que comprobar esa información para ver si es la que yo esperaba. 

Para este ejemplo, puedo guardar el usuario que se le ha pasado al método `Store`.

```go
type UserRepositoryDouble struct {
	LastUserStored User
}

func (u UserRepositoryDouble) ById(ctxt context.Context, userId UserId) (User, error) {
	if ctxt.Value("stubbed-user") != nil {
		return ctxt.Value("stubbed-user").(User), nil
	}

	return User{}, errors.New("user not found")
}

func (u *UserRepositoryDouble) Store(ctxt context.Context, user User) error {
	u.LastUserStored = user
	return nil
}
```

Ahora, puedo hacer aserciones sobre `UserRepositoryDouble.LastUserStored`, que se pueden ver en la última línea de este test. Fíjate que tengo que pasar `&users` a `NewUpgradePlanHandler` porque si no lo hacemos, no lo reconocerá como implementación de `UserRepository`.

```go
func TestUpgradePlan(t *testing.T) {
	users := UserRepositoryDouble{}
	plans := PlanRepositoryDouble{}
	handler := NewUpgradePlanHandler(&users, plans)

	user := User{
		Id:       UserId{"usr-12321"},
		Username: "talkingbit",
		PlanId:   PlanId{"basic"},
	}

	plan := Plan{
		Id:   PlanId{"family"},
		Name: "Family Plan",
	}

	ctxt := context.TODO()
	ctxt = context.WithValue(ctxt, "stubbed-plan", plan)
	ctxt = context.WithValue(ctxt, "stubbed-user", user)
	
	command := UpgradePlan{User: UserId{"usr-12321"}, NewPlan: PlanId{"family"}}
	
	err := handler.Handle(ctxt, command)
	
	assert.NoError(t, err)
	assert.Equal(t, "family", users.LastUserStored.PlanId.Id)
}
```

Con este último cambio, verificamos que el objeto `User` pasado al método `Store` tiene el plan correcto.

## Mejorando la legibilidad del test

Para ser un test relativamente pequeño tiene bastantes líneas de código, así que vamos a ver si lo podemos reorganizar un poco.

### Object Mothers

Soy muy fan de user el patrón _Object Mother_ en mis tests. Me aportan ejemplos prefabricados que son fáciles de entender para la finalidad del test:

```go
type UserExample struct {
	
}

func (e UserExample) WithBasicPlan() User {
	return User{
		Id:       UserId{"usr-12321"},
		Username: "talkingbit",
		PlanId:   PlanId{"basic"},
	}
}
```

```go
type PlanExample struct {
	
}

func (e PlanExample) Family() Plan {
	return Plan{
		Id:   PlanId{"family"},
		Name: "Family Plan",
	}
}
```

No hay razón para que les llames `Mother` a estos objetos. La `struct` en la que colgamos los métodos nos puede servir para guardar valores por defecto que sean comunes.

Los que importan son los nombres de los métodos que producen los ejemplos, ya que deben describir con claridad aquello que lo caracteriza.

Ya solo con esto, el test mejora mucho:

```go
func TestUpgradePlan(t *testing.T) {
	users := UserRepositoryDouble{}
	plans := PlanRepositoryDouble{}
	handler := NewUpgradePlanHandler(&users, plans)

	ctxt := context.TODO()
	ctxt = context.WithValue(ctxt, "stubbed-plan", PlanExample{}.Family())
	ctxt = context.WithValue(ctxt, "stubbed-user", UserExample{}.WithBasicPlan())
	
	command := UpgradePlan{User: UserId{"usr-12321"}, NewPlan: PlanId{"family"}}
	
	err := handler.Handle(ctxt, command)
	
	assert.NoError(t, err)
	assert.Equal(t, "family", users.LastUserStored.PlanId.Id)
}
```

En este test, realmente no haría falta mantener la coherencia entre los datos de Ids que pasamos en `UpgradePlan`, pero nunca está de más.

Una cosa que me gusta hacer con los ejemplos y el patrón Object Mother, es relacionar ejemplos por sus nombres, de modo que pueda tener _familias_ de ejemplos coherentes entre sí:

```go
type UserIdExample struct {}

func (e UserIdExample) WithBasicPlan() UserId {
	return UserId{"usr-12321"}
}
```

Y ahora:

```go
type UserExample struct {}

func (e UserExample) WithBasicPlan() User {
	return User{
		Id:       UserIdExample{}.WithBasicPlan(),
		Username: "talkingbit",
		PlanId:   PlanIdExample{}.Basic(),
	}
}
```

Ahora sabemos que `UserIdExample.WithBasicPlan` nos va a dar el ID adecuado.

```go
func TestUpgradePlan(t *testing.T) {
	users := UserRepositoryDouble{}
	plans := PlanRepositoryDouble{}
	handler := NewUpgradePlanHandler(&users, plans)

	ctxt := context.TODO()
	ctxt = context.WithValue(ctxt, "stubbed-plan", PlanExample{}.Family())
	ctxt = context.WithValue(ctxt, "stubbed-user", UserExample{}.WithBasicPlan())

	command := UpgradePlan{
		User: UserIdExample{}.WithBasicPlan(), 
		NewPlan: PlanIdExample{}.Family()}
	
	err := handler.Handle(ctxt, command)
	
	assert.NoError(t, err)
	assert.Equal(t, "family", users.LastUserStored.PlanId.Id)
}
```

Y ahora podríamos mover la creación del contexto a una función de ayuda:

```go
func TestUpgradePlan(t *testing.T) {
	users := UserRepositoryDouble{}
	plans := PlanRepositoryDouble{}
	handler := NewUpgradePlanHandler(&users, plans)

	ctxt := contextForUpgradePlan()

	command := UpgradePlan{
		User:    UserIdExample{}.WithBasicPlan(),
		NewPlan: PlanIdExample{}.Family()}

	err := handler.Handle(ctxt, command)

	assert.NoError(t, err)
	assert.Equal(t, "family", users.LastUserStored.PlanId.Id)
}

func contextForUpgradePlan() context.Context {
	ctxt := context.TODO()
	ctxt = context.WithValue(ctxt, "stubbed-plan", PlanExample{}.Family())
	return context.WithValue(ctxt, "stubbed-user", UserExample{}.WithBasicPlan())
}
```

## Conclusiones

Cuando tenemos que doblar un objeto al que le pasamos un `context` puede ser buena idea utilizar este para decirle al doble de test lo que tiene que hacer que, generalmente, será devolver un ejemplo determinado de un objeto.

Esta técnica nos evita tener que programar _mocks_, resolviendo el problema de acoplar el test a la implementación

Combinada con otras técnicas, puede ayudarnos a escribir tests bastante sencillos y claros.
