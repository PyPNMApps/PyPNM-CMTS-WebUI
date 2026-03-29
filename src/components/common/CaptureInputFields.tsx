import type { InputHTMLAttributes } from "react";

import { FieldLabel } from "@/components/common/FieldLabel";
import { SecretTextInput } from "@/components/common/SecretTextInput";
import { captureInputAutocomplete } from "@/pw/features/operations/captureInputAutocomplete";
import { requestFieldHints } from "@/pw/features/operations/requestFieldHints";

type CaptureInputFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "children" | "type"> & {
  id: string;
};

export function CaptureMacAddressField(props: CaptureInputFieldProps) {
  return (
    <div className="field">
      <FieldLabel htmlFor={props.id} hint={requestFieldHints.mac_address}>
        MAC Address
      </FieldLabel>
      <input
        {...props}
        autoComplete={captureInputAutocomplete.macAddress}
        placeholder={props.placeholder ?? "aa:bb:cc:dd:ee:ff"}
      />
    </div>
  );
}

export function CaptureIpAddressField(props: CaptureInputFieldProps) {
  return (
    <div className="field">
      <FieldLabel htmlFor={props.id} hint={requestFieldHints.ip_address}>
        IP Address
      </FieldLabel>
      <input
        {...props}
        autoComplete={captureInputAutocomplete.ipAddress}
        placeholder={props.placeholder ?? "192.168.100.10"}
      />
    </div>
  );
}

export function CaptureCommunityField(props: CaptureInputFieldProps) {
  return (
    <div className="field">
      <FieldLabel htmlFor={props.id} hint={requestFieldHints.snmp_rw_community}>
        SNMP RW Community
      </FieldLabel>
      <SecretTextInput
        {...props}
        autoComplete={captureInputAutocomplete.community}
        placeholder={props.placeholder ?? "private"}
      />
    </div>
  );
}
