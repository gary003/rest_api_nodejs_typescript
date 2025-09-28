import { NodeSDK } from '@opentelemetry/sdk-node'
// import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { SimpleLogRecordProcessor } from '@opentelemetry/sdk-logs'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc'
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-grpc'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'

// import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http' // Use HTTP exporter for logs
// import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs'
import logger from '../v1/helpers/logger'

export const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: process.env.API_NAME || 'api-node-typescript',
    [ATTR_SERVICE_VERSION]: process.env.API_VERSION || '1.0'
  }),

  instrumentations: [getNodeAutoInstrumentations()],

  metricReader: new PeriodicExportingMetricReader({
    // exporter: new ConsoleMetricExporter()
    exporter: new OTLPMetricExporter({ url: 'http://otel-collector:4317/v1/metrics' })
  }),

  traceExporter: new OTLPTraceExporter({ url: 'http://otel-collector:4317/v1/traces' }),
  // traceExporter: new ConsoleSpanExporter(),

  // logRecordProcessor: new BatchLogRecordProcessor(
  //   new OTLPLogExporter({
  //     url: process.env.OTEL_LOGS_EXPORTER_ENDPOINT || 'http://otel-collector:34317/v1/logs' // Use HTTP port for logs
  //     // You can add headers here if needed
  //     // headers: {},
  //   })
  // )

  logRecordProcessors: [new SimpleLogRecordProcessor(new OTLPLogExporter({ url: 'http://otel-collector:4317/v1/logs' }))]
})

try {
  sdk.start()
  logger.info('✅ OpenTelemetry started')
  logger.info(`urlTrace: ${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}, url: ${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}`)
} catch (error) {
  logger.error('❌ Error starting OpenTelemetry', error)
}

export default sdk
