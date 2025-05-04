import { IonButton } from "@ionic/core/components/ion-button";
import { IonToast } from "@ionic/core/components/ion-toast";
import { IonList } from "@ionic/core/components/ion-list";
import { IonModal } from "@ionic/core/components/ion-modal";
function sayHI(name: string) {
  console.log("Hello, " + name);
}
sayHI("World");

let baseUrl = "https://dae-mobile-assignment.hkit.cc/api";

let refreshButton =
  document.querySelector<HTMLIonButtonElement>("#refreshButton")!;
refreshButton.addEventListener("click", loadItems);

declare var loginModal: IonModal;
declare var errorToast: IonToast;

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
  duration_minutes: string;
  instructor: string;
  created_at: string;
  updated_at: string;
  category: string;
  description: string;
  practice: string;
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
  poseList.textContent = "";
  poseList.appendChild(skeletonItem.cloneNode(true));
  poseList.appendChild(skeletonItem.cloneNode(true));
  poseList.appendChild(skeletonItem.cloneNode(true));
  let params = new URLSearchParams();
  params.set("page", page.toString());
  let res = await fetch(`${baseUrl}/yoga-poses?${params}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  let json = (await res.json()) as YogaPoseResult;
  if (json.error) {
    errorToast.message = json.error;
    errorToast.present();
    poseList.textContent = "";
    return;
  }
  errorToast.dismiss();

  let maxPage = Math.ceil(json.pagination.total / json.pagination.limit);

  prevPageButton.hidden = json.pagination.page <= 1;
  nextPageButton.hidden = json.pagination.page >= maxPage;

  //  正確定義 item 陣列
  let items: YogaPose[] = json.items; // 這裡修正為正確的資料層次
  console.log("items:", items);

  // 假設你從 API 獲得回應，使用 YogaPoseResult 來接收
  // const yogaPoseResult: YogaPoseResult = {
  //   error: "", // 沒有錯誤
  //   items: [
  //     {
  //       id: 26,
  //       tags: ["休息式", "整合練習成果", "深度休息", "更新"],
  //       sanskrit_name: "Savasana",
  //       difficulty: "beginner",
  //       duration_minutes: 10,
  //       instructor: "張美玲",
  //       created_at: "2025-04-16 05:12:03",
  //       updated_at: "2025-04-20 09:43:13",
  //       title: "屍式",
  //       description:
  //         "一個放鬆姿勢，讓身體能夠整合練習成果，同時促進深度休息和更新。",
  //       category: "休息式",
  //       image_url:
  //         "https://cc.tvbs.com.tw/img/program/_data/i/upload/2019/10/24/20191024112019-74665b2d-me.jpg",
  //       video_url: "https://www.youtube.com/watch?v=Zn8frjdsnYQ",
  //       published_at: "2024-03-01",
  //       benefits: ["減輕壓力", "促進深度放鬆", "降低血壓", "改善睡眠品質"],
  //     },
  //     {
  //       id: 29,
  //       tags: ["坐姿式", "冥想", "髖部", "膝蓋", "靈活度", "心靈清明"],
  //       sanskrit_name: "Padmasana",
  //       difficulty: "advanced",
  //       duration_minutes: 10,
  //       instructor: "田中幸子",
  //       created_at: "2025-04-16 05:12:03",
  //       updated_at: "2025-04-20 09:43:13",
  //       title: "蓮花式",
  //       description:
  //         "一個冥想坐姿，需要髖部和膝蓋的靈活度，同時促進心靈清明。",
  //       category: "坐姿式",
  //       image_url:
  //         "https://theme.npm.edu.tw/3d/att/collection/04001032/17009589.jpg",
  //       video_url: "https://www.youtube.com/watch?v=Cnq4LojdhYQ",
  //       published_at: "2024-02-25",
  //       benefits: [
  //         "提升冥想專注力",
  //         "打開髖部",
  //         "平靜神經系統",
  //         "促進良好姿勢",
  //       ],
  //     },
  //     {
  //       id: 22,
  //       tags: ["開髖式", "髖部", "下背部", "伸展大腿"],
  //       sanskrit_name: "Eka Pada Rajakapotasana",
  //       difficulty: "intermediate",
  //       duration_minutes: 5,
  //       instructor: "吳雅琪",
  //       created_at: "2025-04-16 05:12:01",
  //       updated_at: "2025-04-20 09:43:13",
  //       title: "鴿子式",
  //       description:
  //         "一個開髖式姿勢，可以放鬆髖部和下背部的緊張，同時伸展大腿。",
  //       category: "開髖式",
  //       image_url: "https://i.ytimg.com/vi/nYSq6XT8VTU/maxresdefault.jpg",
  //       video_url: "https://www.youtube.com/watch?v=0OPlqNF2OWY",
  //       published_at: "2024-02-20",
  //       benefits: ["打開髖關節", "舒緩下背部緊張", "伸展大腿", "平靜心神"],
  //     },
  //   ],
  //   pagination: {
  //     page: 1,
  //     limit: 3,
  //     total: 10,
  //   },
  // };

  // 這個結構可以幫助你將 API 返回的資料整齊地處理，同時記錄分頁資料

  console.log("items:", items);

  let bookmarkedItemIds = await autoRetryGetBookmarks();

  poseList.textContent = "";
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
