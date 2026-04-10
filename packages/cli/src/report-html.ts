import type {
  DashboardHookPerformance,
  DashboardInsight,
  DashboardKeywordPerformance,
  DashboardModel,
  DashboardPatternRow,
  DashboardThemePerformance,
} from "./report-view-model";
import { formatCompactNumber, formatPercent } from "./report-view-model";

function escapeHtml(value: string | null | undefined) {
  return (value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function serializeJsonForScript(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function renderEmptyState(message: string) {
  return `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function renderThemeBars(items: DashboardThemePerformance[]) {
  if (items.length === 0) {
    return renderEmptyState("No themed posts were available for this report window.");
  }

  const maxViews = Math.max(...items.map((item) => item.totalViews), 1);

  return items
    .map((item) => {
      const width = (item.totalViews / maxViews) * 100;
      return `
        <div class="bar-item">
          <div class="bar-meta">
            <span class="bar-label">${escapeHtml(item.label)}</span>
            <span class="bar-value">${escapeHtml(
              `${formatCompactNumber(item.totalViews)} views · ${item.postCount} posts · ${formatPercent(
                item.shareOfViews * 100,
                0,
              )}`,
            )}</span>
          </div>
          <div class="bar-track"><div class="bar-fill" style="width:${width.toFixed(1)}%"></div></div>
        </div>
      `;
    })
    .join("");
}

function renderHookBars(items: DashboardHookPerformance[]) {
  if (items.length === 0) {
    return renderEmptyState("No hook patterns were available for this report window.");
  }

  const maxViews = Math.max(...items.map((item) => item.avgViews), 1);

  return items
    .map((item, index) => {
      const width = (item.avgViews / maxViews) * 100;
      return `
        <div class="bar-item">
          <div class="bar-meta">
            <span class="bar-label ${index === 0 ? "bar-label-top" : ""}">${escapeHtml(item.label)}${index === 0 ? ' <span class="top-chip">Top</span>' : ""}</span>
            <span class="bar-value">${escapeHtml(
              `${formatCompactNumber(item.avgViews)} avg · ${item.postCount} posts`,
            )}</span>
          </div>
          <div class="bar-track"><div class="bar-fill alt" style="width:${width.toFixed(1)}%"></div></div>
        </div>
      `;
    })
    .join("");
}

function renderKeywordBars(items: DashboardKeywordPerformance[]) {
  if (items.length === 0) {
    return renderEmptyState("No repeated caption keywords were strong enough to surface.");
  }

  const maxViews = Math.max(...items.map((item) => item.totalViews), 1);

  return items
    .map((item, index) => {
      const width = (item.totalViews / maxViews) * 100;
      return `
        <div class="keyword-item">
          <div class="keyword-rank">${index + 1}</div>
          <div class="keyword-main">
            <div class="keyword-name">${escapeHtml(item.keyword)}</div>
            <div class="keyword-track"><div class="keyword-fill" style="width:${width.toFixed(1)}%"></div></div>
          </div>
          <div class="keyword-value">${escapeHtml(formatCompactNumber(item.totalViews))}</div>
          <div class="keyword-mentions">${escapeHtml(`${item.mentions}x`)}</div>
        </div>
      `;
    })
    .join("");
}

function renderHashtagTable(model: DashboardModel) {
  if (model.hashtagPerformance.length === 0) {
    return renderEmptyState("No hashtags were available for this report window.");
  }

  return `
    <table class="data-table compact-table">
      <thead>
        <tr>
          <th>Hashtag</th>
          <th>Total Views</th>
          <th>Posts</th>
        </tr>
      </thead>
      <tbody>
        ${model.hashtagPerformance
          .map(
            (item) => `
              <tr>
                <td class="mono">#${escapeHtml(item.hashtag)}</td>
                <td>${escapeHtml(formatCompactNumber(item.totalViews))}</td>
                <td>${item.postCount}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function hookToneClass(label: string) {
  if (label === "Number/Stat Hook") {
    return "tone-number";
  }

  if (label === "Question/Challenge Hook") {
    return "tone-question";
  }

  if (label === "Personal Story Hook") {
    return "tone-story";
  }

  return "tone-statement";
}

function renderHookCards(model: DashboardModel) {
  if (model.hookPerformance.length === 0) {
    return renderEmptyState("No hook patterns were available for this report window.");
  }

  return model.hookPerformance
    .map(
      (item, index) => `
        <div class="hook-card">
          <div class="hook-card-label">${escapeHtml(item.label)}</div>
          <div class="hook-card-avg ${hookToneClass(item.label)}">${escapeHtml(
            formatCompactNumber(item.avgViews),
          )}</div>
          <div class="hook-card-count">
            avg views · ${item.postCount} posts · ${escapeHtml(formatPercent(item.shareOfPosts * 100, 0))}
            ${index === 0 ? '<span class="top-chip">Top</span>' : ""}
          </div>
          <div class="hook-card-example">${escapeHtml(item.bestExample ?? "No example available.")}</div>
        </div>
      `,
    )
    .join("");
}

function renderTopHooks(model: DashboardModel) {
  if (model.topHooks.length === 0) {
    return renderEmptyState("No hook excerpts were available for this report window.");
  }

  return model.topHooks
    .map(
      (post, index) => `
        <div class="top-hook-item">
          <div class="top-hook-rank ${index === 0 ? "top-hook-rank-first" : ""}">${index + 1}</div>
          <div class="top-hook-body">
            <div class="top-hook-text">${escapeHtml(post.hook ?? post.title)}</div>
            <div class="top-hook-meta">
              <span class="top-hook-views">${escapeHtml(formatCompactNumber(post.views))} views</span>
              <span class="hook-pill ${hookToneClass(post.hookType)}">${escapeHtml(
                post.hookType.replace(" Hook", ""),
              )}</span>
              ${index === 0 ? '<span class="mini-badge mini-badge-hot">Viral</span>' : ""}
            </div>
          </div>
        </div>
      `,
    )
    .join("");
}

function renderPatternTable(rows: DashboardPatternRow[]) {
  if (rows.length === 0) {
    return renderEmptyState("No repeatable performance patterns were strong enough to summarize.");
  }

  return `
    <table class="data-table compact-table">
      <thead>
        <tr>
          <th>Pattern</th>
          <th>Signal</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) => `
              <tr>
                <td>${escapeHtml(row.pattern)}</td>
                <td>${escapeHtml(row.value)}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderInsightList(items: DashboardInsight[], emptyMessage: string) {
  if (items.length === 0) {
    return renderEmptyState(emptyMessage);
  }

  return `
    <div class="insight-list">
      ${items
        .map(
          (item, index) => `
            <div class="insight-item">
              <div class="insight-index">${index + 1}</div>
              <div class="insight-body">
                <div class="insight-title">${escapeHtml(item.title)}</div>
                <div class="insight-copy">${escapeHtml(item.body)}</div>
              </div>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderNumberCallouts(model: DashboardModel) {
  if (model.numberCallouts.length === 0) {
    return renderEmptyState("No quantitative callouts were available for this report window.");
  }

  return `
    <div class="number-grid">
      ${model.numberCallouts
        .map(
          (item) => `
            <div class="number-card">
              <div class="number-value">${escapeHtml(item.value)}</div>
              <div class="number-copy">${escapeHtml(item.description)}</div>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderStarPost(model: DashboardModel) {
  if (!model.starPost) {
    return "";
  }

  return `
    <div class="star-card">
      <div class="star-icon">★</div>
      <div class="star-content">
        <div class="star-title">Star Post — ${escapeHtml(model.starPost.title)}</div>
        <div class="star-copy">
          ${
            model.starPost.multiplier
              ? escapeHtml(
                  `${model.starPost.multiplier}x above the rest of the set. ${model.starPost.hook ?? ""}`,
                )
              : escapeHtml(model.starPost.hook ?? "Top-performing post in this report window.")
          }
        </div>
      </div>
      <div class="star-metric">
        <div class="star-value">${escapeHtml(formatCompactNumber(model.starPost.views))}</div>
        <div class="star-sub">views</div>
      </div>
    </div>
  `;
}

export function renderReportHtml(model: DashboardModel) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(model.title)}</title>
  <style>
    :root {
      --bg: #f6f7fb;
      --surface: rgba(255, 255, 255, 0.9);
      --surface-strong: #ffffff;
      --border: rgba(15, 23, 42, 0.08);
      --shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
      --text: #0f172a;
      --text-muted: #475569;
      --text-soft: #64748b;
      --accent: #ff5c6c;
      --accent-2: #2563eb;
      --accent-soft: rgba(255, 92, 108, 0.12);
      --blue-soft: rgba(37, 99, 235, 0.12);
      --green-soft: rgba(14, 116, 144, 0.12);
      --amber-soft: rgba(217, 119, 6, 0.12);
      --radius: 18px;
    }

    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--text);
      background:
        radial-gradient(circle at top left, rgba(255, 92, 108, 0.12), transparent 30%),
        radial-gradient(circle at top right, rgba(37, 99, 235, 0.12), transparent 35%),
        linear-gradient(180deg, #fcfcfe 0%, var(--bg) 100%);
      min-height: 100vh;
    }

    a { color: inherit; }

    .app {
      max-width: 1240px;
      margin: 0 auto;
      padding: 28px 20px 64px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .headline {
      margin: 0;
      font-size: clamp(2rem, 4vw, 2.8rem);
      line-height: 1.04;
      letter-spacing: -0.04em;
      background: linear-gradient(135deg, var(--accent), var(--accent-2));
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }

    .subtitle {
      margin-top: 8px;
      color: var(--text-muted);
      font-size: 0.95rem;
    }

    .header-badge {
      padding: 10px 14px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.75);
      border: 1px solid var(--border);
      box-shadow: var(--shadow);
      color: var(--text-muted);
      font-size: 0.9rem;
      white-space: nowrap;
    }

    .tabs {
      display: flex;
      gap: 6px;
      padding: 6px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.8);
      border: 1px solid var(--border);
      box-shadow: var(--shadow);
      margin-bottom: 24px;
      overflow-x: auto;
      scrollbar-width: none;
    }

    .tabs::-webkit-scrollbar { display: none; }

    .tab-button {
      border: 0;
      background: transparent;
      color: var(--text-soft);
      padding: 10px 16px;
      border-radius: 999px;
      font-size: 0.92rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
    }

    .tab-button.active {
      background: linear-gradient(135deg, rgba(255, 92, 108, 0.18), rgba(37, 99, 235, 0.16));
      color: var(--text);
    }

    .pane { display: none; }
    .pane.active { display: block; }

    .stat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 14px;
      margin-bottom: 22px;
    }

    .card,
    .stat-card,
    .star-card,
    .hook-card,
    .number-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      backdrop-filter: blur(10px);
    }

    .stat-card {
      padding: 18px;
    }

    .stat-label,
    .section-label {
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-soft);
    }

    .stat-value {
      margin-top: 10px;
      font-size: 2rem;
      font-weight: 800;
      letter-spacing: -0.05em;
    }

    .stat-sub {
      margin-top: 6px;
      color: var(--text-soft);
      font-size: 0.85rem;
    }

    .star-card {
      padding: 18px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 22px;
      background: linear-gradient(135deg, rgba(255, 92, 108, 0.12), rgba(37, 99, 235, 0.12));
    }

    .star-icon {
      width: 44px;
      height: 44px;
      border-radius: 14px;
      display: grid;
      place-items: center;
      background: rgba(255, 255, 255, 0.72);
      font-size: 1.2rem;
    }

    .star-content {
      flex: 1 1 auto;
      min-width: 0;
    }

    .star-title {
      font-size: 1rem;
      font-weight: 700;
    }

    .star-copy {
      margin-top: 6px;
      color: var(--text-muted);
      font-size: 0.92rem;
    }

    .star-metric {
      text-align: right;
      min-width: 84px;
    }

    .star-value {
      font-size: 1.9rem;
      font-weight: 800;
      color: var(--accent);
      letter-spacing: -0.05em;
    }

    .star-sub {
      color: var(--text-soft);
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .two-col {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px;
    }

    .card {
      padding: 20px;
    }

    .section-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 16px;
    }

    .section-title {
      font-size: 1rem;
      font-weight: 700;
      margin: 0;
    }

    .bar-stack {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .bar-meta {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: baseline;
      margin-bottom: 6px;
    }

    .bar-label {
      font-size: 0.94rem;
      font-weight: 600;
      line-height: 1.3;
    }

    .bar-label-top { color: var(--text); }
    .bar-value { color: var(--text-soft); font-size: 0.85rem; text-align: right; }
    .bar-track {
      height: 9px;
      border-radius: 999px;
      background: rgba(148, 163, 184, 0.18);
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg, var(--accent), #fb7185);
    }

    .bar-fill.alt {
      background: linear-gradient(90deg, var(--accent-2), #38bdf8);
    }

    .top-chip,
    .mini-badge,
    .hook-pill,
    .theme-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 700;
      line-height: 1;
      padding: 6px 10px;
    }

    .top-chip {
      margin-left: 6px;
      background: rgba(255, 92, 108, 0.12);
      color: #be123c;
    }

    .mini-badge-hot {
      background: rgba(255, 92, 108, 0.12);
      color: #be123c;
    }

    .theme-pill {
      background: rgba(15, 23, 42, 0.08);
      color: var(--text-muted);
    }

    .tone-number {
      background: rgba(255, 92, 108, 0.12);
      color: #be123c;
    }

    .tone-question {
      background: var(--amber-soft);
      color: #b45309;
    }

    .tone-story {
      background: var(--green-soft);
      color: #0f766e;
    }

    .tone-statement {
      background: var(--blue-soft);
      color: #1d4ed8;
    }

    .sort-controls {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 14px;
    }

    .sort-button {
      border: 1px solid var(--border);
      background: rgba(255, 255, 255, 0.88);
      color: var(--text-muted);
      border-radius: 999px;
      padding: 9px 14px;
      cursor: pointer;
      font-weight: 600;
    }

    .sort-button.active {
      color: var(--text);
      background: linear-gradient(135deg, rgba(255, 92, 108, 0.12), rgba(37, 99, 235, 0.12));
    }

    .table-shell {
      overflow: hidden;
      border-radius: var(--radius);
      border: 1px solid var(--border);
      background: rgba(255, 255, 255, 0.88);
      box-shadow: var(--shadow);
    }

    .table-scroll { overflow-x: auto; }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 980px;
    }

    .data-table.compact-table {
      min-width: 0;
    }

    .data-table thead th {
      text-align: left;
      padding: 14px 16px;
      font-size: 0.76rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-soft);
      background: rgba(248, 250, 252, 0.88);
      border-bottom: 1px solid var(--border);
    }

    .data-table tbody td {
      padding: 14px 16px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.12);
      vertical-align: top;
      font-size: 0.93rem;
    }

    .data-table tbody tr:last-child td {
      border-bottom: none;
    }

    .post-row {
      cursor: pointer;
    }

    .post-row:hover {
      background: rgba(248, 250, 252, 0.72);
    }

    .rank-pill {
      width: 28px;
      height: 28px;
      border-radius: 999px;
      display: grid;
      place-items: center;
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--text-soft);
      background: rgba(148, 163, 184, 0.14);
    }

    .rank-pill.top {
      background: rgba(255, 92, 108, 0.12);
      color: #be123c;
    }

    .thumb {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      object-fit: cover;
      display: block;
      background: rgba(148, 163, 184, 0.14);
    }

    .thumb-fallback {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: none;
      place-items: center;
      background: rgba(148, 163, 184, 0.14);
      color: var(--text-soft);
      font-size: 1.1rem;
    }

    .post-link {
      color: var(--accent-2);
      text-decoration: none;
      font-weight: 600;
    }

    .expand-row td {
      padding-top: 0;
      background: rgba(248, 250, 252, 0.55);
    }

    .expand-content {
      display: none;
      padding: 0 0 18px;
    }

    .expand-content.open {
      display: block;
    }

    .expand-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
      padding: 10px 0 0;
    }

    .expand-label {
      font-size: 0.76rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-soft);
      margin-bottom: 6px;
    }

    .expand-copy {
      color: var(--text-muted);
      line-height: 1.55;
      font-size: 0.92rem;
    }

    .keyword-item {
      display: grid;
      grid-template-columns: 34px minmax(0, 1fr) auto auto;
      gap: 12px;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid rgba(148, 163, 184, 0.12);
    }

    .keyword-item:last-child { border-bottom: none; }
    .keyword-rank {
      width: 28px;
      height: 28px;
      border-radius: 999px;
      display: grid;
      place-items: center;
      background: rgba(15, 23, 42, 0.08);
      color: var(--text-muted);
      font-size: 0.82rem;
      font-weight: 700;
    }

    .keyword-name { font-weight: 600; }
    .keyword-track {
      height: 8px;
      margin-top: 8px;
      border-radius: 999px;
      background: rgba(148, 163, 184, 0.18);
      overflow: hidden;
    }

    .keyword-fill {
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg, var(--accent), var(--accent-2));
    }

    .keyword-value,
    .keyword-mentions,
    .mono {
      color: var(--text-soft);
      font-size: 0.85rem;
    }

    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }

    .hook-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 14px;
      margin-bottom: 20px;
    }

    .hook-card {
      padding: 18px;
    }

    .hook-card-label {
      font-size: 0.86rem;
      font-weight: 700;
      color: var(--text-soft);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .hook-card-avg {
      margin-top: 10px;
      font-size: 1.9rem;
      font-weight: 800;
      letter-spacing: -0.05em;
      display: inline-flex;
      padding: 8px 12px;
      border-radius: 14px;
    }

    .hook-card-count {
      margin-top: 12px;
      color: var(--text-soft);
      font-size: 0.88rem;
    }

    .hook-card-example {
      margin-top: 12px;
      color: var(--text-muted);
      font-size: 0.92rem;
      line-height: 1.5;
    }

    .top-hooks {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 18px;
    }

    .top-hook-item {
      display: flex;
      gap: 14px;
      padding: 16px;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.82);
      border: 1px solid var(--border);
      box-shadow: var(--shadow);
    }

    .top-hook-rank {
      width: 36px;
      height: 36px;
      border-radius: 999px;
      display: grid;
      place-items: center;
      flex: 0 0 auto;
      background: rgba(148, 163, 184, 0.14);
      color: var(--text-muted);
      font-weight: 700;
    }

    .top-hook-rank-first {
      background: rgba(255, 92, 108, 0.12);
      color: #be123c;
    }

    .top-hook-body { min-width: 0; }
    .top-hook-text {
      font-size: 0.97rem;
      font-weight: 600;
      line-height: 1.45;
    }

    .top-hook-meta {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-top: 8px;
      color: var(--text-soft);
      font-size: 0.85rem;
    }

    .insight-section {
      margin-bottom: 18px;
    }

    .insight-section-title {
      margin: 0 0 10px;
      font-size: 1rem;
      font-weight: 700;
    }

    .insight-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .insight-item {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      padding: 14px 16px;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.82);
      border: 1px solid var(--border);
      box-shadow: var(--shadow);
    }

    .insight-index {
      width: 28px;
      height: 28px;
      border-radius: 999px;
      display: grid;
      place-items: center;
      flex: 0 0 auto;
      background: rgba(15, 23, 42, 0.08);
      color: var(--text-muted);
      font-size: 0.82rem;
      font-weight: 700;
    }

    .insight-title {
      font-size: 0.95rem;
      font-weight: 700;
    }

    .insight-copy {
      margin-top: 4px;
      color: var(--text-muted);
      font-size: 0.92rem;
      line-height: 1.55;
    }

    .number-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 14px;
    }

    .number-card {
      padding: 18px;
    }

    .number-value {
      font-size: 2rem;
      font-weight: 800;
      letter-spacing: -0.05em;
    }

    .number-copy {
      margin-top: 8px;
      color: var(--text-muted);
      font-size: 0.92rem;
      line-height: 1.5;
    }

    .empty-state {
      padding: 18px;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.7);
      border: 1px dashed rgba(148, 163, 184, 0.35);
      color: var(--text-soft);
      font-size: 0.92rem;
    }

    .spacer-20 { margin-top: 20px; }

    @media (max-width: 900px) {
      .two-col,
      .expand-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 640px) {
      .app { padding-left: 14px; padding-right: 14px; }
      .header { align-items: stretch; }
      .star-card { align-items: flex-start; }
      .star-metric { text-align: left; }
      .keyword-item {
        grid-template-columns: 28px minmax(0, 1fr);
      }
      .keyword-value,
      .keyword-mentions {
        grid-column: 2;
      }
    }
  </style>
</head>
<body>
  <div class="app">
    <header class="header">
      <div>
        <h1 class="headline">${escapeHtml(model.title)}</h1>
        <div class="subtitle">${escapeHtml(model.windowLabel)} · ${escapeHtml(model.postCountLabel)} · Generated ${escapeHtml(model.generatedAtLabel)}</div>
      </div>
      <div class="header-badge">@${escapeHtml(model.username)}</div>
    </header>

    <nav class="tabs" aria-label="Report sections">
      <button class="tab-button active" data-tab="overview">Overview</button>
      <button class="tab-button" data-tab="posts">All Posts</button>
      <button class="tab-button" data-tab="keywords">Keywords</button>
      <button class="tab-button" data-tab="hooks">Hook Patterns</button>
      <button class="tab-button" data-tab="insights">Strategic Insights</button>
    </nav>

    <section class="pane active" id="pane-overview">
      <div class="stat-grid">
        ${model.statCards
          .map(
            (card) => `
              <article class="stat-card">
                <div class="stat-label">${escapeHtml(card.label)}</div>
                <div class="stat-value">${escapeHtml(
                  card.compact ? formatCompactNumber(card.value) : Math.round(card.value).toLocaleString("en-US"),
                )}</div>
                <div class="stat-sub">${escapeHtml(card.sublabel)}</div>
              </article>
            `,
          )
          .join("")}
      </div>

      ${renderStarPost(model)}

      <div class="two-col">
        <article class="card">
          <div class="section-heading">
            <div>
              <div class="section-label">Theme View</div>
              <h2 class="section-title">Theme Performance by Views</h2>
            </div>
          </div>
          <div class="bar-stack">${renderThemeBars(model.themePerformance)}</div>
        </article>

        <article class="card">
          <div class="section-heading">
            <div>
              <div class="section-label">Hook View</div>
              <h2 class="section-title">Hook Type Avg Views</h2>
            </div>
          </div>
          <div class="bar-stack">${renderHookBars(model.hookPerformance)}</div>
        </article>
      </div>
    </section>

    <section class="pane" id="pane-posts">
      <div class="sort-controls">
        <button class="sort-button active" data-sort="views">Views</button>
        <button class="sort-button" data-sort="likes">Likes</button>
        <button class="sort-button" data-sort="saves">Saves</button>
        <button class="sort-button" data-sort="shares">Shares</button>
        <button class="sort-button" data-sort="engagementRatePercent">Eng%</button>
        <button class="sort-button" data-sort="postedAt">Date</button>
      </div>

      <div class="table-shell">
        <div class="table-scroll">
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Thumb</th>
                <th>Date</th>
                <th>Theme</th>
                <th>Views</th>
                <th>Reach</th>
                <th>Likes</th>
                <th>Saves</th>
                <th>Shares</th>
                <th>Eng%</th>
                <th>Hook</th>
                <th>Link</th>
              </tr>
            </thead>
            <tbody id="posts-tbody"></tbody>
          </table>
        </div>
      </div>
    </section>

    <section class="pane" id="pane-keywords">
      <article class="card">
        <div class="section-heading">
          <div>
            <div class="section-label">Keyword View</div>
            <h2 class="section-title">Caption Keywords by Total Views</h2>
          </div>
        </div>
        <div>${renderKeywordBars(model.keywordPerformance)}</div>
      </article>

      <article class="card spacer-20">
        <div class="section-heading">
          <div>
            <div class="section-label">Hashtag View</div>
            <h2 class="section-title">Hashtag Performance</h2>
          </div>
        </div>
        ${renderHashtagTable(model)}
      </article>
    </section>

    <section class="pane" id="pane-hooks">
      <article class="card">
        <div class="section-heading">
          <div>
            <div class="section-label">Hook View</div>
            <h2 class="section-title">Hook Type Performance</h2>
          </div>
        </div>
        <div class="hook-grid">${renderHookCards(model)}</div>

        <div class="section-heading">
          <div>
            <div class="section-label">Top Hooks</div>
            <h2 class="section-title">Top Performing Hooks</h2>
          </div>
        </div>
        <div class="top-hooks">${renderTopHooks(model)}</div>
      </article>

      <article class="card spacer-20">
        <div class="section-heading">
          <div>
            <div class="section-label">Pattern View</div>
            <h2 class="section-title">What Drives Performance</h2>
          </div>
        </div>
        ${renderPatternTable(model.performancePatterns)}
      </article>

      <article class="card spacer-20">
        <div class="section-heading">
          <div>
            <div class="section-label">Hook View</div>
            <h2 class="section-title">What Makes a Great Hook for This Account</h2>
          </div>
        </div>
        ${renderInsightList(
          model.hookGuidance,
          "No hook guidance was available for this report window.",
        )}
      </article>
    </section>

    <section class="pane" id="pane-insights">
      <article class="insight-section">
        <h2 class="insight-section-title">Do More Of</h2>
        ${renderInsightList(
          model.strategicInsights.doMoreOf,
          "No repeatable strengths were strong enough to summarize.",
        )}
      </article>

      <article class="insight-section">
        <h2 class="insight-section-title">Do Less Of / Reconsider</h2>
        ${renderInsightList(
          model.strategicInsights.doLessOf,
          "No consistent weak spots stood out strongly enough to summarize.",
        )}
      </article>

      <article class="insight-section">
        <h2 class="insight-section-title">Untapped Opportunities</h2>
        ${renderInsightList(
          model.strategicInsights.untappedOpportunities,
          "No clear near-term opportunities were strong enough to summarize.",
        )}
      </article>

      <article class="insight-section">
        <h2 class="insight-section-title">What the Numbers Say</h2>
        ${renderNumberCallouts(model)}
      </article>
    </section>
  </div>

  <script>
    const POSTS = ${serializeJsonForScript(model.posts)};
    let currentSort = "views";
    let currentDirection = -1;

    function escapeHtml(value) {
      return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function safeUrl(value) {
      if (!value) {
        return "#";
      }

      try {
        const parsed = new URL(value);
        return parsed.toString();
      } catch {
        return "#";
      }
    }

    function compactNumber(value) {
      const numeric = Number(value || 0);

      if (numeric >= 1000000) {
        return (Math.round((numeric / 1000000) * 10) / 10) + "M";
      }

      if (numeric >= 1000) {
        return (Math.round((numeric / 100) ) / 10) + "K";
      }

      return Math.round(numeric).toLocaleString("en-US");
    }

    function integer(value) {
      return Math.round(Number(value || 0)).toLocaleString("en-US");
    }

    function percent(value) {
      if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return "—";
      }

      return Number(value).toFixed(1) + "%";
    }

    function hookToneClass(hookType) {
      if (hookType === "Number/Stat Hook") return "tone-number";
      if (hookType === "Question/Challenge Hook") return "tone-question";
      if (hookType === "Personal Story Hook") return "tone-story";
      return "tone-statement";
    }

    function renderTable() {
      const tbody = document.getElementById("posts-tbody");

      if (!tbody) {
        return;
      }

      const sorted = [...POSTS].sort((left, right) => {
        const leftValue = left[currentSort];
        const rightValue = right[currentSort];

        if (currentSort === "postedAt") {
          const leftTime = leftValue ? new Date(leftValue).getTime() : 0;
          const rightTime = rightValue ? new Date(rightValue).getTime() : 0;
          return (leftTime - rightTime) * currentDirection;
        }

        return ((Number(leftValue) || 0) - (Number(rightValue) || 0)) * currentDirection;
      });

      if (sorted.length === 0) {
        tbody.innerHTML = '<tr><td colspan="12"><div class="empty-state">No posts were available for this report window.</div></td></tr>';
        return;
      }

      tbody.innerHTML = "";

      sorted.forEach((post, index) => {
        const row = document.createElement("tr");
        row.className = "post-row";
        const expandRow = document.createElement("tr");
        expandRow.className = "expand-row";
        const isTop = index === 0;
        const postDate = post.postedAt ? new Date(post.postedAt) : null;
        const label = postDate
          ? postDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : "—";
        const permalink = safeUrl(post.permalink);

        row.innerHTML = \`
          <td><div class="rank-pill \${isTop ? "top" : ""}">\${index + 1}</div></td>
          <td>
            <img class="thumb" src="\${escapeHtml(post.thumbnailUrl || "")}" alt="" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='grid';">
            <div class="thumb-fallback">🎬</div>
          </td>
          <td>\${escapeHtml(label)}</td>
          <td><span class="theme-pill">\${escapeHtml(post.theme)}</span></td>
          <td>\${escapeHtml(compactNumber(post.views))}</td>
          <td>\${escapeHtml(compactNumber(post.reach))}</td>
          <td>\${escapeHtml(integer(post.likes))}</td>
          <td>\${escapeHtml(integer(post.saves))}</td>
          <td>\${escapeHtml(integer(post.shares))}</td>
          <td>\${escapeHtml(percent(post.engagementRatePercent))}</td>
          <td><span class="hook-pill \${hookToneClass(post.hookType)}">\${escapeHtml(post.hookType.replace(" Hook", ""))}</span></td>
          <td>\${permalink === "#" ? "—" : \`<a class="post-link" href="\${escapeHtml(permalink)}" target="_blank" rel="noopener">Open</a>\`}</td>
        \`;

        const expandCell = document.createElement("td");
        expandCell.colSpan = 12;
        expandCell.innerHTML = \`
          <div class="expand-content">
            <div class="expand-grid">
              <div>
                <div class="expand-label">Hook</div>
                <div class="expand-copy">\${escapeHtml(post.hook || "—")}</div>
                <div class="expand-label" style="margin-top: 12px;">Transcript</div>
                <div class="expand-copy">\${escapeHtml(post.transcript || "No transcript stored for this post.")}</div>
              </div>
              <div>
                <div class="expand-label">Caption</div>
                <div class="expand-copy">\${escapeHtml(post.caption || "No caption stored for this post.")}</div>
                <div class="expand-label" style="margin-top: 12px;">Post Title</div>
                <div class="expand-copy">\${escapeHtml(post.title)}</div>
              </div>
            </div>
          </div>
        \`;
        expandRow.appendChild(expandCell);

        row.addEventListener("click", (event) => {
          if (event.target.closest("a")) {
            return;
          }

          const content = expandCell.querySelector(".expand-content");
          const isOpen = content.classList.contains("open");

          tbody.querySelectorAll(".expand-content.open").forEach((item) => item.classList.remove("open"));
          if (!isOpen) {
            content.classList.add("open");
          }
        });

        tbody.appendChild(row);
        tbody.appendChild(expandRow);
      });
    }

    function activateTab(targetId) {
      document.querySelectorAll(".tab-button").forEach((button) => {
        button.classList.toggle("active", button.dataset.tab === targetId);
      });

      document.querySelectorAll(".pane").forEach((pane) => {
        pane.classList.toggle("active", pane.id === "pane-" + targetId);
      });
    }

    document.querySelectorAll(".tab-button").forEach((button) => {
      button.addEventListener("click", () => activateTab(button.dataset.tab));
    });

    document.querySelectorAll(".sort-button").forEach((button) => {
      button.addEventListener("click", () => {
        const nextSort = button.dataset.sort;

        if (!nextSort) {
          return;
        }

        if (currentSort === nextSort) {
          currentDirection *= -1;
        } else {
          currentSort = nextSort;
          currentDirection = -1;
        }

        document.querySelectorAll(".sort-button").forEach((item) => {
          item.classList.toggle("active", item === button);
        });

        renderTable();
      });
    });

    renderTable();
  </script>
</body>
</html>`;
}
