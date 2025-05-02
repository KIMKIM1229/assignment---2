let baseUrl = "https://example.com/api";
let token = "123456";

console.log("loading iteams...");

let items = [1, 2, 3];

function loaditems() {
  fetch(`${baseUrl}/bookmarks`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => res.json())
    .then((json) => {
      console.log("items:", json.item_ids);
    });
}

console.log("items:", items);
