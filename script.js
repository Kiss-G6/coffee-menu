// 等待页面全部DOM加载完成再执行代码
document.addEventListener('DOMContentLoaded', async function(){
  // 存放全部咖啡 & 原始备份
  let coffeeList = [];
  let originList = [];

  // DOM元素
  const listWrap = document.querySelector('.coffee-wrap');
  const searchInput = document.querySelector('#search');
  const popupMask = document.querySelector('.popup-mask');

  if(!listWrap){
    console.error("找不到 .coffee-wrap");
    return;
  }

  // 初始化加载数据
  async function loadCoffeeData() {
    const res = await fetch('./data/coffee.json');
    originList = await res.json();
    coffeeList = [...originList];
    renderList();
  }

  // 渲染咖啡卡片
  function renderList() {
    listWrap.innerHTML = '';
    coffeeList.forEach(item => {
      const card = document.createElement('div');
      card.className = 'coffee-card';
      card.innerHTML = `
        <img src="${item.cover}" alt="${item.name}">
        <div class="card-body">
          <div class="card-name">${item.name}</div>
          <div class="card-flavor">${item.flavor}</div>
        </div>
      `;
      // 点击打开弹窗
      card.onclick = () => openPopup(item);
      listWrap.appendChild(card);
    })
  }

  // 打开详情弹窗
  function openPopup(coffee) {
    popupMask.innerHTML = `
      <div class="popup">
        <img src="${coffee.cover}">
        <div class="pop-content">
          <h2>${coffee.name}</h2>
          <div>难度: ${'★'.repeat(coffee.difficulty)}${'☆'.repeat(5 - coffee.difficulty)}</div>

          <div class="pop-section">
            <h4>风味描述</h4>
            <p>${coffee.flavor}</p>
          </div>
          <div class="pop-section">
            <h4>所需材料</h4>
            <p>${coffee.material}</p>
          </div>
          <div class="pop-section">
            <h4>制作步骤</h4>
            <p style="white-space:pre-line;">${coffee.steps}</p>
          </div>

          <div class="btn-group">
            <button class="order-btn">我要点这杯！</button>
            <button class="close-btn">关闭</button>
          </div>
        </div>
      </div>
    `;
    popupMask.style.display = 'block';

    // ✅ 按钮事件写在这里！弹窗渲染完成再绑定
    popupMask.querySelector('.close-btn').onclick = closePopup;
    // 点我想要按钮（复制文字）
    popupMask.querySelector('.order-btn').onclick = function(){
      const text = `想要一杯【${coffee.name}】`;
      navigator.clipboard.writeText(text);
      alert('预约文字已复制！');
    }
  }

  // 关闭弹窗
  function closePopup() {
    popupMask.style.display = 'none';
  }

  // ========== 搜索功能 ==========
  if(searchInput){
    searchInput.oninput = function(){
      const keyword = this.value.trim().toLowerCase();
      if(!keyword){
        coffeeList = [...originList];
        renderList();
        return;
      }
      coffeeList = originList.filter(item=>{
        return item.name.toLowerCase().includes(keyword)
            || item.flavor.toLowerCase().includes(keyword)
            || item.material.toLowerCase().includes(keyword);
      })
      renderList();
    }
  }

  // 页面启动
  loadCoffeeData();
})