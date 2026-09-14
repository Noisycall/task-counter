"use strict";
import "./style.css";
// @ts-ignore
//For Service Worker Auto Update
import { registerSW } from "virtual:pwa-register";
registerSW({ immediate: true });

const counterNumber = document.getElementById("counter-number")!;
const setCounterDisplay = (val: number) => {
  counterNumber.innerText = String(val);
};
const setCounterNumber = (val: number) => {
  setCounterDisplay(val);
  const tr = db.transaction("points", "readwrite");
  const store = tr.objectStore("points");
  store.put({ val: val, id: "main" });
  tr.commit();
};
const getCounterNumber = async (): Promise<number> => {
  const tr = db.transaction("points", "readonly");
  const store = tr.objectStore("points");
  return new Promise((res) => {
    const val = store.get("main");
    val.onsuccess = () => {
      res(val.result.val);
    };
  });
};
const changeCounter = async (change: number): Promise<number> => {
  let num = await getCounterNumber();
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

export interface Task {
  id: number;
  description: string;
  criteria: string;
  points: number;
}
// //Task subtracts points
// const tasks: Array<Task> = [
//   {
//     id: 1,
//     description: "Descr",
//     criteria: "Criteria",
//     points: 5,
//   },
//   {
//     id: 2,
//     description: "Descr",
//     criteria: "Criteria",
//     points: 3,
//   },
// ];

const addTask = (taskData: FormData) => {
  const task = Object.fromEntries(taskData.entries()) as unknown as Task;
  task.points = parseInt(String(task.points));
  console.debug("task is", task);
  let request = addTasksToIndexDB(db, [task]);
  request.onsuccess = () => {
    console.debug("Task List after adding");
    generateTaskList(request.result);
  };
  return false;
};
//@ts-ignore
window.addTask = addTask;
const addTasksToIndexDB = (db: IDBDatabase, tasks: Array<Task>) => {
  const transaction = db.transaction("tasks", "readwrite");
  const store = transaction.objectStore("tasks");
  tasks.forEach((task) => {
    store.put(task);
  });
  const vals = store.getAll();
  transaction.commit();
  return vals;
};

const generateTaskList = (tasks: Array<Task>) => {
  const taskList = document.getElementById("task-list")!;
  taskList.innerHTML = "";
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
            <button class="delete-button">delete</button>
          </div>`;
    let elem = document.createElement("div");
    elem.innerHTML = node;
    taskList.append(elem.firstElementChild!);
  }
};

//IndexDB
// indexedDB.deleteDatabase("tasks");
let db: IDBDatabase;
const tasksDb = indexedDB.open("tasks", 1);
tasksDb.onsuccess = () => {
  db = tasksDb.result;
  if (db.objectStoreNames.contains("tasks")) {
    const transaction = db.transaction(["tasks", "points"], "readonly");
    const tasks = transaction.objectStore("tasks");
    const points = transaction.objectStore("points");
    const request = tasks.getAll();
    request.onsuccess = () => {
      generateTaskList(request.result);
    };
    const pointsReq = points.get("main");
    pointsReq.onsuccess = () => {
      //@ts-ignore
      console.debug("Initial Val was:", pointsReq.result);
      //@ts-ignore
      setCounterDisplay(pointsReq.result.val);
    };
    transaction.commit();
  }
};
//@ts-ignore
tasksDb.onupgradeneeded = (ev) => {
  // @ts-ignore
  db = ev.target.result;
  db.createObjectStore("tasks", { keyPath: "id", autoIncrement: true });
  const st = db.createObjectStore("points", {
    keyPath: "id",
  });
  st.put({ val: 0, id: "main" });

  console.debug("DB created v1", db);
};
