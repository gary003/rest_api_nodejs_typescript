import { NodeSDK } from '@opentelemetry/sdk-node'
// import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions'

import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc' // Changed to gRPC exporter
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc' // Changed to gRPC exporter

export const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: process.env.API_NAME || 'api-node-typescript',
    [ATTR_SERVICE_VERSION]: process.env.API_VERSION || '1.0'
  }),

  // const traceExporter = new OTLPTraceExporter({
  //   url: 'http://otel-collector:54318/v1/traces'
  // })

  //traceExporter: new ConsoleSpanExporter(),
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'otel-collector'
  }),

  // metricReader: new PeriodicExportingMetricReader({
  //   exporter: new ConsoleMetricExporter()
  // })

  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      // Similarly for metrics
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'otel-collector'
    })
  })
})
