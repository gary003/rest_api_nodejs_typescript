import { NodeSDK } from '@opentelemetry/sdk-node'
// import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node'
// import { ConsoleMetricExporter, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'

// import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http' // Use HTTP exporter for logs
// import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs'

export const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: process.env.API_NAME || 'api-node-typescript',
    [ATTR_SERVICE_VERSION]: process.env.API_VERSION || '1.0'
  }),

  instrumentations: [getNodeAutoInstrumentations()],

  // metricReader: new PeriodicExportingMetricReader({
  //   exporter: new ConsoleMetricExporter()
  // }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({ url: process.env.OTEL_METRIC_EXPORTER_ENDPOINT })
  }),
  traceExporter: new OTLPTraceExporter({ url: process.env.OTEL_TRACE_EXPORTER_ENDPOINT })

  // traceExporter: new ConsoleSpanExporter()

  // logRecordProcessor: new BatchLogRecordProcessor(
  //   new OTLPLogExporter({
  //     url: process.env.OTEL_LOGS_EXPORTER_ENDPOINT || 'http://otel-collector:34317/v1/logs' // Use HTTP port for logs
  //     // You can add headers here if needed
  //     // headers: {},
  //   })
  // )
})

export default sdk
