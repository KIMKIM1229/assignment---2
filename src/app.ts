import { IonButton } from "@ionic/core/components/ion-button";
import { IonToast } from "@ionic/core/components/ion-toast";
import { IonList } from "@ionic/core/components/ion-list";
import { IonModal } from "@ionic/core/components/ion-modal";
import { IonSelect } from "@ionic/core/components/ion-select";
import { IonSearchbar } from "@ionic/core/components/ion-searchbar";

function sayHI(name: string) {
  console.log("Hello, " + name);
}
sayHI("World");

let baseUrl = "https://dae-mobile-assignment.hkit.cc/api";

let refreshButton =
  document.querySelector<HTMLIonButtonElement>("#refreshButton")!;
refreshButton.addEventListener("click", loadItems);

declare var categorySelect: IonSelect;

declare var difficultySelect: IonSelect;

declare var loginModal: IonModal;
declare var errorToast: IonToast;
declare var searchBar: IonSearchbar;

declare var poseList: IonList;

let page = 1;

declare var prevPageButton: IonButton;
prevPageButton.addEventListener("click", () => {
  page--;
  loadItems();
});

declare var nextPageButton: IonButton;
nextPageButton.addEventListener("click", () => {
  page++;
  loadItems();
});

declare var loadMoreButton: IonButton;
loadMoreButton.addEventListener("click", () => {
  page++;
  loadItems();
});

let skeletonItem = poseList.querySelector(".skeleton-item")!;
skeletonItem.remove();

let itemCardTemplate = poseList.querySelector(".item-card")!;
itemCardTemplate.remove();

let token = localStorage.getItem("token");

// 第一步：定義介面類型（搬到最頂）
// 第1步：定義 YogaPose 資料結構
interface YogaPose {
  id: number;
  title: string;
  sanskrit_name: string;
  difficulty: string;
  duration_minutes: number;
  instructor: string;
  created_at: string;
  updated_at: string;
  category: string;
  description: string;
  tags: string[];
  image_url: string;
  video_url: string;
  published_at: string;
  benefits: string[];
}

// 第2步：定義 Result 資料結構，包含 YogaPose 陣列同分頁資料
interface YogaPoseResult {
  error: string; // 可能係 API 回傳錯誤訊息
  items: YogaPose[]; // 用 YogaPose 陣列包裝所有瑜伽動作資料
  pagination: {
    page: number; // 當前頁碼
    limit: number; // 每頁顯示數量
    total: number; // 總數量
  };
}

