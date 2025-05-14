document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const type = params.get("type");

    const typeMap = {
    sample: "サンプル",
    steel: "製鉄所",
    oil: "製油所",
    ethylene: "エチレンプラント",
    aluminum: "アルミニウム製錬所",
    nonferrous: "その他非鉄金属製錬所",
    cement: "セメント工場",
    paper: "製紙工場",
    auto: "自動車組立工場",
    ship: "造船所",
    rail: "鉄道車両工場",
    engine: "エンジン·タービン組立工場",
    homegas: "電気·ガス·石油機器工場(家庭用)",
    progas: "電気·ガス·石油機器工場(業務用)",
    heavyel: "電機工場(重電)",
    elevator: "電機工場(昇降機)",
    audio: "電機工場(音響)",
    semi: "半導体工場(昭和63年時点)",
    airplane: "飛行機組立工場(昭和17年時点)",
    arsenal: "陸軍造兵廠·海軍工廠(昭和17年時点)",
    alumina: "アルミナ製錬と車扱貨物"
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