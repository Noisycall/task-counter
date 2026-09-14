"use strict";
import "./style.css";
const counterNumber = document.getElementById("counter-number")!;
const setCounterNumber = (val: number) => {
  counterNumber.innerText = String(val);
};
const getCounterNumber = (): number => {
  return parseInt(counterNumber.innerText);
};
const changeCounter = (change: number): number => {
  let num = getCounterNumber();
  num += change;
  setCounterNumber(num);
  return num;
};

//@ts-ignore
window.changeCounter = changeCounter;

//Set button actions
document.getElementById("incr-button")!.onclick = () => {
  changeCounter(1);
};
document.getElementById("decr-button")!.onclick = () => {
  changeCounter(-1);
};

//Task subtracts points
const tasks = [
  {
    id: 1,
    description: "Descr",
    criteria: "Criteria",
    points: 5,
  },
  {
    id: 2,
    description: "Descr",
    criteria: "Criteria",
    points: 3,
  },
];

const taskList = document.getElementById("task-list")!;
//Generate task list
for (let task of tasks) {
  let node = `<div class="task-item" id="${task.id}">
          <div class="task-text">    
            <div class="task-desc">${task.description}</div>
            <div class="task-criteria">${task.criteria}</div>
          </div>
          <div class="points">
            <input type="number" value="${task.points}"/>
            <button class="point-button" onclick="changeCounter(${-task.points})">complete</button>
          </div>`;
  let elem = document.createElement("div");
  elem.innerHTML = node;
  taskList.append(elem.firstElementChild!);
}

//IndexDB
// indexedDB.deleteDatabase("tasks");
const tasksDb = indexedDB.open("tasks", 1);
tasksDb.onsuccess = () => {
  const db = tasksDb.result;
  const tr = db.transaction("tasks", "readwrite");
  const store = tr.objectStore("tasks");
  tasks.forEach((task) => {
    store.add(task);
  });
  console.debug("Wrote Tasks");
};
//@ts-ignore
tasksDb.onupgradeneeded = (ev) => {
  // @ts-ignore
  const db = ev.target.result;
  console.debug("DB created v1", db);
  db.createObjectStore("tasks", { keyPath: "id" });
};
