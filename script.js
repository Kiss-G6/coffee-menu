document.addEventListener('DOMContentLoaded', async function(){
  // ========== 预加载全部商品数据（首页全局搜索依赖） ==========
  async function preloadAllData(){
    const coffeeRes = await fetch('./data/coffee.json');
    originCoffeeList = await coffeeRes.json();
    const foodRes = await fetch('./data/food.json');
    originFoodList = await foodRes.json();
  }

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

  // 执行预加载
  preloadAllData();

  // ========== 首页全局搜索功能 ==========
  const homeSearchInput = document.querySelector("#search");
  let globalSearchMask = null;

  function createGlobalSearchMask(){
    if(globalSearchMask) return;
    globalSearchMask = document.createElement('div');
    globalSearchMask.className = "popup-mask";
    document.body.appendChild(globalSearchMask);
    globalSearchMask.style.display = "none";
    globalSearchMask.onclick = function(e){
      if(e.target === globalSearchMask){
        globalSearchMask.classList.remove('show');
      }
    }
  }
  createGlobalSearchMask();

  function globalSearch(keyword){
    if(!keyword.trim()){
      globalSearchMask.classList.remove('show');
      return;
    }
    const kw = keyword.toLowerCase();
    let allGoods = [
      ...originCoffeeList.map(item=>({...item, type:"饮品"})),
      ...originFoodList.map(item=>({...item, type:"美食"}))
    ];
    const result = allGoods.filter(item=>
      item.name.toLowerCase().includes(kw) || item.flavor.toLowerCase().includes(kw)
    );

    if(result.length === 0){
      globalSearchMask.innerHTML = `
      <div class="popup" style="padding:24px;text-align:center">
        <h3>未找到匹配商品</h3>
        <p style="margin:16px 0;color:#888;">尝试其他关键词</p>
        <button class="close-btn">关闭</button>
      </div>`;
    }else{
      let html = `<div class="popup" style="max-height:80vh;overflow-y:auto;padding:16px">
      <h3>🔍 搜索结果（共${result.length}件）</h3><br>`;
      result.forEach(item=>{
        const hasSelect = selectedList.some(s=>s.name === item.name);
        html += `
        <div style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid #eee;cursor:pointer" data-name="${item.name}" data-type="${item.type}">
          <img src="${item.cover}" style="width:80px;aspect-ratio:4/3;object-fit:cover;border-radius:8px;">
          <div>
            <div style="font-weight:bold;">【${item.type}】${item.name}</div>
            <div style="font-size:13px;color:#666;">${item.flavor}</div>
            ${hasSelect ? '<span style="color:green">✅ 已加入清单</span>' : ''}
          </div>
        </div>`;
      })
      html += `<br><button class="close-btn">关闭</button></div>`;
      globalSearchMask.innerHTML = html;

      globalSearchMask.querySelectorAll('[data-name]').forEach(dom=>{
        dom.onclick = ()=>{
          const name = dom.dataset.name;
          const type = dom.dataset.type;
          let targetItem;
          if(type === "饮品"){
            targetItem = originCoffeeList.find(i=>i.name === name);
            globalSearchMask.classList.remove('show');
            openDrinkPopup(targetItem);
          }else{
            targetItem = originFoodList.find(i=>i.name === name);
            globalSearchMask.classList.remove('show');
            openFoodPopup(targetItem);
          }
        }
      })
    }
    globalSearchMask.querySelector('.close-btn').onclick = ()=>{
      globalSearchMask.classList.remove('show');
    }
    globalSearchMask.classList.add('show');
  }

  homeSearchInput.oninput = (e)=>{
    globalSearch(e.target.value);
  }


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
      // 修复：class 修改为 category-item
      btn.className = currentCoffeeCategory === cat ? "category-item active" : "category-item";
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
    popupMask.classList.add('show');
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
        selectedList = selectedList.filter(s=>s.name !== item.name);
      }else{
        selectedList.push({...item, type:"饮品"});
      }
      popupMask.classList.remove('show');
      renderCoffeeList();
    }
    popupMask.querySelector('.close-btn').onclick = ()=>{
      popupMask.classList.remove('show');
    }
  }

  searchDrink.oninput = (e)=>{
    renderCoffeeList(e.target.value)
  }


  // ===================== 美食模块 =====================
  async function loadFoodData() {
    foodList = [...originFoodList];
    renderFoodCategory();
    renderFoodList();
    createFoodBottomBar();
  }

  function renderFoodCategory() {
    foodCategoryWrap.innerHTML = "";
    foodCategoryList.forEach(cat=>{
      const btn = document.createElement("button");
      // 修复：class 修改为 category-item
      btn.className = currentFoodCategory === cat ? "category-item active" : "category-item";
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
    foodPopupMask.classList.add('show');
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
      foodPopupMask.classList.remove('show');
      renderFoodList();
    }
    foodPopupMask.querySelector('.close-btn').onclick = ()=>{
      foodPopupMask.classList.remove('show');
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