async function loadItems() {
  console.log("loading items...");
  if (page === 1) {
    poseList.textContent = "";
  }
  poseList.appendChild(skeletonItem.cloneNode(true));
  poseList.appendChild(skeletonItem.cloneNode(true));
  poseList.appendChild(skeletonItem.cloneNode(true));
  let params = new URLSearchParams();
  params.set("page", page.toString());
  params.set("category", categorySelect.value || "");
  params.set("difficulty", difficultySelect.value || "");
  params.set("search", searchBar.value || "");
  let res = await fetch(`${baseUrl}/yoga-poses?${params}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  let json = (await res.json()) as YogaPoseResult;
  if (json.error) {
    if (json.error.includes("Error injected for testing purposes")) {
      errorToast.message = "網絡不穩，請刷新頁面";
    } else {
      errorToast.message = json.error;
    }
    errorToast.present();
    if (page === 1) {
      poseList.textContent = "";
    }
    return;
  }
  errorToast.dismiss();

  let maxPage = Math.ceil(json.pagination.total / json.pagination.limit);

  prevPageButton.hidden = json.pagination.page <= 1;
  nextPageButton.hidden = json.pagination.page >= maxPage;
  loadMoreButton.hidden = json.pagination.page >= maxPage;

  let items: YogaPose[] = json.items;
  console.log("items:", items);

  let bookmarkedItemIds = await autoRetryGetBookmarks();

  if (page === 1) {
    poseList.textContent = "";
  }

  const skeletonItems = poseList.querySelectorAll(".skeleton-item");
  skeletonItems.forEach(item => item.remove());

  for (let item of items) {
    let card = itemCardTemplate.cloneNode(true) as HTMLIonCardElement;

    card.querySelector(".item-title")!.textContent = item.title;
    card.querySelector(".item-subtitle")!.textContent =
      item.benefits.join(", ") + " | " + item.difficulty;

    let favoriteBtn = card.querySelector(".favorite-btn")!;
    let favoriteIcon = favoriteBtn.querySelector("ion-icon")!;
    favoriteIcon.name = bookmarkedItemIds.includes(item.id)
      ? "star"
      : "star-outline";
    favoriteBtn.addEventListener("click", async () => {
      if (!token) {
        loginModal.present();
        return;
      }

      try {
        await bookmarkItem(item.id);
        favoriteIcon.name = "star";
        errorToast.dismiss();
      } catch (error) {
        errorToast.message = String(error);
        errorToast.present();
      }
    });

    card.querySelector(".item-details")!.textContent = item.description;
    card.querySelector(
      ".item-date"
    )!.textContent = `日期: ${item.published_at}`;

    card.querySelector(
      ".item-instructor"
    )!.textContent = `導師: ${item.instructor}`;

    card.querySelector(
      ".item-duration_minutes"
    )!.textContent = `時長(分鐘): ${item.duration_minutes}`;

    card.querySelector(
      ".item-created_at"
    )!.textContent = `Created at: ${item.created_at}`;

    card.querySelector(
      ".item-updated_at"
    )!.textContent = `Updated at: ${item.updated_at}`;

    card.querySelector<HTMLImageElement>(".course-image")!.src = item.image_url;

    let iframe = card.querySelector<HTMLIFrameElement>(
      ".video-container iframe"
    )!;
    let video = card.querySelector<HTMLVideoElement>(".video-container video")!;
    if (item.video_url.includes("youtube.com")) {
      iframe.src = item.video_url.replace("watch?v=", "embed/");
      video.remove();
    } else {
      video.src = item.video_url;
      iframe.remove();
    }

    let tagContainer = card.querySelector<HTMLDivElement>(".tag-container")!;
    let chipTemplate =
      tagContainer.querySelector<HTMLIonChipElement>("ion-chip")!;
    chipTemplate.remove();
    for (let tag of item.tags) {
      let chip = chipTemplate.cloneNode(true) as HTMLIonChipElement;
      chip.textContent = tag;
      chip.dataset.type = tag;
      chip.addEventListener("click", () => {
        // TODO filterByTag(tag)
      });
      tagContainer.appendChild(chip);
    }
    poseList.appendChild(card);
  }
}

loadItems();

declare var usernameInput: HTMLIonInputElement;
declare var passwordInput: HTMLIonInputElement;
declare var loginButton: HTMLIonButtonElement;
declare var registerButton: HTMLIonButtonElement;

loginButton.addEventListener("click", async () => {
  await handleAuth("login");
});

registerButton.addEventListener("click", async () => {
  await handleAuth("signup");
});

async function handleAuth(mode: "signup" | "login") {
  let username = usernameInput.value;
  let password = passwordInput.value;

  let res = await fetch(`${baseUrl}/auth/${mode}`, {
    method: "POST",
    body: JSON.stringify({ username, password }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  let json = await res.json();
  if (json.error) {
    errorToast.message = json.error;
    errorToast.present();
    return;
  }
  errorToast.dismiss();
  token = json.token;
  localStorage.setItem("token", json.token);
  loginModal.dismiss();
  
  // 更新按鈕顯示狀態
  const authButtons = document.getElementById("authButtons");
  const logoutButtons = document.getElementById("logoutButtons");
  if (authButtons && logoutButtons) {
    authButtons.hidden = true;
    logoutButtons.hidden = false;
  }
}

async function bookmarkItem(item_id: number) {
  let res = await fetch(`${baseUrl}/bookmarks/${item_id}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  let json = await res.json();
  if (json.error) {
    throw json.error;
  }
}
async function unBookmarkItem(item_id: number, icon: HTMLIonIconElement) {
  try {
    // TODO call server API
    throw "TODO: call server API";
  } catch (error) {
    errorToast.message = String(error);
    errorToast.present();
  }
}
async function getBookmarks() {
  if (!token) {
    return [];
  }
  let res = await fetch(`${baseUrl}/bookmarks`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  let json = await res.json();
  if (json.error) {
    throw json.error;
  }
  return json.item_ids as number[];
}

async function autoRetryGetBookmarks() {
  let error = null;
  for (let i = 0; i < 3; i++) {
    try {
      let itemIds = await getBookmarks();
      return itemIds;
    } catch (err) {
      error = err;
    }
  }
  throw error;
}

// 檢查登入狀態
async function checkAuth() {
  const token = localStorage.getItem("token") || "";
  console.log("Token from localStorage:", token);
  if (!token) {
    console.log("No token found");
    return false;
  }

  let error = null;
  for (let i = 0; i < 3; i++) {
    try {
      console.log("Checking auth with token:", token.substring(0, 10) + "...");
      const res = await fetch(`${baseUrl}/auth/check`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Auth check status:", res.status);

      if (!res.ok) {
        const text = await res.text();
        console.error("Auth check response:", text);
        errorToast.message = `認證失敗，服務器返回 ${res.status}: ${text}`;
        errorToast.present();
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("username");
          return false;
        }
        continue;
      }

      const json = await res.json();
      console.log("Auth check JSON:", json);
      if (!json.user_id) {
        console.log("Invalid user_id");
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        return false;
      }

      return true;
    } catch (err) {
      error = err;
      console.error("Check auth error, retrying:", err);
    }
  }

  console.error("All retries failed:", error);
  errorToast.message = "認證失敗，請檢查網絡或稍後再試";
  errorToast.present();
  return false;
}

document.addEventListener("DOMContentLoaded", async () => {
  const authButtons = document.getElementById("authButtons");
  const logoutButtons = document.getElementById("logoutButtons");
  const loginButton = document.getElementById("loginButton");
  const registerButton = document.getElementById("registerButton");
  const logoutButton = document.getElementById("logoutButton");

  // 檢查登入狀態
  const isLoggedIn = await checkAuth();
  
  if (authButtons && logoutButtons) {
    if (isLoggedIn) {
      authButtons.style.display = "none";
      logoutButtons.style.display = "block";
    } else {
      authButtons.style.display = "block";
      logoutButtons.style.display = "none";
    }
  }

  // 登出功能
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      window.location.href = "login.html";
    });
  }
});

// 重設按鈕
const resetButton = document.getElementById("resetButton");
if (resetButton) {
  resetButton.addEventListener("click", () => {
    // 重設搜尋欄
    if (searchBar) {
      searchBar.value = "";
    }
    
    // 重設類別選擇
    if (categorySelect) {
      categorySelect.value = "";
    }
    
    // 重設難度選擇
    if (difficultySelect) {
      difficultySelect.value = "";
    }
    
    // 重設頁碼
    page = 1;
    
    // 重新載入項目
    loadItems();
  });
}
