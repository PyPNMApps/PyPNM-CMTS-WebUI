import type { DeviceInfo } from "@/pw/features/analysis/types";

interface DeviceInfoTableProps {
  deviceInfo: DeviceInfo;
}

export function DeviceInfoTable({ deviceInfo }: DeviceInfoTableProps) {
  return (
    <div className="device-table-wrap">
      <table>
        <thead>
          <tr>
            <th>MacAddress</th>
            <th>Model</th>
            <th>Vendor</th>
            <th>SW Version</th>
            <th>HW Version</th>
            <th>Boot ROM</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="mono">{deviceInfo.macAddress}</td>
            <td>{deviceInfo.MODEL}</td>
            <td>{deviceInfo.VENDOR}</td>
            <td className="mono">{deviceInfo.SW_REV}</td>
            <td className="mono">{deviceInfo.HW_REV}</td>
            <td className="mono">{deviceInfo.BOOTR}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
