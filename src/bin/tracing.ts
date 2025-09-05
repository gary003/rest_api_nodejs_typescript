import { NodeSDK } from '@opentelemetry/sdk-node'
// import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { SimpleLogRecordProcessor, ConsoleLogRecordExporter } from '@opentelemetry/sdk-logs'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'

import logger from '../v1/helpers/logger'

export const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: process.env.API_NAME || 'api-node-typescript',
    [ATTR_SERVICE_VERSION]: process.env.API_VERSION || '1.0'
  }),

  traceExporter: new OTLPTraceExporter({
    // url: 'http://otel-collector:54318/v1/traces'
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'otel-collector'
  }),
  // traceExporter: new ConsoleSpanExporter(),

  metricReader: new PeriodicExportingMetricReader({
    // exporter: new ConsoleMetricExporter()
    exporter: new OTLPMetricExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'otel-collector'
    })
  }),

  logRecordProcessors: [new SimpleLogRecordProcessor(new ConsoleLogRecordExporter())],

  instrumentations: [getNodeAutoInstrumentations()]
})

try {
  sdk.start()
  logger.info('✅ OpenTelemetry started')
} catch (error) {
  logger.error('❌ Error starting OpenTelemetry', error)
}

export default sdk
