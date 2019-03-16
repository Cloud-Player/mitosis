const menuEl = document.querySelector('header');
const menuBtns = menuEl.querySelectorAll('a');
const dropDownEls = menuEl.querySelectorAll('li[dropdown]');
const contentFrame = document.querySelector('.view iframe');

const addEventListener = (el, type, callback) => {
  if (typeof el.values === 'function') {
    for (let node of el.values()) {
      addEventListener(node, type, callback);
    }
  } else {
    el.addEventListener(type, callback);
  }
};

const setMenuEntryActive = (activeLinkEl) => {
  for (let entry of menuEl.querySelectorAll('li')) {
    if (entry.contains(activeLinkEl)) {
      entry.classList.add('active');
    } else {
      entry.classList.remove('active');
    }
  }
};

const openPage = (href) => {
  contentFrame.src = href;
  for (let btn of menuBtns) {
    if (btn.attributes.href && btn.attributes.href.value === href) {
      setMenuEntryActive(btn);
    }
  }
  closeDropDowns();
};

const closeDropDowns = () => {
  const dropDowns = menuEl.querySelectorAll('li[dropdown="open"]');
  for (let entry of dropDowns) {
    if (entry.attributes.dropdown) {
      entry.attributes.dropdown.value = '';
    }
  }
};

const openDropDown = (dropdownEl) => {
  closeDropDowns();
  for (let entry of menuEl.querySelectorAll('li')) {
    debugger;
    if (entry.contains(dropdownEl)) {
      setMenuEntryActive(entry);
      if(entry.attributes.dropdown){
        entry.attributes.dropdown.value = 'open';
      }
    }
  }
};

addEventListener(menuBtns, 'click', (ev) => {
  ev.preventDefault();
  const target = ev.target;
  if (target.attributes.href) {
    ev.stopImmediatePropagation();
    openPage(target.attributes.href.value);
  }
});

addEventListener(dropDownEls, 'click', (ev) => {
  ev.preventDefault();
  ev.stopImmediatePropagation();
  console.log(ev.target);
  openDropDown(ev.target);
});

addEventListener(menuEl, 'click', (ev) => {
  if(!ev.target.attributes.dropdown){
    closeDropDowns();
  }
});

const initialPage = menuEl.querySelector('a[initial-page]') || menuEl.querySelector('a');
openPage(initialPage.attributes.href.value);
