const {CloudTasksClient} = require('@google-cloud/tasks').v2;

const parent = 'projects/main-471420/locations/europe-west1';

async function callListTasks(queue) {
  const tasksClient = new CloudTasksClient();
  const iterable = tasksClient.listTasksAsync({
    parent: `${parent}/queues/${q(queue)}`, 
    pageSize: 50
  });
  
  const tasks = [];
  for await (const response of iterable) {
      tasks.push(response);
  }
  return tasks;
}

async function callCreateQueue(queue) {
  const tasksClient = new CloudTasksClient();
  const request = {
    parent,
    queue: {
      ...default_queue,
      name: `${parent}/queues/${q(queue)}`
    }
  };
  return await tasksClient.createQueue(request);
}

async function callGetQueue(queue) {
  const tasksClient = new CloudTasksClient();
  const request = {
    name: `${parent}/queues/${q(queue)}`,
  };
  return await tasksClient.getQueue(request);
}

async function callCreateTask(queue, task) {
  const tasksClient = new CloudTasksClient();
  const request = {
    parent: `${parent}/queues/${q(queue)}`,
    task,
  };
  return await tasksClient.createTask(request);
}

async function callDeleteTask(queue, taskId) {
  const tasksClient = new CloudTasksClient();
  const request = {
    name: `${parent}/queues/${q(queue)}/tasks/${taskId}`,
  };

  // Run request
  return await tasksClient.deleteTask(request);
}

const q = queue => 'bookclass-' + queue;

const default_queue = {
    "name": "",
    "appEngineRoutingOverride": null,
    "rateLimits": {
        "maxDispatchesPerSecond": 1,
        "maxBurstSize": 10,
        "maxConcurrentDispatches": 1
    },
    "retryConfig": {
        "maxAttempts": 3,
        "maxRetryDuration": {
            "seconds": "10",
            "nanos": 0
        },
        "minBackoff": {
            "seconds": "0",
            "nanos": 100000000
        },
        "maxBackoff": {
            "seconds": "10",
            "nanos": 0
        },
        "maxDoublings": 16
    },
    "state": "RUNNING",
    "purgeTime": null,
    "stackdriverLoggingConfig": null
};

module.exports = {
  callListTasks,
  callCreateQueue,
  callGetQueue,
  callCreateTask,
  callDeleteTask
}
