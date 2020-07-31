

export class FilterList {

  private el: HTMLElement;
  private filterList: string[];
  private children: HTMLElement[] = [];

  constructor(
    parent: HTMLElement,
    trackers: string[],
    toggleCb: () => void
  ) {
    const _self = this;
    let active = false;

    trackers = trackers.concat("other");
    _self.filterList = [];

    _self.el = document.createElement("div");
    _self.el.className = "filterlist";

    const inputEl = document.createElement("div");
    inputEl.className = 'filterlist-input';
    inputEl.innerText = "filter nodes...";
    _self.el.appendChild(inputEl);

    const dropdownMenuEl = document.createElement("div");
    dropdownMenuEl.className = 'filterlist-dropdown';
    _self.el.appendChild(dropdownMenuEl)

    for (const t of trackers) {
      const chEl = document.createElement("div");
      chEl.setAttribute("tabindex", "0");
      chEl.setAttribute("filter-type", t);
      chEl.className = 'filterlist-toggle';

      const checkbox = document.createElement("div");
      checkbox.className = "checkbox on"

      const label = document.createElement("span");
      label.className = "label";
      label.innerText = t;

      chEl.appendChild(checkbox);
      chEl.appendChild(label);

      chEl.onclick = (evt) => {
        evt.stopPropagation();
        chEl.focus();
        if (checkbox.className === 'checkbox off') {
          if (evt.shiftKey) {
            _self.filterList = trackers.concat();
            for (const ch of _self.children) {
              (ch.childNodes[0] as HTMLElement).className = 'checkbox off';
            }
          }
          _self.filterList.splice(_self.filterList.indexOf(t), 1);
          checkbox.className = "checkbox on";
        } else {
          if (evt.shiftKey) {
            _self.filterList = [];
            for (const ch of _self.children) {
              (ch.childNodes[0] as HTMLElement).className = 'checkbox on';
            }
          }
          _self.filterList.push(t);
          checkbox.className = "checkbox off";
        }
        toggleCb();
      }
      _self.children.push(chEl);
    }


    _self.el.onclick = () => {
      active = !active;
      if (active) {
        for (const ch of _self.children) {
          dropdownMenuEl.appendChild(ch);
        }
      } else {
        for (const ch of _self.children) {
          dropdownMenuEl.removeChild(ch);
        }
      }
    }

    parent.appendChild(_self.el);
  }

  getCurrentFilter = () => {
    return this.filterList;
  }
}