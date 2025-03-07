import { SwaggerUiOptions } from 'swagger-ui-express'

export const openApiOptions: SwaggerUiOptions = {
  customSiteTitle: 'API Backend Template - OpenAPI 3.0 (Dark Theme)',
  customCss: `
.swagger-ui,
    .swagger-ui .wrapper { background-color: #f5f5f5; color: #212121; }
    .swagger-ui .topbar { background-color: #3f51b5; color: #ffffff; }
    .swagger-ui .topbar a { color: #ffffff; }
    .swagger-ui .scheme-container { background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .swagger-ui .opblock-tag { color: #ffffff; background-color: #3f51b5; }
    .swagger-ui .opblock { background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 4px; }
    .swagger-ui .opblock .opblock-summary { background-color: #fafafa; }
    .swagger-ui .opblock .opblock-summary-method { color: #3f51b5; font-weight: bold; }
    .swagger-ui .opblock .opblock-summary-path { color: #616161; }
    .swagger-ui .opblock-body pre { background-color: #eceff1; color: #212121; }
    .swagger-ui .btn { background-color: #3f51b5; color: #ffffff; border-radius: 4px; }
    .swagger-ui .btn:hover { background-color: #5c6bc0; }
    .swagger-ui input[type="text"], .swagger-ui textarea { background-color: #ffffff; color: #212121; border: 1px solid #e0e0e0; border-radius: 4px; }
  `,
  customfavIcon: '/favicon.ico', // Optional: ensure this exists in public/
  swaggerOptions: {
    defaultModelsExpandDepth: 2,
    displayOperationId: true,
    docExpansion: 'list',
    filter: true,
    tryItOutEnabled: true,
    displayRequestDuration: true
  },
  explorer: true
}
