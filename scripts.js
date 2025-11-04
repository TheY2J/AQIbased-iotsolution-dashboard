// Devices database
const devices = {
    'DEV001': { password: 'demo123', name: 'Downtown Station', location: 'City Center' },
    'DEV002': { password: 'demo123', name: 'Industrial Zone', location: 'East District' },
    'DEV003': { password: 'demo123', name: 'Residential Area', location: 'West Side' }
};

// Current readings state
let currentReadings = {
    aqi: 78,
    co2: 650,
    co: 3.2,
    o3: 45,
    voc: 180,
    pm25: 35,
    temperature: 24,
    humidity: 65
};

let notifications = [];
let aqiChart, pollutantsChart;
let updateInterval;

// Login handling
document.getElementById('loginBtn').addEventListener('click', handleLogin);
document.getElementById('password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleLogin();
});

function handleLogin() {
    const deviceId = document.getElementById('deviceId').value;
    const password = document.getElementById('password').value;
    
    if (devices[deviceId] && devices[deviceId].password === password) {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        
        // Set device info
        document.getElementById('deviceName').textContent = devices[deviceId].name;
        document.getElementById('deviceLocation').textContent = devices[deviceId].location;
        
        // Initialize dashboard
        initializeDashboard();
        startRealTimeUpdates();
    } else {
        alert('Invalid device ID or password');
    }
}

// Logout handling
document.getElementById('logoutBtn').addEventListener('click', () => {
    clearInterval(updateInterval);
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('deviceId').value = '';
    document.getElementById('password').value = '';
});

// Notification toggle
document.getElementById('notificationBtn').addEventListener('click', () => {
    const panel = document.getElementById('notificationsPanel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
});

// Initialize dashboard
function initializeDashboard() {
    updateDisplay();
    createCharts();
}

// Get AQI status
function getAQIStatus(aqi) {
    if (aqi <= 50) return { text: 'Good', class: 'good' };
    if (aqi <= 100) return { text: 'Moderate', class: 'moderate' };
    if (aqi <= 150) return { text: 'Unhealthy for Sensitive', class: 'unhealthy' };
    if (aqi <= 200) return { text: 'Unhealthy', class: 'unhealthy' };
    return { text: 'Very Unhealthy', class: 'unhealthy' };
}

// Update display
function updateDisplay() {
    const aqiValue = Math.round(currentReadings.aqi);
    const status = getAQIStatus(aqiValue);
    
    document.getElementById('aqiValue').textContent = aqiValue;
    const aqiStatusEl = document.getElementById('aqiStatus');
    aqiStatusEl.textContent = status.text;
    aqiStatusEl.className = 'aqi-status ' + status.class;
    
    document.getElementById('temperature').textContent = currentReadings.temperature.toFixed(1) + '°C';
    document.getElementById('humidity').textContent = Math.round(currentReadings.humidity) + '%';
    
    // Update prediction
    const predictedAQI = Math.floor(currentReadings.aqi * 1.05);
    document.getElementById('predictedAQI').textContent = predictedAQI;
    
    // Update pollutants
    updatePollutant('co2', currentReadings.co2, 1000, 'ppm');
    updatePollutant('co', currentReadings.co, 9, 'ppm');
    updatePollutant('o3', currentReadings.o3, 70, 'ppb');
    updatePollutant('voc', currentReadings.voc, 220, 'ppb');
    updatePollutant('pm25', currentReadings.pm25, 35, 'µg/m³');
}

// Update pollutant card
function updatePollutant(id, value, safeLimit, unit) {
    const valueEl = document.getElementById(id + 'Value');
    const statusEl = document.getElementById(id + 'Status');
    const cardEl = document.getElementById(id + 'Card');
    
    valueEl.textContent = value.toFixed(1);
    
    if (value > safeLimit) {
        statusEl.textContent = '⚠ High';
        statusEl.className = 'status-warning';
        cardEl.classList.add('warning');
    } else {
        statusEl.textContent = '✓ Normal';
        statusEl.className = 'status-normal';
        cardEl.classList.remove('warning');
    }
}

// Generate historical data
function generateHistoricalData(hours = 24) {
    const data = [];
    for (let i = hours; i > 0; i--) {
        data.push({
            time: i === 1 ? 'Now' : i + 'h',
            aqi: Math.floor(Math.random() * 100) + 50,
            co2: Math.floor(Math.random() * 300) + 400,
            pm25: Math.floor(Math.random() * 50) + 25,
            o3: Math.floor(Math.random() * 50) + 20,
            voc: Math.floor(Math.random() * 200) + 100
        });
    }
    return data;
}

// Create charts
function createCharts() {
    const historicalData = generateHistoricalData();
    
    // AQI Trend Chart
    const aqiCtx = document.getElementById('aqiChart').getContext('2d');
    aqiChart = new Chart(aqiCtx, {
        type: 'line',
        data: {
            labels: historicalData.map(d => d.time).reverse(),
            datasets: [{
                label: 'AQI',
                data: historicalData.map(d => d.aqi).reverse(),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(59, 130, 246, 0.1)'
                    },
                    ticks: {
                        color: '#93c5fd'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(59, 130, 246, 0.1)'
                    },
                    ticks: {
                        color: '#93c5fd'
                    }
                }
            }
        }
    });
    
    // Pollutants Comparison Chart
    const pollutantsCtx = document.getElementById('pollutantsChart').getContext('2d');
    pollutantsChart = new Chart(pollutantsCtx, {
        type: 'line',
        data: {
            labels: historicalData.map(d => d.time).reverse(),
            datasets: [
                {
                    label: 'PM2.5',
                    data: historicalData.map(d => d.pm25).reverse(),
                    borderColor: '#ef4444',
                    backgroundColor: 'transparent',
                    tension: 0.4,
                    borderWidth: 2
                },
                {
                    label: 'O₃',
                    data: historicalData.map(d => d.o3).reverse(),
                    borderColor: '#f59e0b',
                    backgroundColor: 'transparent',
                    tension: 0.4,
                    borderWidth: 2
                },
                {
                    label: 'VOCs',
                    data: historicalData.map(d => d.voc).reverse(),
                    borderColor: '#10b981',
                    backgroundColor: 'transparent',
                    tension: 0.4,
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#93c5fd'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(59, 130, 246, 0.1)'
                    },
                    ticks: {
                        color: '#93c5fd'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(59, 130, 246, 0.1)'
                    },
                    ticks: {
                        color: '#93c5fd'
                    }
                }
            }
        }
    });
}

