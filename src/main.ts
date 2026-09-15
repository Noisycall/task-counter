"use strict";
import "./style.css";
// @ts-ignore
//For Service Worker Auto Update
import { registerSW } from "virtual:pwa-register";
registerSW({ immediate: true });

//Names
const TASK_STORE = "tasks";
const POINTS_STORE = "points";
const MAIN_POINTS_KEY = "main";
const counterNumber = document.getElementById("counter-number")!;
const setCounterDisplay = (val: number) => {
  counterNumber.innerText = String(val);
};

const setCounterNumber = (val: number) => {
  setCounterDisplay(val);
  const tr = db.transaction(POINTS_STORE, "readwrite");
  const store = tr.objectStore(POINTS_STORE);
  store.put({ val: val, id: MAIN_POINTS_KEY });
  tr.commit();
};
const getCounterNumber = async (): Promise<number> => {
  const tr = db.transaction(POINTS_STORE, "readonly");
  const store = tr.objectStore(POINTS_STORE);
  return new Promise((res) => {
    const val = store.get(MAIN_POINTS_KEY);
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
  const transaction = db.transaction(TASK_STORE, "readwrite");
  const store = transaction.objectStore(TASK_STORE);
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
            <button class="delete-button" onclick="deleteTask(${task.id})">delete</button>
          </div>`;
    let elem = document.createElement("div");
    elem.innerHTML = node;
    taskList.append(elem.firstElementChild!);
  }
};
const getAllTasksFromDb = async (): Promise<Array<Task>> => {
  const transaction = db.transaction(TASK_STORE, "readonly");
  const store = transaction.objectStore(TASK_STORE);
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => {
      resolve(req.result);
    };
    req.onerror = () => {
      reject(req.error);
    };
  });
};

const deleteTask = async (id: number) => {
  try {
    await deleteTaskFromDb(id);
    generateTaskList(await getAllTasksFromDb());
  } catch (err) {
    console.error("Failed to delete task", err);
  }
};
//@ts-ignore
window.deleteTask = deleteTask;

const deleteTaskFromDb = async (id: number) => {
  const transaction = db.transaction(TASK_STORE, "readwrite");
  const store = transaction.objectStore(TASK_STORE);
  return new Promise((resolve, reject) => {
    const req = store.delete(id);
    req.onsuccess = () => {
      resolve(req.result);
    };
    req.onerror = () => {
      reject(req.error);
    };
  });
};

let db: IDBDatabase;
const tasksDb = indexedDB.open(TASK_STORE, 1);
tasksDb.onsuccess = () => {
  db = tasksDb.result;
  if (db.objectStoreNames.contains(TASK_STORE)) {
    const transaction = db.transaction([TASK_STORE, POINTS_STORE], "readonly");
    const tasks = transaction.objectStore(TASK_STORE);
    const points = transaction.objectStore(POINTS_STORE);
    const request = tasks.getAll();
    request.onsuccess = () => {
      generateTaskList(request.result);
    };
    const pointsReq = points.get(MAIN_POINTS_KEY);
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
  db.createObjectStore(TASK_STORE, { keyPath: "id", autoIncrement: true });
  const st = db.createObjectStore(POINTS_STORE, {
    keyPath: "id",
  });
  st.put({ val: 0, id: MAIN_POINTS_KEY });

  console.debug("DB created v1", db);
};
