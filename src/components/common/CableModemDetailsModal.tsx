interface CableModemDetails {
  sgId: number;
  macAddress: string;
  ipAddress: string;
  registrationStatusText: string;
  vendor: string;
  model: string;
  softwareVersion: string;
  dsChannelIds: number[];
  usChannelIds: number[];
}

interface CableModemDetailsModalProps {
  details: CableModemDetails | null;
  onClose: () => void;
}

function formatChannelIds(channelIds: number[]): string {
  return channelIds.length ? channelIds.join(", ") : "n/a";
}

export function CableModemDetailsModal({ details, onClose }: CableModemDetailsModalProps) {
  if (!details) {
    return null;
  }

  return (
    <div
      className="selection-insights-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cable-modem-details-title"
      onClick={onClose}
    >
      <div className="selection-insights-modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="selection-insights-modal-header">
          <h3 id="cable-modem-details-title" className="selection-insights-modal-title">Cable Modem Details</h3>
          <button type="button" className="operations-json-download" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="details-table-wrap">
          <table className="details-table">
            <tbody>
              <tr>
                <th>SG ID</th>
                <td>{details.sgId}</td>
              </tr>
              <tr>
                <th>MAC Address</th>
                <td className="mono">{details.macAddress}</td>
              </tr>
              <tr>
                <th>IP Address</th>
                <td className="mono">{details.ipAddress}</td>
              </tr>
              <tr>
                <th>Registration Status</th>
                <td>{details.registrationStatusText}</td>
              </tr>
              <tr>
                <th>Vendor</th>
                <td>{details.vendor}</td>
              </tr>
              <tr>
                <th>Model</th>
                <td>{details.model}</td>
              </tr>
              <tr>
                <th>Version</th>
                <td>{details.softwareVersion}</td>
              </tr>
              <tr>
                <th>DS Channel IDs</th>
                <td>{formatChannelIds(details.dsChannelIds)}</td>
              </tr>
              <tr>
                <th>US Channel IDs</th>
                <td>{formatChannelIds(details.usChannelIds)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