// Start real-time updates
function startRealTimeUpdates() {
    updateInterval = setInterval(() => {
        // Simulate sensor data changes
        currentReadings = {
            aqi: Math.max(0, Math.min(500, currentReadings.aqi + (Math.random() - 0.5) * 10)),
            co2: Math.max(400, Math.min(2000, currentReadings.co2 + (Math.random() - 0.5) * 20)),
            co: Math.max(0, Math.min(50, currentReadings.co + (Math.random() - 0.5) * 0.5)),
            o3: Math.max(0, Math.min(200, currentReadings.o3 + (Math.random() - 0.5) * 5)),
            voc: Math.max(0, Math.min(500, currentReadings.voc + (Math.random() - 0.5) * 10)),
            pm25: Math.max(0, Math.min(500, currentReadings.pm25 + (Math.random() - 0.5) * 5)),
            temperature: Math.max(15, Math.min(35, currentReadings.temperature + (Math.random() - 0.5) * 0.5)),
            humidity: Math.max(30, Math.min(90, currentReadings.humidity + (Math.random() - 0.5) * 2))
        };
        
        updateDisplay();
        updateCharts();
        
        // Random notifications
        if (Math.random() > 0.95 && currentReadings.aqi > 75) {
            addNotification('AQI levels elevated - Check ventilation');
        }
    }, 3000);
}

// Update charts with new data
function updateCharts() {
    if (aqiChart && pollutantsChart) {
        // Add new data point
        const newTime = 'Now';
        
        // AQI Chart
        aqiChart.data.labels.shift();
        aqiChart.data.labels.push(newTime);
        aqiChart.data.datasets[0].data.shift();
        aqiChart.data.datasets[0].data.push(Math.round(currentReadings.aqi));
        aqiChart.update('none');
        
        // Pollutants Chart
        pollutantsChart.data.labels.shift();
        pollutantsChart.data.labels.push(newTime);
        pollutantsChart.data.datasets[0].data.shift();
        pollutantsChart.data.datasets[0].data.push(Math.round(currentReadings.pm25));
        pollutantsChart.data.datasets[1].data.shift();
        pollutantsChart.data.datasets[1].data.push(Math.round(currentReadings.o3));
        pollutantsChart.data.datasets[2].data.shift();
        pollutantsChart.data.datasets[2].data.push(Math.round(currentReadings.voc));
        pollutantsChart.update('none');
    }
}

// Add notification
function addNotification(message) {
    const notification = {
        id: Date.now(),
        message: message,
        time: new Date().toLocaleTimeString()
    };
    
    notifications.unshift(notification);
    if (notifications.length > 5) {
        notifications.pop();
    }
    
    updateNotifications();
}

// Update notifications display
function updateNotifications() {
    const badge = document.getElementById('notificationBadge');
    const list = document.getElementById('notificationsList');
    
    if (notifications.length > 0) {
        badge.style.display = 'block';
        
        list.innerHTML = notifications.map(notif => `
            <div class="notification-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <div class="notification-content">
                    <p class="notification-message">${notif.message}</p>
                    <p class="notification-time">${notif.time}</p>
                </div>
            </div>
        `).join('');
    } else {
        badge.style.display = 'none';
    }
}