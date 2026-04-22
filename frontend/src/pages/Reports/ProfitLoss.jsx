import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import api from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const thisYear = () => new Date().getFullYear();

export default function ProfitLoss() {
  const [filters, setFilters] = useState({
    from: `${thisYear()}-01-01`,
    to: new Date().toISOString().split('T')[0]
  });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await api.get('/reports/profit-loss', { params: filters });
    setReport(data);
    setLoading(false);
  };

  const fmt = (n) => `$${Number(n || 0).toFixed(2)}`;

  const chartData = report ? {
    labels: report.monthly.map(m => m.month),
    datasets: [
      {
        label: 'Revenue',
        data: report.monthly.map(m => m.revenue),
        borderColor: '#198754',
        backgroundColor: 'rgba(25,135,84,0.1)',
        fill: true, tension: 0.4,
      },
      {
        label: 'Cost (COGS)',
        data: report.monthly.map(m => m.cogs),
        borderColor: '#dc3545',
        backgroundColor: 'rgba(220,53,69,0.1)',
        fill: true, tension: 0.4,
      },
      {
        label: 'Damage Loss',
        data: report.monthly.map(m => m.damage_loss),
        borderColor: '#fd7e14',
        backgroundColor: 'rgba(253,126,20,0.1)',
        fill: false, tension: 0.4,
      },
      {
        label: 'Net Profit',
        data: report.monthly.map(m => m.net_profit),
        borderColor: '#0d6efd',
        backgroundColor: 'rgba(13,110,253,0.1)',
        fill: false, tension: 0.4,
      },
    ]
  } : null;

  return (
    <div>
      <h5 className="fw-bold mb-4"><i className="bi bi-bar-chart me-2" />Profit & Loss Report</h5>

      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-2 align-items-end">
            <div className="col-md-2">
              <label className="form-label small">From</label>
              <input type="date" className="form-control form-control-sm" value={filters.from}
                onChange={e => setFilters({ ...filters, from: e.target.value })} />
            </div>
            <div className="col-md-2">
              <label className="form-label small">To</label>
              <input type="date" className="form-control form-control-sm" value={filters.to}
                onChange={e => setFilters({ ...filters, to: e.target.value })} />
            </div>
            <div className="col-md-2">
              <button className="btn btn-primary btn-sm" onClick={load} disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm" /> : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {report && (
        <>
          <div className="row g-3 mb-3">
            {[
              { label: 'Total Revenue',     val: fmt(report.revenue),      color: 'success', icon: 'arrow-up-circle' },
              { label: 'Cost of Goods Sold',val: fmt(report.cogs),         color: 'danger',  icon: 'arrow-down-circle' },
              { label: 'Gross Profit',      val: fmt(report.gross_profit), color: report.gross_profit >= 0 ? 'primary' : 'danger', icon: 'graph-up-arrow' },
              { label: 'Damage / Loss',     val: fmt(report.damage_loss),  color: 'warning', icon: 'exclamation-triangle' },
              { label: 'Net Profit',        val: fmt(report.net_profit),   color: report.net_profit >= 0 ? 'info' : 'danger', icon: 'cash-stack' },
              { label: 'Net Margin',        val: report.revenue > 0
                  ? `${((report.net_profit / report.revenue) * 100).toFixed(1)}%`
                  : '0%',
                color: 'secondary', icon: 'percent' },
            ].map((s, i) => (
              <div key={i} className="col-md-2">
                <div className={`card text-white bg-${s.color}`}>
                  <div className="card-body d-flex align-items-center gap-2">
                    <i className={`bi bi-${s.icon} fs-3`} />
                    <div>
                      <div className="fw-bold fs-5">{s.val}</div>
                      <div className="small opacity-75">{s.label}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {chartData && report.monthly.length > 0 && (
            <div className="card shadow-sm mb-3">
              <div className="card-header bg-white fw-semibold">Monthly Breakdown</div>
              <div className="card-body">
                <Line data={chartData} options={{ responsive: true }} />
              </div>
            </div>
          )}

          <div className="card shadow-sm">
            <div className="card-header bg-white fw-semibold">Monthly Summary</div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-sm table-hover">
                  <thead className="table-dark">
                    <tr><th>Month</th><th>Revenue</th><th>COGS</th><th>Gross Profit</th><th>Damage Loss</th><th>Net Profit</th><th>Net Margin</th></tr>
                  </thead>
                  <tbody>
                    {report.monthly.map((m, i) => (
                      <tr key={i}>
                        <td>{m.month}</td>
                        <td className="text-success">{fmt(m.revenue)}</td>
                        <td className="text-danger">{fmt(m.cogs)}</td>
                        <td className={m.profit >= 0 ? 'text-primary fw-semibold' : 'text-danger fw-semibold'}>
                          {fmt(m.profit)}
                        </td>
                        <td className="text-warning fw-semibold">{fmt(m.damage_loss)}</td>
                        <td className={m.net_profit >= 0 ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                          {fmt(m.net_profit)}
                        </td>
                        <td>{m.revenue > 0 ? `${((m.net_profit / m.revenue) * 100).toFixed(1)}%` : '0%'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
