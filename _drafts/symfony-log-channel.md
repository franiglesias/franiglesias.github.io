# Crear y usar un canal de log en Symfony

De vez en cuando nos puede interesar disponer de un log específico para una parte concreta de una aplicación. Fundamentalmente lo que pretendemos es aislar esos mensajes para poder analizarlos con facilidad.

## Configuración del canal y el handler en monolog

En `config.yml`, o en el archivo de configuración de enviroment que nos interese (config_dev.yml o config_prod.yml).

```yaml
monolog:
	channels: ['my_channel', ...]
	handlers:
		my_channel:
			type:			 stream
			action_level: info
			path:         "%kernel.logs_dir%/my-channel.log"
			formatter:    monolog.formatter.logstash
			channels:     ['my_channel']
```

## Usar este canal

Cuando necesitemos usar este logger lo pasamos como dependencia. Monolog genera estos servicios automágicamente, así que realmente no hay nada más que hacer:

```
@monolog.logger.my_channel
```

Por ejemplo:

```yaml
    a.service.using.logger:
        class: Vendor\Namespace\ServiceUsingLogger
        arguments:
            - '@monolog.logger.my_channel'
```

El Type Hinting del logger se debería hacer sobre `Psr\Log\LoggerInterface`, que es el estándar PSR. Monolog, el logger incluido con Symfony, la implementa.

Ahora, al utilizar este logger, los mensajes se guardarán en el archivo `logs/my-channel.log`.
