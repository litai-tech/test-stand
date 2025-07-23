<template>
  <div class="container">
    <div class="row">
      <Line :data="chartData" :options="options" />
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
          <input v-model="bangDuration" type="number" class="form-control" id="basic-url" aria-describedby="basic-addon3">
        </div>
      </div>
      <div class="col-2 d-grid">
        <button type="button" class="btn btn-outline-success" @click="sendBangCommand">Bang</button>
      </div>
      <div class="col-2 d-grid">
        <button type="button" class="btn btn-outline-primary" @mousedown="onHoldPress" @mouseup="onHoldRelease">Hold</button>
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, PointElement, LineElement, CategoryScale, LinearScale } from 'chart.js'

ChartJS.register(CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend);

const chartData = ref({
  labels: ['January', 'February', 'March', 'a', 'b', 'c'],
  datasets: [
    {
      label: 'Weight Sensor Data',
      backgroundColor: '#f87979',
      borderColor: "#1E90FF",
      tension: 0.5,
      pointRadius: 0,
      data: [40, 20, 12, 20, 45, 30]
    }
  ]
});

const options = ref({});
const serialPorts = ref([]);
const selectedSerialPort = ref('');

const bangDuration = ref(50);

async function updateSerialPorts() {
  const ports = await window.electron.ipcRenderer.invoke('serial:list');
  serialPorts.value = ports.map((p) => p.path);
};

function selectSerialPort(port) {
  selectedSerialPort.value = port;
}

function sendBangCommand() {
  console.log(bangDuration.value)
}

function onHoldPress() {
  console.log('Button pressed');
  // Set state, trigger logic, etc.
}

function onHoldRelease() {
  console.log('Button released');
  // Reset state, etc.
}
</script>
