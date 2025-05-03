import { IonButton } from "@ionic/core/components/ion-button";
import { IonToast } from "@ionic/core/components/ion-toast";
import { IonList } from "@ionic/core/components/ion-list";
import { IonModal } from "@ionic/core/components/ion-modal";

let baseUrl = "https://dae-mobile-assignment.hkit.cc/api";

// let items = [1, 2, 3]

declare var refreshButton: IonButton;
refreshButton.addEventListener("click", loadItems);

declare var loginModal: IonModal;
declare var errorToast: IonToast;

declare var courseList: IonList;

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

let skeletonItem = courseList.querySelector(".skeleton-item")!;
skeletonItem.remove();

let itemCardTemplate = courseList.querySelector(".item-card")!;
itemCardTemplate.remove();

let token = localStorage.getItem("token");

async function loadItems() {
  console.log("loading items...");
  courseList.textContent = "";
  courseList.appendChild(skeletonItem.cloneNode(true));
  courseList.appendChild(skeletonItem.cloneNode(true));
  courseList.appendChild(skeletonItem.cloneNode(true));
  let params = new URLSearchParams();
  params.set("page", page.toString());
  let res = await fetch(`${baseUrl}/yoga-poses?${params}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  let json = (await res.json()) as Result;
  if (json.error) {
    errorToast.message = json.error;
    errorToast.present();
    courseList.textContent = "";
    return;
  }
  errorToast.dismiss();

  let maxPage = Math.ceil(json.pagination.total / json.pagination.limit);

  prevPageButton.hidden = json.pagination.page <= 1;
  nextPageButton.hidden = json.pagination.page >= maxPage;

  //  正確定義 item 陣列
  let items: Item[] = json.items;
  console.log("items:", items);

  // 第一步：定義介面類型（搬到最頂）
  // 第1步：定義 YogaPose 資料結構
  export interface YogaPose {
    id: number;
    title: string;
    level: string;
    category: string;
    type: string;
    bodypart: string;
    benefits: string;
    caution: string;
    practice: string;
    tags: string[];
    imageUrl: string;
    videoUrl: string;
  }

  // 第2步：定義 Result 資料結構，包含 YogaPose 陣列同分頁資料
  type YogaPoseResult = {
    error: string; // 可能係 API 回傳錯誤訊息
    items: YogaPose[]; // 用 YogaPose 陣列包裝所有瑜伽動作資料
    pagination: {
      page: number; // 當前頁碼
      limit: number; // 每頁顯示數量
      total: number; // 總數量
    };
  };

  // 假設你從 API 獲得回應，使用 YogaPoseResult 來接收
  const yogaPoseResult: YogaPoseResult = {
    error: "", // 沒有錯誤
    items: [
      // 這裏放 YogaPose 資料
      {
        id: 1,
        title: "下犬式",
        level: "初階",
        category: "拉伸",
        type: "拉伸",
        bodypart: "腿部",
        benefits: "伸展腿部肌肉",
        caution: "避免膝蓋疼痛時練習",
        practice: "雙手雙腳撐地，臀部抬高，呈倒V字形。",
        tags: ["腿部", "背部", "伸展"],
        imageUrl: "https://example.com/downward-dog.jpg",
        videoUrl: "https://youtube.com/example",
      },
      {
        id: 2,
        title: "英雄式",
        level: "中階",
        category: "強化",
        type: "強化",
        bodypart: "腿部",
        benefits: "增強大腿肌肉力量",
        caution: "膝蓋有問題時應避免",
        practice: "雙膝跪地，臀部與膝蓋成一線，背部保持直立。",
        tags: ["腿部", "強化", "核心"],
        imageUrl: "https://example.com/hero-pose.jpg",
        videoUrl: "https://youtube.com/example2",
      },
      // 其他 YogaPose 物件 ...
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 100,
    },
  };

  // 這個結構可以幫助你將 API 返回的資料整齊地處理，同時記錄分頁資料

  let items = json.items as Item[];
  console.log("items:", items);

  let bookmarkedItemIds = await autoRetryGetBookmarks();

  courseList.textContent = "";
  for (let item of items) {
    let card = itemCardTemplate.cloneNode(true) as HTMLIonCardElement;

    card.querySelector(".item-title")!.textContent = item.title;
    card.querySelector(".item-subtitle")!.textContent =
      item.components.join(", ") + " | " + item.license;

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
    courseList.appendChild(card);
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
  // TODO load bookmarks
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
