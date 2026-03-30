export interface ServingGroupCaptureRequestPayload {
  cmts: {
    serving_group: {
      id: number[];
    };
    cable_modem: {
      mac_address: string[];
      pnm_parameters: {
        tftp: {
          ipv4: string;
          ipv6: string;
        };
        capture: {
          channel_ids: number[];
        };
      };
      snmp: {
        snmpV2C: {
          community: string;
        };
      };
    };
  };
  execution: {
    max_workers: number;
    retry_count: number;
    retry_delay_seconds: number;
    per_modem_timeout_seconds: number;
    overall_timeout_seconds: number;
  };
  capture_settings?: {
    fec_summary_type?: number;
    modulation_order_offset?: number;
    number_sample_symbol?: number;
    sample_duration?: number;
    inactivity_timeout?: number;
    first_segment_center_freq?: number;
    last_segment_center_freq?: number;
    resolution_bw?: number;
    noise_bw?: number;
    window_function?: number;
    num_averages?: number;
    spectrum_retrieval_type?: number;
  };
}
