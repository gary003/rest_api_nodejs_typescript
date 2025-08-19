// tracing.js
import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import logger from '../v1/helpers/logger'

const traceExporter = new OTLPTraceExporter({
  url: 'http://otel-collector:54317/v1/traces'
})

const sdk = new NodeSDK({
  traceExporter,
  instrumentations: [getNodeAutoInstrumentations()]
})

try {
  sdk.start()
  logger.info('✅ OpenTelemetry started')
} catch (error) {
  logger.error('❌ Error starting OpenTelemetry', error)
}
