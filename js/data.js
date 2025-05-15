import { setupSearch } from './search.js';

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const type = params.get("type");

  const typeMap = {
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

  // 前文読み込み
  fetch("descriptions.json")
    .then(response => response.json())
    .then(descriptions => {
      const descriptionText = descriptions[type];
      if (descriptionText) {
        const descElem = document.getElementById("descriptionText");
        const descSection = document.getElementById("descriptionSection");
        if (descElem && descSection) {
          descElem.textContent = descriptionText;
          descSection.style.display = "block";
        }
      }
    })
    .catch(err => {
      console.warn("前文の読み込みに失敗しました：", err);
    });

  fetchAndDisplayCSV(csvFile);
});

function fetchAndDisplayCSV(filePath) {
  Papa.parse(filePath, {
    skipEmptyLines: true,
    download: true,
    header: true,
    complete: function (results) {
      const data = results.data;
      const tableContainer = document.getElementById("tableContainer");
      if (!tableContainer) {
        console.error("tableContainer が見つかりません。");
        return;
      }

      const headers = data.length > 0 ? Object.keys(data[0]) : [];

      tableContainer.innerHTML = "";

      if (!data || data.length === 0 || headers.length === 0) {
        tableContainer.innerHTML = "<p>CSVデータが見つかりませんでした。</p>";
        return;
      }

      function renderTable(tableData) {
        tableContainer.innerHTML = "";

        const table = document.createElement("table");
        const thead = document.createElement("thead");
        const tbody = document.createElement("tbody");

        const headerRow = document.createElement("tr");
        headers.forEach(key => {
          const th = document.createElement("th");
          th.textContent = key;
          headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        if (tableData.length === 0) {
          const tr = document.createElement("tr");
          const td = document.createElement("td");
          td.textContent = "該当データがありません";
          td.colSpan = headers.length;
          td.style.textAlign = "center";
          td.style.padding = "10px";
          tr.appendChild(td);
          tbody.appendChild(tr);
        } else {
          tableData.forEach(row => {
            const tr = document.createElement("tr");
            headers.forEach(key => {
              const td = document.createElement("td");
              const value = row[key];
              if (typeof value === "string" && value.match(/^https?:\/\//)) {
                const a = document.createElement("a");
                a.href = value;
                a.target = "_blank";
                a.rel = "noopener noreferrer";
                a.textContent = value;
                td.appendChild(a);
              } else {
                td.textContent = value ?? "";
              }
              tr.appendChild(td);
            });
            tbody.appendChild(tr);
          });
        }

        table.appendChild(tbody);
        tableContainer.appendChild(table);

        // コピー機能
        table.querySelectorAll("td, th").forEach(cell => {
          cell.style.cursor = "pointer";
          cell.addEventListener("click", (event) => {
            if (event.target.tagName === "A") return;
            const text = cell.innerText;
            navigator.clipboard.writeText(text).then(() => {
              const toast = document.getElementById("toast");
              toast.textContent = `コピーしました: ${text}`;
              toast.classList.add("show");
              setTimeout(() => toast.classList.remove("show"), 2000);
            });
          });
        });
      }

      // 初期表示＋フィルターUI生成＋検索機能セットアップ
      renderTable(data);
      setupSearch(data, renderTable);
    }
  });
}
