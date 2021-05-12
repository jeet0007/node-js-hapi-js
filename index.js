'use strict';

const Hapi = require('@hapi/hapi');
const Inert = require("@hapi/inert");
const Vision = require('@hapi/vision');
const HapiSwagger = require('hapi-swagger');
const path = require('path')
const Pack = require('./package');
const Joi = require('joi');
const Organizer = require('./services/json-org.service');
const swaggerOptions = {
    info: {
        title: 'JSON Organizer API Documentation',
        version: Pack.version,
        host: 'localhost:3000',
        schemes: ['http'],
        basedir: __dirname
    },
};

// starts server and sets up routes
const init = async () => {
    const server = Hapi.server({
        port: 3000,
        host: 'localhost',
        routes: {
            files: {
                relativeTo: path.join(__dirname, 'static')
            }
        }
    });
    //register plugins 
    await server.register([{
        plugin: Inert
    },
    {
        plugin: Vision
    },
    {
        plugin: HapiSwagger,
        option: swaggerOptions
    }])
    server.views({
        engines: {
            html: require('handlebars')
        },
        path: path.join(__dirname, 'views')

    })

    //declare routes
    server.route([{
        method: "GET",
        path: "/",

        handler: (request, h) => {
            return h.file('./static/welcome.html')
        }
    },
    {
        method: "POST",
        path: "/json",
        options: {
            handler: async (request, h) => {
                const ans = Organizer.organise(request.payload.json)
                console.log(ans);
                return `<pre> ${await ans} </pre>`
            },
            validate: {
                payload: Joi.object({
                    json: Joi.string()
                        .required()
                })
            },
            plugins: {
                'hapi-swagger': {
                    payloadType: 'form'
                }
            },
            tags: ['api'],
            description: 'Get Json Result',
            notes: 'Returns a organized Json doccument. Takes in an Json input'
        },
    }
    ])

    await server.start();
    console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();