import { useState } from "react";
import { useForm } from "react-hook-form";

import { PageHeader } from "@/components/common/PageHeader";
import { Panel } from "@/components/common/Panel";
import type { GenericMeasurementRequest } from "@/types/api";

export function MeasurementRequestPage() {
  const { register, handleSubmit, reset } = useForm<GenericMeasurementRequest>();
  const [preview, setPreview] = useState<GenericMeasurementRequest | null>(null);

  return (
    <>
      <PageHeader
        title="Measurement Request"
        subtitle="Capture request parameters before wiring endpoint-specific submission actions."
      />
      <Panel title="Request Inputs">
        <form
          onSubmit={handleSubmit((values) => {
            setPreview(values);
          })}
          className="grid"
        >
          <div className="grid two">
            <div className="field">
              <label htmlFor="mac_address">MAC Address</label>
              <input id="mac_address" {...register("mac_address")} placeholder="00:00:00:00:00:00" />
            </div>
            <div className="field">
              <label htmlFor="ip_address">IP Address</label>
              <input id="ip_address" {...register("ip_address")} placeholder="192.168.100.1" />
            </div>
            <div className="field">
              <label htmlFor="service_group">Service Group</label>
              <input id="service_group" {...register("service_group")} placeholder="sg-1" />
            </div>
            <div className="field">
              <label htmlFor="operation_id">Capture Operation ID</label>
              <input id="operation_id" {...register("operation.pnm_capture_operation_id")} placeholder="operation-id" />
            </div>
          </div>
          <div className="actions">
            <button type="submit" className="primary">Preview Payload</button>
            <button
              type="button"
              onClick={() => {
                reset();
                setPreview(null);
              }}
            >
              Clear
            </button>
          </div>
        </form>
      </Panel>
      <Panel title="Payload Preview">
        <pre className="mono">{JSON.stringify(preview, null, 2)}</pre>
      </Panel>
    </>
  );
}
