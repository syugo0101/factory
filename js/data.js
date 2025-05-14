document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const type = params.get("type");

  const typeMap = {
    sample:"サンプル",
    steel: "製鉄所",
    oil: "製油所",
    ethylene: "エチレンプラント",
    aluminum: "アルミニウム製錬所",
    // 必要に応じて追加
  };

  const displayName = typeMap[type] || "不明な分類";
  const csvFile = `data/${type}.csv`;

  const h2 = document.querySelector("main h2");
  h2.textContent = `${displayName}の工場データ一覧`;

  fetchAndDisplayCSV(csvFile);
});

function fetchAndDisplayCSV(filePath) {
  Papa.parse(filePath, {
    skipEmptyLines: true,  // ★ここを追加
    download: true,
    header: true,
    complete: function(results) {
      const data = results.data;
      const section = document.querySelector("main section");

      if (!data || data.length === 0 || Object.keys(data[0]).length === 0) {
        section.innerHTML = "<p>CSVデータが見つかりませんでした。</p>";
        return;
      }

      let html = "<table><thead><tr>";
      for (let key in data[0]) {
        html += `<th>${key}</th>`;
      }
      html += "</tr></thead><tbody>";

      data.forEach(row => {
        html += "<tr>";
        for (let key in row) {
          let value = row[key];

          // ★ URLをリンク化
          if (typeof value === "string" && value.match(/^https?:\/\//)) {
            value = `<a href="${value}" target="_blank" rel="noopener noreferrer">${value}</a>`;
          }

          html += `<td>${value}</td>`;
        }
        html += "</tr>";
      });

      html += "</tbody></table>";
      section.innerHTML = html;
    },
    error: function(err) {
      const section = document.querySelector("main section");
      section.innerHTML = `<p>CSVの読み込みに失敗しました: ${err.message}</p>`;
    }
  });
}