<template>
  <div class="container">
    <div class="row">
      <Line ref="chartWrapper" :data="chartData" :options="options" />
    </div>
    <div class="row mt-4">
      <div class="col-2">
        <div class="dropdown">
          <button class="btn btn-secondary dropdown-toggle" type="button" id="serialPortSelector"
            data-bs-toggle="dropdown" @click="updateSerialPorts()" aria-expanded="false">
            Serial port
          </button>
          <ul class="dropdown-menu" aria-labelledby="serialPortSelector">
            <li v-for="port in serialPorts">
              <a class="dropdown-item" @click="selectSerialPort(port)">{{ port }}</a>
            </li>
          </ul>
        </div>
      </div>
      <div class="col-1">

      </div>
      <div class="col-5">
        <div class="input-group">
          <span class="input-group-text" id="basic-addon3">Bang duration (ms)</span>
          <input v-model="bangDuration" type="number" class="form-control" id="basic-url"
            aria-describedby="basic-addon3">
        </div>
      </div>
      <div class="col-2 d-grid">
        <button type="button" class="btn btn-outline-success" @click="sendBangCommand">Bang</button>
      </div>
      <div class="col-2 d-grid">
        <button type="button" class="btn btn-outline-primary" @mousedown="onHoldPress"
          @mouseup="onHoldRelease">Hold</button>
      </div>
    </div>
    <div class="row mt-4">
      <span>Selected port: {{ selectedSerialPort }}</span>
    </div>
    <div class="row mt-2">
      <span>Max value: {{ selectedSerialPort }}</span>
    </div>
    <div class="row mt-2">
      <span>Bang duration (ms): {{ bangDuration }}</span>
    </div>
    <div class="row mt-2">
      <div class="form-check form-switch ml-2">
        <label class="form-check-label" for="writeToLogsCheck">
          Write to logs
        </label>
        <input class="form-check-input" type="checkbox" v-model="writeToLogs" id="writeToLogsCheck">
      </div>
    </div>
    <div class="row mt-2">
      <div class="input-group">
        <span class="input-group-text" id="file-path">Logs file path</span>
        <input v-model="logFilePath" type="text" class="form-control" id="file-path-id" aria-describedby="file-path">
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, useTemplateRef, computed } from 'vue'
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, PointElement, LineElement, CategoryScale, LinearScale } from 'chart.js'

ChartJS.register(CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend);

const chartWrapper = ref(null)

let datasetData = [];
let dataLabels = [];

const chartData = {
  labels: [],
  datasets: [
    {
      label: 'Weight Sensor Data',
      backgroundColor: '#f87979',
      borderColor: "#1E90FF",
      tension: 0.5,
      pointRadius: 0,
      data: []
    }
  ]
};

const maxDataPoints = 250;

const options = ref({
  animation: {
    duration: 0
  }
});
const serialPorts = ref([]);
const selectedSerialPort = ref('');

const bangDuration = ref(50);

const writeToLogs = ref(false)
const logFilePath = ref('/Users/andrewsnigur/Downloads/test_stand_log_' + new Date().toISOString() + '.txt');

async function updateSerialPorts() {
  const ports = await window.serialAPI.list();
  serialPorts.value = ports.map((p) => p.path);
};

async function selectSerialPort(port) {
  selectedSerialPort.value = port;

  const result = await window.serialAPI.open(port, 9600);
  console.log(result);
}

const sendData = async (data) => {
  try {
    await window.serialAPI.write(data);
    appendToFile(cmd)
  } catch (err) {
    console.error('Write failed:', err);
  }
};

let counter = 1;
async function sendBangCommand() {
  writeToLogs.value = true;
  let cmd = 'b ' + bangDuration.value;
  //appendChartData('' + counter + ' ' + Math.random())
  counter++

  await sendData(cmd)
  console.log(bangDuration.value)
}

async function onHoldPress() {
  writeToLogs.value = true;
  await sendData('start')
  console.log('Button pressed');
}

async function onHoldRelease() {
  writeToLogs.value = true;
  await sendData('stop')
  console.log('Button released');
}

const appendToFile = (data) => {
  window.fileAPI.appendLine(logFilePath.value, data);
};

window.serialAPI.onData((data) => {
  //console.log(writeToLogs.value)
  if (writeToLogs.value)
    appendToFile(data)

    appendChartData(data);
  //messages.value.push(data.trim());
});

function appendChartData(data) {
  //appendToFile(data)
  let splited = data.split(' ')
  let chart = chartWrapper.value.chart;

  dataLabels.push(splited[0])
  datasetData.push(splited[1])
  if (datasetData.length > maxDataPoints) {
    dataLabels.shift();
    datasetData.shift();
  }

  chart.data.labels = dataLabels;
  chart.data.datasets[0].data = datasetData;
  chart.update()
}

</script>
