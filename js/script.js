document.addEventListener("DOMContentLoaded", function () {
  fetch("updates.json")
    .then(response => response.json())
    .then(data => {
      const container = document.getElementById("update-log");
      data.forEach(item => {
        const li = document.createElement("li");
        li.innerHTML = `<span class="date">${item.date}</span> 
          ${item.link ? `<a href="${item.link}">${item.title}</a>` : item.title}`;
        container.appendChild(li);
      });
    })
    .catch(error => {
      console.error("更新履歴の読み込みに失敗しました:", error);
    });
});