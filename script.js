document.addEventListener('DOMContentLoaded', async function(){
  // ========== 页面容器 ==========
  const homePage = document.querySelector('.home-page');
  const drinkPage = document.querySelector('.drink-page');
  const foodPage = document.querySelector('.food-page');

  // ==========【全局统一选购清单：饮品+小吃合并存储】==========
  let selectedList = []; 

  // ========== 饮品数据 ==========
  let coffeeList = [];
  let originCoffeeList = [];
  let currentCoffeeCategory = "全部";
  // 固定饮品分类
  const coffeeCategoryList = ["全部","意式","特调","无咖"];

  // ========== 美食数据 ==========
  let foodList = [];
  let originFoodList = [];
  let currentFoodCategory = "全部";
  // 固定美食分类
  const foodCategoryList = ["全部","肉肉","菜菜","汤汤"];

  // 饮品DOM
  const listWrap = document.querySelector('.coffee-wrap');
  const searchDrink = document.querySelector('#search-drink');
  const popupMask = document.querySelector('.popup-mask');
  const categoryWrap = document.querySelector('.category-wrap');

  // 美食DOM
  const foodWrap = document.querySelector('.food-wrap');
  const searchFood = document.querySelector('#search-food');
  const foodPopupMask = document.querySelector('.food-popup-mask');
  const foodCategoryWrap = document.querySelector('.food-category-wrap');


  // ===================== 首页跳转逻辑 =====================
  document.querySelectorAll('.home-entry-card').forEach(card=>{
    card.onclick = ()=>{
      const target = card.dataset.target;
      homePage.style.display = 'none';
      if(target === "drink"){
        drinkPage.style.display = 'block';
        foodPage.style.display = 'none';
        loadCoffeeData();
      }else if(target === "food"){
        drinkPage.style.display = 'none';
        foodPage.style.display = 'block';
        loadFoodData();
      }
    }
  })

  // 返回首页【不再清空清单】，保留已选商品
  document.querySelectorAll('.back-btn').forEach(btn=>{
    btn.onclick = ()=>{
      homePage.style.display = 'block';
      drinkPage.style.display = 'none';
      foodPage.style.display = 'none';
    }
  })


  // ===================== 饮品模块 =====================
  async function loadCoffeeData() {
    const res = await fetch('./data/coffee.json');
    originCoffeeList = await res.json();
    coffeeList = [...originCoffeeList];
    renderCoffeeCategory();
    renderCoffeeList();
    createDrinkBottomBar();
  }

  // 创建饮品底部栏
  function createDrinkBottomBar(){
    let bar = document.querySelector(".drink-bottom-bar");
    if(bar) return;
    bar = document.createElement("div");
    bar.className = "bottom-submit-bar drink-bottom-bar";
    bar.innerHTML = `
      <button class="clear-btn">全部清空</button>
      <button class="submit-btn">就这些啦！</button>
    `
    drinkPage.appendChild(bar);

    bar.querySelector('.clear-btn').onclick = ()=>{
      selectedList = [];
      renderCoffeeList();
    }
    bar.querySelector('.submit-btn').onclick = submitAllOrder;
  }

  function renderCoffeeCategory() {
    categoryWrap.innerHTML = "";
    coffeeCategoryList.forEach(cat=>{
      const btn = document.createElement("button");
      btn.className = currentCoffeeCategory === cat ? "cat-btn active" : "cat-btn";
      btn.innerText = cat;
      btn.onclick = ()=>{
        currentCoffeeCategory = cat;
        renderCoffeeCategory();
        renderCoffeeList();
      }
      categoryWrap.appendChild(btn);
    })
  }

  function renderCoffeeList(keyword="") {
    listWrap.innerHTML = "";
    let arr = [...originCoffeeList];
    if(currentCoffeeCategory !== "全部") arr = arr.filter(i=>i.category === currentCoffeeCategory);
    if(keyword){
      const kw = keyword.toLowerCase();
      arr = arr.filter(i=>i.name.toLowerCase().includes(kw) || i.flavor.toLowerCase().includes(kw))
    }
    arr.forEach(item=>{
      const card = document.createElement('div');
      card.className = "coffee-card";
      // 判断全局清单内是否存在该商品
      if(selectedList.some(s=>s.name === item.name)) card.classList.add("selected");
      card.innerHTML = `
        <img src="${item.cover}">
        <div class="card-text">
          <h3>${item.name}</h3>
          <p>${item.flavor}</p>
        </div>
      `;
      card.onclick = ()=>openDrinkPopup(item);
      listWrap.appendChild(card);
    })
  }

  function openDrinkPopup(item){
    popupMask.style.display = "block";
    const selectedItem = selectedList.find(s=>s.name === item.name);
    const isSelected = !!selectedItem;
    const btnText = isSelected ? "还是不要了" : "我要我要";
    const btnClass = isSelected ? "select-item-btn cancel" : "select-item-btn";

    popupMask.innerHTML = `
      <div class="popup">
        <img src="${item.cover}">
        <div class="pop-content">
          <h2>${item.name}</h2>
          <div class="pop-section">
            <h4>风味描述</h4>
            <p>${item.flavor}</p>
          </div>
          <div class="pop-section">
            <h4>原料清单</h4>
            <p>${item.material}</p>
          </div>
          <div class="pop-section">
            <h4>制作步骤</h4>
            <p style="white-space:pre-line">${item.steps}</p>
          </div>
          <div class="pop-section">
            <h4>备注</h4>
            <p>${item.note}</p>
          </div>
          <button class="${btnClass} add-item-btn">${btnText}</button>
          <button class="close-btn">关闭</button>
        </div>
      </div>
    `;
    popupMask.querySelector('.add-item-btn').onclick = ()=>{
      if(isSelected){
        // 删除
        selectedList = selectedList.filter(s=>s.name !== item.name);
      }else{
        // 添加，标记品类
        selectedList.push({...item, type:"饮品"});
      }
      popupMask.style.display = "none";
      renderCoffeeList();
    }
    popupMask.querySelector('.close-btn').onclick = ()=>{
      popupMask.style.display = "none";
    }
  }

  searchDrink.oninput = (e)=>{
    renderCoffeeList(e.target.value)
  }


  // ===================== 美食模块 =====================
  async function loadFoodData() {
    const res = await fetch('./data/food.json');
    originFoodList = await res.json();
    foodList = [...originFoodList];
    renderFoodCategory();
    renderFoodList();
    createFoodBottomBar();
  }

  function renderFoodCategory() {
    foodCategoryWrap.innerHTML = "";
    foodCategoryList.forEach(cat=>{
      const btn = document.createElement("button");
      btn.className = currentFoodCategory === cat ? "cat-btn active" : "cat-btn";
      btn.innerText = cat;
      btn.onclick = ()=>{
        currentFoodCategory = cat;
        renderFoodCategory();
        renderFoodList();
      }
      foodCategoryWrap.appendChild(btn);
    })
  }

  //美食底部栏
  function createFoodBottomBar(){
    let bar = document.querySelector(".food-bottom-bar");
    if(bar) return;
    bar = document.createElement("div");
    bar.className = "bottom-submit-bar food-bottom-bar";
    bar.innerHTML = `
      <button class="clear-btn">全部清空</button>
      <button class="submit-btn">就这些啦！</button>
    `
    foodPage.appendChild(bar);

    bar.querySelector('.clear-btn').onclick = ()=>{
      selectedList = [];
      renderFoodList();
    }
    bar.querySelector('.submit-btn').onclick = submitAllOrder;
  }

  function renderFoodList(keyword="") {
    foodWrap.innerHTML = "";
    let arr = [...originFoodList];
    if(currentFoodCategory !== "全部") arr = arr.filter(i=>i.category === currentFoodCategory);
    if(keyword){
      const kw = keyword.toLowerCase();
      arr = arr.filter(i=>i.name.toLowerCase().includes(kw) || i.flavor.toLowerCase().includes(kw))
    }
    arr.forEach(item=>{
      const card = document.createElement('div');
      card.className = "coffee-card";
      if(selectedList.some(s=>s.name === item.name)) card.classList.add("selected");
      card.innerHTML = `
        <img src="${item.cover}">
        <div class="card-text">
          <h3>${item.name}</h3>
          <p>${item.flavor}</p>
        </div>
      `;
      card.onclick = ()=>openFoodPopup(item);
      foodWrap.appendChild(card);
    })
  }

  function openFoodPopup(item){
    foodPopupMask.style.display = "block";
    const selectedItem = selectedList.find(s=>s.name === item.name);
    const isSelected = !!selectedItem;
    const btnText = isSelected ? "还是不要了" : "我要我要";
    const btnClass = isSelected ? "select-item-btn cancel" : "select-item-btn";

    foodPopupMask.innerHTML = `
      <div class="popup">
        <img src="${item.cover}">
        <div class="pop-content">
          <h2>${item.name}</h2>
          <div class="pop-section">
            <h4>风味描述</h4>
            <p>${item.flavor}</p>
          </div>
          <div class="pop-section">
            <h4>原料清单</h4>
            <p>${item.material}</p>
          </div>
          <div class="pop-section">
            <h4>制作步骤</h4>
            <p style="white-space:pre-line">${item.steps}</p>
          </div>
          <div class="pop-section">
            <h4>备注</h4>
            <p>${item.note}</p>
          </div>
          <button class="${btnClass} add-item-btn">${btnText}</button>
          <button class="close-btn">关闭</button>
        </div>
      </div>
    `;
    foodPopupMask.querySelector('.add-item-btn').onclick = ()=>{
      if(isSelected){
        selectedList = selectedList.filter(s=>s.name !== item.name);
      }else{
        selectedList.push({...item, type:"美食"});
      }
      foodPopupMask.style.display = "none";
      renderFoodList();
    }
    foodPopupMask.querySelector('.close-btn').onclick = ()=>{
      foodPopupMask.style.display = "none";
    }
  }

  searchFood.oninput = (e)=>{
    renderFoodList(e.target.value)
  }

  // =====================【统一汇总提交函数】饮品+美食合并输出 =====================
  function submitAllOrder(){
    if(selectedList.length === 0){
      alert("还没有挑选任何东西哦！");
      return;
    }
    let text = "🛒 想要清单：\n";
    selectedList.forEach(good=>{
      text += `·【${good.type}】${good.name}\n`;
    })
    navigator.clipboard.writeText(text);
    alert(`✅ 清单已复制！粘贴发送即可\n\n${text}`);
  }

})