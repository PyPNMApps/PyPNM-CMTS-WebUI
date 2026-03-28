# RxMER Selection Insights Math

`Signal Capture -> RxMER` and Advanced RxMER selection-insights views compute:

- average MER
- estimated bitload (bits/symbol)
- error-free QAM from the minimum MER in selection
- MER distribution histogram

Let `M` be the set of selected MER samples (in dB):

\[
M = \{ m_1, m_2, \ldots, m_N \}
\]

Average MER:

\[
\overline{m} = \frac{1}{N}\sum_{i=1}^{N} m_i
\]

Minimum MER:

\[
m_{min} = \min(M)
\]

Estimated bitload:

\[
\mathrm{SNR}_{lin} = 10^{\overline{m}/10}
\]

\[
b_{est} = \log_2(1 + \mathrm{SNR}_{lin})
\]

Display clamp:

\[
b_{display} = \min(12, \max(0, b_{est}))
\]

QAM threshold mapping from `m_min`:

- `QAM-4096` if `m_min >= 45 dB`
- `QAM-2048` if `m_min >= 42 dB`
- `QAM-1024` if `m_min >= 39 dB`
- `QAM-512` if `m_min >= 36 dB`
- `QAM-256` if `m_min >= 33 dB`
- `Below QAM-256` otherwise
