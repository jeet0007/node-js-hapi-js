'use strict';
const Hapi = require('@hapi/hapi');
const Inert = require("@hapi/inert");
const Vision = require('@hapi/vision');
const HapiSwagger = require('hapi-swagger');
const path = require('path')
const Pack = require('./package');
const Joi = require('joi');
const Organizer = require('./services/json-org.service');
const fs = require('fs')
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

    //declare routes
    server.route([{
        method: "GET",
        path: "/",

        handler: (request, h) => {
            return h.file('welcome.html')
        }
    },
    {
        method: "POST",
        path: "/json",
        options: {
            tags: ['api'],
            description: 'Upload Json file',
            notes: 'Returns a organized Json doccument. Takes in an Json input',
            payload: {
                output: 'file',
                parse: true,
                multipart: true
            },
            validate: {
                payload: Joi.object({
                    file: Joi.any()
                        .meta({ swaggerType: 'file' })
                        .description('json file')
                })
            },
            plugins: {
                'hapi-swagger': {
                    payloadType: 'form'
                }
            },
            handler: async (request, h) => {
                return new Promise((resolve, reject) => {
                    const data = request.payload;
                    if (data.file) {
                        const name = data.file.filename;
                        const fileName = path.join(__dirname, 'static/uploads/' + name);
                        const outputFile = fs.createWriteStream(fileName); // create new file
                        const readFile = fs.createReadStream(data.file.path) // read data 
                        outputFile.on('error', (err) => console.error(err));
                        readFile.pipe(outputFile)
                            .on('finish', () => {
                                console.log(`finished parsing file ${fileName}`);
                                resolve(Organizer.organise(fileName))
                            });
                    }
                });
            },
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