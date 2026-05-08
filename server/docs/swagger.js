const express = require('express');
const swaggerUi = require('swagger-ui-express');
const openApiSpec = require('./openapi');

const router = express.Router();

router.use(
  '/',
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec, {
    explorer: true,
    customSiteTitle: 'Gatherly API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'list',
      defaultModelsExpandDepth: 1,
    },
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info { margin-bottom: 24px; }
    `,
  })
);

module.exports = router;
