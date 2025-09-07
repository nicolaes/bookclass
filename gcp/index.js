const functions = require('@google-cloud/functions-framework');
const {
  callListTasks,
  callCreateQueue,
  callGetQueue,
  callCreateTask,
  callDeleteTask
} = require('./helpers');
const axios = require('axios');


functions.http('helloHttp', async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    // Send response to OPTIONS requests
    res.set('Access-Control-Allow-Methods', 'GET,POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    return res.status(204).send('');
  }

  if (req.query.type === 'GET_TASKS') {
    const queue = req.query.queue;
    const tasksRes = await callListTasks(queue);
    const taskDtos = tasksRes.map(task => {
      const taskId = task.name.split('/').pop();
      return {
        id: taskId,
        url: task.httpRequest.url,
        body: task.httpRequest.body,
        scheduleTimestamp: task.scheduleTime.seconds
      };
    });

    return res.send(JSON.stringify(taskDtos));
  } else if (req.query.type === 'ADD_TASK') {
    const queue = req.query.queue;
    const {
      url, headers, body,
      scheduleTimestamp
    } = req.body;

    try {
      await callCreateQueue(queue);
    } catch (e) {}
    
    const task = {
      scheduleTime: {
        seconds: scheduleTimestamp,
        nanos: 0
      },
      httpRequest: {
        url,
        httpMethod: "POST",
        headers,
        body,
      }
    };
    await callCreateTask(queue, task);
    return res.send(JSON.stringify("OK"));
  } else if (req.query.type === 'DELETE_TASK') {
    const queue = req.query.queue;
    const taskId = req.query.taskId;

    await callDeleteTask(queue, taskId);
    return res.send(JSON.stringify('OK'));
  } else if (req.query.type === 'RUN_TASK') {
    const {
      url, method, headers, body
    } = req.body;

    const r = await axios({
      url,
      method,
      headers,
      data: body
    });
    return res.send(JSON.stringify(r.data));
  }

  res.send(JSON.stringify('No op'));
});
